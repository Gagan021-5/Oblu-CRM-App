from django.test import SimpleTestCase
from hrms.attendance_engine import wallet_field_for
from unittest.mock import Mock


class LeaveWalletMappingTest(SimpleTestCase):
    """
    A simple test case to demonstrate how automated testing works.
    This tests the 'wallet_field_for' function from attendance_engine.py.
    """

    def test_leave_code_mapping(self):
        # 1. Arrange: Create a mock leave type with code 'CL' (Casual Leave)
        mock_leave_type = Mock()
        mock_leave_type.code = 'CL'
        mock_leave_type.name = 'Casual Leave'

        # 2. Act: Call the engine function
        field_name = wallet_field_for(mock_leave_type)

        # 3. Assert: Verify the result is 'casual_leave'
        self.assertEqual(field_name, 'casual_leave')

    def test_sick_leave_mapping(self):
        mock_leave_type = Mock()
        mock_leave_type.code = 'SL'
        mock_leave_type.name = 'Sick Leave'

        field_name = wallet_field_for(mock_leave_type)

        self.assertEqual(field_name, 'sick_leave')

    def test_unknown_leave_returns_none(self):
        mock_leave_type = Mock()
        mock_leave_type.code = 'XYZ_UNKNOWN'
        mock_leave_type.name = 'Unknown Leave'

        field_name = wallet_field_for(mock_leave_type)

        self.assertIsNone(field_name)
