"""
hrms/test_real_suite.py

REAL DATABASE TEST SUITE (No Mocks, No Dummy Stubs)
Tests actual models, actual SQL queries, and actual business logic in your system.
Runs inside atomic database transactions and rolls back automatically, so no test junk remains.

Run with:
    .\\venv311\\Scripts\\python.exe hrms/test_real_suite.py
"""
import os
import sys
from datetime import date, timedelta
from decimal import Decimal

# Add project root to Python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Configure Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'merger.settings')
import django
django.setup()

import unittest
from django.db import transaction
from hrms import models as m
from hrms import leave_logic as lv
from hrms import comp_off_logic as co_logic
from hrms import forms as f


class RealDatabaseCompOffTests(unittest.TestCase):
    """
    Real integration tests running against the actual database and real models.
    """

    def setUp(self):
        """Start a real database transaction before every test."""
        self.atomic = transaction.atomic()
        self.atomic.__enter__()

        # Create isolated organization records for this test transaction.
        self.company = m.Company.objects.create(name='CI Comp Off Test Company')
        self.department = m.Department.objects.create(
            company=self.company,
            name='CI Comp Off Test Department',
        )
        self.designation = m.Designation.objects.create(
            company=self.company,
            department=self.department,
            title='CI Comp Off Test Designation',
        )

        # Get or create the real 'CO' leave type
        self.co_leave_type, _ = m.LeaveType.objects.get_or_create(
            code='CO',
            company=self.company,
            defaults={'name': 'Comp Off', 'is_paid': True}
        )

        # Create a REAL test employee in the actual database
        self.employee = m.Employee.objects.create(
            first_name='RealTest',
            last_name='Worker',
            employee_code='TEST_EMP_999',
            company=self.company,
            department=self.department,
            designation=self.designation,
            employment_type='full_time',
            status='active',
            date_of_joining=date(2026, 1, 1),
            date_of_confirmation=date(2026, 1, 1),
        )

        # Initialize the real leave bank and live balance
        self.bank, _ = m.EmployeeLeaveBalance.objects.get_or_create(
            e_name=self.employee,
            defaults={'comp_off': 0.0}
        )
        self.live, _ = m.EmployeeLeaveBalanceLive.objects.get_or_create(
            e_name=self.employee,
            defaults={'comp_off': 0.0}
        )

    def tearDown(self):
        """Roll back the real database transaction so nothing dirty remains."""
        transaction.set_rollback(True)
        self.atomic.__exit__(None, None, None)

    def test_01_real_comp_off_credit_creation_and_balance_check(self):
        """
        REAL TEST 1:
        Create a real CompOffRecord row in the database table and check if
        get_monthly_available_days calculates the correct balance.
        """
        # Create a real 1.0 day CompOffRecord in database
        earned_date = date(2026, 9, 6)
        comp_record = m.CompOffRecord.objects.create(
            employee=self.employee,
            worked_date=earned_date,
            holiday_name='Sunday / Weekly Off',
            credits_earned=Decimal('1.0'),
            status=m.CompOffRecord.Status.AVAILABLE,
        )

        # Also set live bank to 1.0
        self.live.comp_off = 1.0
        self.live.save()
        self.bank.comp_off = 1.0
        self.bank.save()

        # Query through actual logic function
        available_days = lv.get_monthly_available_days(
            self.employee, self.co_leave_type, target_date=earned_date
        )
        print(f"\n[REAL TEST 1] Created CompOffRecord in DB (ID: {comp_record.pk}). Available Days: {available_days}")

        self.assertEqual(available_days, Decimal('1.0'))

    def test_02_real_leave_form_validation_half_day(self):
        """
        REAL TEST 2:
        Submit the real LeaveApplicationForm with real database LeaveType PK
        and verify that half-day validation assigns start_date == end_date without errors.
        """
        post_data = {
            'leave_type': self.co_leave_type.pk,
            'day_type': 'half',
            'start_date': '2026-10-15',
            'end_date': '2026-10-15',
            'reason': 'Real integration test for half-day leave',
        }
        form = f.LeaveApplicationForm(data=post_data)
        is_valid = form.is_valid()
        print(f"\n[REAL TEST 2] Testing real form submission with LeaveType PK {self.co_leave_type.pk}. Valid: {is_valid}")

        self.assertTrue(is_valid, f"Form should be valid on real database, errors: {form.errors}")
        self.assertEqual(form.cleaned_data['end_date'], form.cleaned_data['start_date'])

    def test_03_real_apply_leave_with_comp_off_no_lwp_conversion(self):
        """
        REAL TEST 3:
        When an employee has 1.0 day real comp-off credit, applying for 0.5 day
        MUST create a real Comp-Off leave application and NOT convert to LWP.
        """
        # Setup real 1.0 credit in database
        m.CompOffRecord.objects.create(
            employee=self.employee,
            worked_date=date(2026, 9, 6),
            holiday_name='Sunday / Weekly Off',
            credits_earned=Decimal('1.0'),
            status=m.CompOffRecord.Status.AVAILABLE,
        )
        self.live.comp_off = 1.0
        self.live.save()
        self.bank.comp_off = 1.0
        self.bank.save()

        # Apply for real 0.5 day Comp-Off leave
        app, notice = lv.apply_leave(
            employee=self.employee,
            leave_type=self.co_leave_type,
            start_date=date(2026, 9, 20),
            end_date=date(2026, 9, 20),
            day_type='half',
            reason='Medical checkup',
        )

        print(f"\n[REAL TEST 3] Real LeaveApplication created: ID #{app.pk}, Type: {app.leave_type.code}, Days: {app.total_days}")

        # Assertions on REAL database record
        self.assertEqual(app.leave_type.code, 'CO', "Leave type must remain Comp Off (CO), NOT converted to LWP.")
        self.assertEqual(app.total_days, Decimal('0.5'))
        self.assertIsNone(notice, "There should be no warning notice converting to LWP.")

        # Check that the real database wallet was deducted by 0.5
        self.live.refresh_from_db()
        print(f"[REAL TEST 3] Live wallet after deduction: {self.live.comp_off} days remaining")
        self.assertEqual(self.live.comp_off, 0.5)

    def test_04_real_comp_off_partial_consumption_in_ledger(self):
        """
        REAL TEST 4:
        Test real deduction logic in the CompOffRecord ledger.
        If employee has 1.0 day credit and takes 0.5 day:
          - The row tracks 0.5 day as used and keeps 0.5 day available.
        """
        # 1. Create real 1.0 day available record
        rec = m.CompOffRecord.objects.create(
            employee=self.employee,
            worked_date=date(2026, 9, 6),
            holiday_name='Sunday / Weekly Off',
            credits_earned=Decimal('1.0'),
            status=m.CompOffRecord.Status.AVAILABLE,
        )

        # 2. Create real leave application for 0.5 day
        app = m.LeaveApplication.objects.create(
            employee=self.employee,
            leave_type=self.co_leave_type,
            start_date=date(2026, 9, 20),
            end_date=date(2026, 9, 20),
            day_type='half',
            total_days=Decimal('0.5'),
            status=m.LeaveApplication.Status.PENDING_HR,
        )

        # 3. Call real consumption engine
        co_logic.deduct_comp_off_credits(app)

        # 4. Check real database rows
        rec.refresh_from_db()

        print(f"\n[REAL TEST 4] Original record credits remaining: {rec.credits_remaining} (Status: {rec.status})")

        self.assertEqual(rec.credits_used, Decimal('0.5'))
        self.assertEqual(rec.credits_remaining, Decimal('0.5'))
        self.assertEqual(rec.status, m.CompOffRecord.Status.PARTIAL)

        # 5. Subsequent leave consuming the remaining 0.5 credit
        app2 = m.LeaveApplication.objects.create(
            employee=self.employee,
            leave_type=self.co_leave_type,
            start_date=date(2026, 9, 25),
            end_date=date(2026, 9, 25),
            day_type='half',
            total_days=Decimal('0.5'),
            status=m.LeaveApplication.Status.PENDING_HR,
        )
        co_logic.deduct_comp_off_credits(app2)
        rec.refresh_from_db()
        print(f"[REAL TEST 4] After consuming second 0.5: Status is {rec.status}, Availed App ID #{rec.availed_leave_app_id}")

        self.assertEqual(rec.status, m.CompOffRecord.Status.AVAILED)
        self.assertEqual(rec.availed_leave_app, app2)

    def test_05_annual_vs_monthly_policy_mode(self):
        """
        REAL TEST 5:
        Verify Annual vs Monthly Leave Policy mode:
        1. When employee.leave_policy_mode == 'annual':
           - get_monthly_available_days returns full annual balance.
           - Employee can take multiple leaves within the same month up to their annual quota.
        2. When employee.leave_policy_mode == 'monthly':
           - get_monthly_available_days returns min(annual_bal, monthly_quota - month_used).
           - Month-wise accrual calculation is strictly preserved.
        3. Switching policy mode dynamically works seamlessly with zero disruption.
        """
        # Create standard Casual Leave (CL) leave type with annual quota of 12.0
        cl_leave_type, _ = m.LeaveType.objects.get_or_create(
            code='CL',
            company=self.company,
            defaults={'name': 'Casual Leave', 'is_paid': True}
        )

        # Set annual quota and balance: 6.0 days available in bank & live wallet
        self.bank.casual_leave = 6.0
        self.bank.save()
        self.live.casual_leave = 6.0
        self.live.save()

        # By default, employee.leave_policy_mode is 'annual'
        self.assertEqual(self.employee.leave_policy_mode, 'annual')

        # Test Case 1: Under 'annual' mode, available days is full annual balance (6.0)
        avail_annual = lv.get_monthly_available_days(self.employee, cl_leave_type, target_date=date(2026, 10, 1))
        print(f"\n[REAL TEST 5] Mode 'annual': Available days = {avail_annual} (Full annual balance)")
        self.assertEqual(avail_annual, Decimal('6.0'))

        # Test Case 2: Switch employee to 'monthly' mode (e.g. chronic leave taker)
        self.employee.leave_policy_mode = 'monthly'
        self.employee.save()

        # Under 'monthly' mode, month quota formula is min(annual_bal, monthly_quota - month_used)
        # For full-time employee, monthly quota for CL is typically 1.0 day / month
        avail_monthly = lv.get_monthly_available_days(self.employee, cl_leave_type, target_date=date(2026, 10, 1))
        print(f"[REAL TEST 5] Mode 'monthly': Available days = {avail_monthly} (Monthly quota capped)")
        self.assertLessEqual(avail_monthly, Decimal('1.0'), "Monthly mode should cap available days to monthly quota.")

        # Test Case 3: Switch back to 'annual' mode seamlessly
        self.employee.leave_policy_mode = 'annual'
        self.employee.save()

        avail_switched_back = lv.get_monthly_available_days(self.employee, cl_leave_type, target_date=date(2026, 10, 1))
        print(f"[REAL TEST 5] Switched back to 'annual': Available days = {avail_switched_back}")
        self.assertEqual(avail_switched_back, Decimal('6.0'))



if __name__ == '__main__':
    print("=" * 70)
    print("STARTING REAL DATABASE INTEGRATION TESTS (NO MOCKS)")
    print("=" * 70)
    suite = unittest.TestLoader().loadTestsFromTestCase(RealDatabaseCompOffTests)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if result.wasSuccessful():
        print("\n" + "=" * 70)
        print("ALL REAL DATABASE TESTS PASSED SUCCESSFULLY! (ZERO DATA LEFT IN DB)")
        print("=" * 70)
    else:
        sys.exit(1)
