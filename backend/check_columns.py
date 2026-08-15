# check_columns.py
import os
import django

# Configurer Django avant d'importer les modèles
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY column_name;")
    columns = [row[0] for row in cursor.fetchall()]
    print('Colonnes dans users:')
    for col in columns:
        print(f'  - {col}')
    if 'preferred_language' in columns:
        print('✅ preferred_language existe !')
    else:
        print('❌ preferred_language manque encore')