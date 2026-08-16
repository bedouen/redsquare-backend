#!/usr/bin/env python
"""
Script pour initialiser les catégories du site e-commerce RedSquare.

Usage :
    python seed_categories.py
    python seed_categories.py --force
    python seed_categories.py --dry-run
"""

import os
import sys
from pathlib import Path

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 1 : Configurer Django AVANT d'importer les modèles
# ═══════════════════════════════════════════════════════════════

current_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(current_dir))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

print(f"📁 Module de configuration : {os.environ.get('DJANGO_SETTINGS_MODULE')}")

try:
    import django
    django.setup()
    print("✅ Django configuré avec succès\n")
except Exception as e:
    print(f"❌ Erreur lors du chargement de Django : {e}")
    print("\nEssayez de définir manuellement :")
    print("  set DJANGO_SETTINGS_MODULE=config.settings")
    print("  python seed_categories.py")
    sys.exit(1)

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 2 : Importer les modèles
# ═══════════════════════════════════════════════════════════════

from django.contrib.auth import get_user_model
from django.db import transaction
from catalog.models import Category

User = get_user_model()

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 3 : Données
# ═══════════════════════════════════════════════════════════════

CATEGORY_NAMES = [
    "Électronique",
    "Mode & Vêtements",
    "Maison & Cuisine",
    "Beauté & Cosmétiques",
    "Chaussures",
    "Téléphonie & Accessoires",
    "Épicerie & Alimentation",
    "Sport & Loisirs",
    "Alimentation et Boissons",
    "Automobile",
    "Bijoux et Montres",
    "Informatique et Logiciels",
    "Jouets et Jeux",
    "Livres et Médias",
    "Maison et Jardin",
    "Santé et Beauté",
    "Vêtements et Accessoires",
]

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 4 : Fonction principale
# ═══════════════════════════════════════════════════════════════

def get_super_admin():
    """Récupère le premier Super-Admin disponible."""
    super_admin = User.objects.filter(is_superuser=True).first()
    if super_admin:
        print("ℹ️ Utilisation du superutilisateur Django (is_superuser=True)")
        return super_admin
    
    raise Exception(
        "Aucun Super-Admin trouvé. Veuillez en créer un avec :\n"
        "  python manage.py createsuperuser"
    )

@transaction.atomic
def seed_categories(force=False, dry_run=False):
    """Fonction principale de seeding des catégories."""
    print("=" * 60)
    print("🚀 REDSQUARE - Initialisation des catégories")
    print("=" * 60)
    
    if dry_run:
        print("🔍 Mode DRY-RUN : aucune modification réelle.\n")
    
    try:
        super_admin = get_super_admin()
    except Exception as e:
        print(f"❌ {e}")
        return {'success': False, 'error': str(e)}
    
    print(f"\n✅ Super-Admin sélectionné :")
    print(f"   • ID : {super_admin.id}")
    if hasattr(super_admin, 'phone_number'):
        print(f"   • Téléphone : {super_admin.phone_number}")
    print("")
    
    if force and not dry_run:
        count = Category.objects.count()
        if count > 0:
            print(f"⚠️ Suppression de {count} catégorie(s) existante(s)...")
            Category.objects.all().delete()
            print(f"✅ {count} catégorie(s) supprimée(s).\n")
    
    stats = {'created': 0, 'existing': 0, 'updated': 0, 'total': 0}
    
    print("📦 Création des catégories :")
    print("-" * 50)
    
    for name in CATEGORY_NAMES:
        if dry_run:
            print(f"  🔍 [SIMULATION] Catégorie « {name} » sera créée.")
            stats['created'] += 1
            continue
        
        try:
            category, created = Category.objects.get_or_create(
                name=name,
                defaults={"created_by": super_admin}
            )
            
            if created:
                stats['created'] += 1
                print(f"  ✅ Catégorie « {name} » créée.")
            else:
                if force and category.created_by != super_admin:
                    category.created_by = super_admin
                    category.save(update_fields=['created_by'])
                    stats['updated'] += 1
                    print(f"  🔄 « {name} » mise à jour.")
                else:
                    stats['existing'] += 1
                    print(f"  ⏭️  « {name} » existe déjà.")
        
        except Exception as e:
            print(f"  ❌ Erreur pour « {name} » : {e}")
    
    stats['total'] = Category.objects.count()
    
    print("-" * 50)
    print("\n📊 RÉSULTAT :")
    print(f"  • Catégories créées : {stats['created']}")
    if stats['existing'] > 0:
        print(f"  • Catégories existantes : {stats['existing']}")
    print(f"  • Total dans la base : {stats['total']} catégories.")
    
    stats['success'] = True
    return stats


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Initialise les catégories du site e-commerce RedSquare."
    )
    parser.add_argument('--force', action='store_true', help='Supprime et recrée toutes les catégories.')
    parser.add_argument('--dry-run', action='store_true', help='Simule l\'exécution sans modifier la base.')
    
    args = parser.parse_args()
    
    try:
        result = seed_categories(force=args.force, dry_run=args.dry_run)
        sys.exit(0 if result.get('success', False) else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Interruption par l'utilisateur.")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Erreur inattendue : {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)