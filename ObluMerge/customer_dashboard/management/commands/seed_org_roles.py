import sys
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from customer_dashboard.models import SalesPerson

User = get_user_model()

TEST_USERS = [
    # ADMIN (NITIN, AKSHAY)
    {
        "username": "Nitin_Aggarwal",
        "name": "Nitin Aggarwal",
        "email": "nitin.aggarwal@oblu.in",
        "is_staff": True,
        "is_superuser": True,
        "role_category": "admin",
        "manager": None,
    },
    {
        "username": "Akshay_Narayan",
        "name": "Akshay Narayan",
        "email": "akshay.narayan@oblu.in",
        "is_staff": True,
        "is_superuser": True,
        "role_category": "admin",
        "manager": None,
    },
    # SALES MGR (BHAVYA)
    {
        "username": "Bhavya_Bhardwaj",
        "name": "Bhavya Bhardwaj",
        "email": "bhavya.bhardwaj@oblu.in",
        "is_staff": False,
        "is_superuser": False,
        "role_category": "sales_mgr",
        "manager": "Nitin",
    },
    # BUSS. MGR (VIBHUTI)
    {
        "username": "vibhuti_panwar",
        "name": "Vibhuti Panwar",
        "email": "vibhuti.panwar@oblu.in",
        "is_staff": False,
        "is_superuser": False,
        "role_category": "buss_mgr",
        "manager": "Nitin",
    },
    # HR (VANSHIKA, ANSHIKA)
    {
        "username": "vanshika",
        "name": "Vanshika",
        "email": "vanshika.hr@oblu.in",
        "is_staff": False,
        "is_superuser": False,
        "role_category": "hr",
        "manager": None,
    },
    {
        "username": "anshika",
        "name": "Anshika",
        "email": "anshika.hr@oblu.in",
        "is_staff": False,
        "is_superuser": False,
        "role_category": "hr",
        "manager": None,
    },
    # ACCOUNTS & OPERATIONS (SUJAL, NEHA, SANYAM)
    {
        "username": "sujal_wadhwa",
        "name": "Sujal Wadhwa",
        "email": "sujal.wadhwa@oblu.in",
        "is_staff": False,
        "is_superuser": False,
        "is_accountant": True,
        "role_category": "accounts_ops",
        "manager": None,
    },
    {
        "username": "neha_sharma",
        "name": "Neha Sharma",
        "email": "neha.sharma@oblu.in",
        "is_staff": False,
        "is_superuser": False,
        "is_accountant": True,
        "role_category": "accounts_ops",
        "manager": None,
    },
    {
        "username": "sanyam_arora",
        "name": "Sanyam Arora",
        "email": "sanyam.arora@oblu.in",
        "is_staff": False,
        "is_superuser": False,
        "is_accountant": True,
        "role_category": "accounts_ops",
        "manager": None,
    },
    # Warehouse (VIKAS, VIVEK)
    {
        "username": "vikas",
        "name": "Vikas",
        "email": "vikas.warehouse@oblu.in",
        "is_staff": False,
        "is_superuser": False,
        "role_category": "warehouse",
        "manager": None,
    },
    {
        "username": "vivek",
        "name": "Vivek",
        "email": "vivek.warehouse@oblu.in",
        "is_staff": False,
        "is_superuser": False,
        "role_category": "warehouse",
        "manager": None,
    },
    # RSM (ANKUSH)
    {
        "username": "Ankush_Oblu",
        "name": "Ankush Oblu",
        "email": "ankush.oblu@oblu.in",
        "is_staff": False,
        "is_superuser": False,
        "role_category": "rsm_ankush",
        "manager": "Bhavya",
    },
    # RSM (AMAN)
    {
        "username": "Aman_Poddar",
        "name": "Aman Poddar",
        "email": "aman.poddar@oblu.in",
        "is_staff": False,
        "is_superuser": False,
        "role_category": "rsm_aman",
        "manager": "Bhavya",
    },
    # ASM under Aman (KAUSHIK, RUSHIKESH)
    {
        "username": "Kaushik_Tiwari",
        "name": "Kaushik Tiwari",
        "email": "kaushik.tiwari@oblu.in",
        "is_staff": False,
        "is_superuser": False,
        "role_category": "asm",
        "manager": "Aman",
    },
    {
        "username": "Dhornala_Rushikesh",
        "name": "Rushikesh Dhornala",
        "email": "rushikesh.obluhc@gmail.com",
        "is_staff": False,
        "is_superuser": False,
        "role_category": "asm",
        "manager": "Aman",
    },
    # ASM under Ankush (NAVEEN, SATISH)
    {
        "username": "Naveen_K",
        "name": "Naveen K",
        "email": "naveen.k@oblu.in",
        "is_staff": False,
        "is_superuser": False,
        "role_category": "asm",
        "manager": "Ankush",
    },
    {
        "username": "Satish_Kumar",
        "name": "Satish Kumar",
        "email": "satish.kumar@oblu.in",
        "is_staff": False,
        "is_superuser": False,
        "role_category": "asm",
        "manager": "Ankush",
    },
]

class Command(BaseCommand):
    help = "Seed or update dummy test users for all roles from the organization diagram."

    def handle(self, *args, **options):
        self.stdout.write("Seeding dummy test users with password 'test1234'...")
        password = "test1234"

        created_count = 0
        updated_count = 0

        for udata in TEST_USERS:
            username = udata["username"]
            user, created = User.objects.get_or_create(username=username)

            user.set_password(password)
            user.email = udata["email"]
            user.is_staff = udata.get("is_staff", False)
            user.is_superuser = udata.get("is_superuser", False)
            if hasattr(user, "is_accountant"):
                user.is_accountant = udata.get("is_accountant", False)
            user.save()

            # Ensure SalesPerson profile exists and is linked
            sp_name = udata["name"]
            sp, _ = SalesPerson.objects.get_or_create(name=sp_name)
            sp.user = user
            sp.save()

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  + Created: {username} ({udata['role_category']})"))
            else:
                updated_count += 1
                self.stdout.write(self.style.NOTICE(f"  ~ Updated password: {username} ({udata['role_category']})"))

        # Second pass: link manager on SalesPerson
        for udata in TEST_USERS:
            mgr_str = udata.get("manager")
            if mgr_str:
                try:
                    sps = SalesPerson.objects.filter(user__username=udata["username"])
                    mgr_sp = SalesPerson.objects.filter(name__iexact=mgr_str).first() or SalesPerson.objects.filter(name__icontains=mgr_str).first()
                    if mgr_sp:
                        for sp in sps:
                            if sp.id != mgr_sp.id:
                                sp.manager = mgr_sp
                                sp.save()
                        self.stdout.write(f"  -> Linked {udata['username']} manager to {mgr_sp.name}")
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  ! Could not link manager {mgr_str}: {e}"))

        self.stdout.write(
            self.style.SUCCESS(
                f"\nSuccessfully configured all test users! Created: {created_count}, Updated: {updated_count}. Password: '{password}'"
            )
        )
