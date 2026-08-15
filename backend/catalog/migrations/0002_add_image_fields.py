# catalog/migrations/0002_add_image_fields.py
from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='image_front',
            field=models.ImageField(
                blank=False, 
                null=False, 
                upload_to='products/front/',
                default='products/default.jpg'  # ✅ AJOUTER UNE VALEUR PAR DÉFAUT
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='product',
            name='image_left',
            field=models.ImageField(blank=True, null=True, upload_to='products/left/'),
        ),
        migrations.AddField(
            model_name='product',
            name='image_top',
            field=models.ImageField(blank=True, null=True, upload_to='products/top/'),
        ),
        migrations.AddField(
            model_name='product',
            name='image_right',
            field=models.ImageField(blank=True, null=True, upload_to='products/right/'),
        ),
    ]