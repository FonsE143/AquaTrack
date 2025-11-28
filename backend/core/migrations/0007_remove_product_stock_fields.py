from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0006_remove_user_role'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='product',
            name='stock_full',
        ),
        migrations.RemoveField(
            model_name='product',
            name='stock_empty',
        ),
        migrations.RemoveField(
            model_name='product',
            name='threshold',
        ),
    ]