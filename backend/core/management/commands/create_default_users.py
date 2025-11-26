from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Profile

User = get_user_model()


def ensure_profile(user, role, first_name='', last_name='', phone='', address=''):
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = role
    profile.first_name = first_name
    profile.last_name = last_name
    profile.email = user.email
    profile.phone = phone
    profile.address = address
    profile.save()


class Command(BaseCommand):
    help = 'Create default users (admin, staff, driver, customer) if they do not exist'

    def handle(self, *args, **options):
        created = []

        admin, was = User.objects.get_or_create(username='admin1', defaults={'email': 'admin@example.com', 'first_name': 'Aqua', 'last_name': 'Admin'})
        if was:
            admin.set_password('Admin@123')
            admin.is_superuser = True
            admin.is_staff = True
            admin.save()
            created.append(('admin', 'admin1', 'Admin@123'))
        ensure_profile(admin, 'admin', 'Aqua', 'Admin', '0917-000-0000', 'Station HQ')

        staff, was = User.objects.get_or_create(username='staff1', defaults={'email': 'staff@example.com', 'first_name': 'Sam', 'last_name': 'Dispatcher'})
        if was:
            staff.set_password('Staff@123')
            staff.save()
            created.append(('staff', 'staff1', 'Staff@123'))
        ensure_profile(staff, 'staff', 'Sam', 'Dispatcher', '0917-111-1111', 'Dispatch')

        driver, was = User.objects.get_or_create(username='driver1', defaults={'email': 'driver@example.com', 'first_name': 'D', 'last_name': 'Driver'})
        if was:
            driver.set_password('Driver@123')
            driver.save()
            created.append(('driver', 'driver1', 'Driver@123'))
        ensure_profile(driver, 'driver', 'D', 'Driver', '0917-333-3333', 'Driver HQ')

        cust, was = User.objects.get_or_create(username='cust1', defaults={'email': 'cust@example.com', 'first_name': 'Cathy', 'last_name': 'Customer'})
        if was:
            cust.set_password('Customer@123')
            cust.save()
            created.append(('customer', 'cust1', 'Customer@123'))
        ensure_profile(cust, 'customer', 'Cathy', 'Customer', '0917-222-2222', 'Barangay 123')

        for role, username, pwd in created:
            self.stdout.write(self.style.SUCCESS(f'Created {role} user: {username} / {pwd}'))

        if not created:
            self.stdout.write(self.style.NOTICE('No new users were created; defaults already exist.'))
