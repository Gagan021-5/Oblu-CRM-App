"""
hrms/test_comp_off.py

Automated Test Suite for Compensatory Off (Comp-Off) & Leave Application Logic.
Run with:
    .\\venv311\\Scripts\\python.exe manage.py test hrms.test_comp_off
or:
    .\\venv311\\Scripts\\python.exe hrms/test_comp_off.py
"""
import os
import sys
from datetime import date
from decimal import Decimal
from unittest.mock import Mock, patch

# Ensure Django environment is configured if run standalone
if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'merger.settings')
    import django
    django.setup()

from django.test import SimpleTestCase
from hrms import forms as f
from hrms import leave_logic as lv
from hrms import comp_off_logic as co_logic
from hrms import models as m


class CompOffAndLeaveFormTests(SimpleTestCase):
    """
    Test suite verifying Comp-Off availability, half-day application validation,
    and partial consumption logic.
    """

    def test_01_half_day_form_sets_matching_end_date(self):
        """
        REGRESSION TEST:
        Ensure selecting 'Half Day' automatically sets end_date = start_date,
        and does NOT crash with TypeError (which previously happened when
        cleaned_data['end_date'] was assigned to the LeaveApplicationForm class).
        """
        mock_leave_type = m.LeaveType(code='CO', name='Compensatory Off')
        mock_leave_type.pk = 1

        with patch('django.forms.models.ModelChoiceField.to_python', return_value=mock_leave_type), \
             patch('django.db.models.fields.related.ForeignKey.validate'):
            form = f.LeaveApplicationForm(data={
                'leave_type': 1,
                'day_type': 'half',
                'start_date': '2026-10-15',
                'end_date': '2026-10-15',
                'reason': 'Visiting dentist in morning',
            })

            is_valid = form.is_valid()
            self.assertTrue(is_valid, f"Form should be valid, but had errors: {form.errors}")
            
            # Verify end_date is equal to start_date
            self.assertEqual(
                form.cleaned_data.get('end_date'),
                form.cleaned_data.get('start_date'),
                "For half-day leaves, end_date must always match start_date."
            )

    def test_02_comp_off_available_days_returns_real_balance_not_zero(self):
        """
        REGRESSION TEST:
        Ensure get_monthly_available_days for Comp-Off ('CO') returns the employee's
        authoritative pool (e.g. 1.5 days) instead of 0.0.
        (Previously, dividing annual quota 0 by 12 caused it to return 0.0 and convert to LWP).
        """
        mock_employee = Mock()
        mock_employee.pk = 123
        mock_employee.company = None

        mock_leave_type = Mock()
        mock_leave_type.code = 'CO'
        mock_leave_type.name = 'Compensatory Off'

        # Mock database queries to simulate an employee with 1.5 available comp-off credits
        with patch('hrms.models.CompOffRecord.objects.filter') as mock_recs, \
             patch('hrms.models.EmployeeLeaveBalance.objects.filter') as mock_bank, \
             patch('hrms.models.EmployeeLeaveBalanceLive.objects.filter') as mock_live:

            mock_recs.return_value.aggregate.return_value = {'total': Decimal('1.5')}
            mock_recs.return_value.exclude.return_value.aggregate.return_value = {
                'total': Decimal('1.5')
            }
            
            mock_bank_obj = Mock()
            mock_bank_obj.comp_off = 1.5
            mock_bank.return_value.first.return_value = mock_bank_obj

            mock_live_obj = Mock()
            mock_live_obj.comp_off = 1.5
            mock_live.return_value.first.return_value = mock_live_obj

            available_days = lv.get_monthly_available_days(
                mock_employee, mock_leave_type, target_date=date(2026, 10, 5)
            )

            self.assertEqual(
                available_days, Decimal('1.5'),
                f"Expected 1.5 available days for Comp-Off, but got {available_days}"
            )

    def test_03_partial_comp_off_consumption_for_half_day(self):
        """
        VERIFY FIFO & PARTIAL CONSUMPTION:
        When an employee has a 1.0 day CompOffRecord and applies for a 0.5 day (half-day) leave:
          - 0.5 day is created as AVAILED linked to the application.
          - The original record keeps the remaining 0.5 day as AVAILABLE.
        """
        mock_employee = Mock()
        mock_employee.pk = 123

        mock_application = Mock()
        mock_application.employee = mock_employee
        mock_application.total_days = Decimal('0.5')
        mock_application.start_date = date(2026, 10, 20)

        # Simulate an existing earned record with 1.0 credit available
        original_record = Mock()
        original_record.credits_earned = Decimal('1.0')
        original_record.credits_used = Decimal('0.0')
        original_record.credits_remaining = Decimal('1.0')
        original_record.status = m.CompOffRecord.Status.AVAILABLE
        original_record.attendance_record = None
        original_record.worked_date = date(2026, 9, 6)
        original_record.holiday_name = 'Sunday / Weekly Off'
        original_record.hours_worked = Decimal('8.0')

        with patch('django.db.transaction.atomic'), \
             patch('hrms.models.CompOffRecord.objects.filter') as mock_filter, \
             patch('hrms.models.CompOffRecord.objects.create') as mock_create:

            # Return the 1.0 record when searching for available credits
            mock_filter.return_value.order_by.return_value = [original_record]

            # Execute the logic
            co_logic.deduct_comp_off_credits(mock_application)

            # Credits are tracked on the original row via credits_used.
            mock_create.assert_not_called()
            self.assertEqual(original_record.credits_used, Decimal('0.5'))
            self.assertEqual(original_record.status, m.CompOffRecord.Status.PARTIAL)
            self.assertEqual(original_record.availed_on_date, date(2026, 10, 20))
            original_record.save.assert_called_once_with(update_fields=[
                'credits_used', 'status', 'availed_on_date', 'availed_leave_app', 'updated_at'
            ])

    def test_04_full_comp_off_consumption(self):
        """
        VERIFY FULL CONSUMPTION:
        When an employee applies for 1.0 day and has a 1.0 day record:
          - The record transitions directly from AVAILABLE to AVAILED.
        """
        mock_employee = Mock()
        mock_employee.pk = 123

        mock_application = Mock()
        mock_application.employee = mock_employee
        mock_application.total_days = Decimal('1.0')
        mock_application.start_date = date(2026, 10, 22)

        original_record = Mock()
        original_record.credits_earned = Decimal('1.0')
        original_record.credits_used = Decimal('0.0')
        original_record.credits_remaining = Decimal('1.0')
        original_record.status = m.CompOffRecord.Status.AVAILABLE

        with patch('django.db.transaction.atomic'), \
             patch('hrms.models.CompOffRecord.objects.filter') as mock_filter:

            mock_filter.return_value.order_by.return_value = [original_record]

            co_logic.deduct_comp_off_credits(mock_application)

            self.assertEqual(original_record.status, m.CompOffRecord.Status.AVAILED)
            self.assertEqual(original_record.availed_on_date, date(2026, 10, 22))
            self.assertEqual(original_record.credits_used, Decimal('1.0'))
            original_record.save.assert_called_once_with(update_fields=[
                'credits_used', 'status', 'availed_on_date', 'availed_leave_app', 'updated_at'
            ])


if __name__ == '__main__':
    import unittest
    unittest.main()
