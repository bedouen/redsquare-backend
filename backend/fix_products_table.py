# fix_products_table_simple.py
import os
import sys
from pathlib import Path

# Configurer Django
current_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(current_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.db import connection
from catalog.models import Product

print("🔧 Création de la table products...")

try:
    with connection.schema_editor() as schema_editor:
        schema_editor.create_model(Product)
    print("✅ Table products créée avec succès !")
except Exception as e:
    print(f"⚠️ Erreur: {e}")
    
    # Tentative avec SQL direct
    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS products (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(200) NOT NULL,
                    description TEXT,
                    quantity INTEGER NOT NULL DEFAULT 0,
                    unit_price DECIMAL(12,2) NOT NULL,
                    category_id UUID NOT NULL,
                    created_by_id UUID NOT NULL,
                    image_front VARCHAR(200) NOT NULL DEFAULT 'products/default.jpg',
                    image_left VARCHAR(200) NULL,
                    image_top VARCHAR(200) NULL,
                    image_right VARCHAR(200) NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            """)
            print("✅ Table products créée via SQL !")
    except Exception as e2:
        print(f"❌ Erreur: {e2}")

print("\n✅ Terminé !")