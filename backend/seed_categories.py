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

# Ajouter le répertoire courant au PYTHONPATH
current_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(current_dir))

# 🔥 IMPORTANT : Utiliser 'config.settings' car settings.py est dans le dossier config/
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
    """
    Récupère le premier Super-Admin disponible.
    
    Returns:
        User: L'utilisateur Super-Admin.
    
    Raises:
        Exception: Si aucun Super-Admin n'est trouvé.
    """
    # Essayer avec le rôle personnalisé (si défini dans User)
    try:
        if hasattr(User, 'Role') and hasattr(User.Role, 'SUPER_ADMIN'):
            super_admin = User.objects.filter(role=User.Role.SUPER_ADMIN).first()
            if super_admin:
                return super_admin
    except AttributeError:
        pass
    
    # Fallback: Utiliser le superuser Django standard
    super_admin = User.objects.filter(is_superuser=True).first()
    if super_admin:
        print("ℹ️ Utilisation du superutilisateur Django (is_superuser=True)")
        return super_admin
    
    # Si on a un champ 'role' sans enum
    if hasattr(User, 'role'):
        super_admin = User.objects.filter(role='super_admin').first()
        if super_admin:
            return super_admin
    
    raise Exception(
        "Aucun Super-Admin trouvé. Veuillez en créer un avec :\n"
        "  python manage.py createsuperuser\n"
        "Ou :\n"
        "  python manage.py shell -c \"from django.contrib.auth import get_user_model; "
        "User = get_user_model(); User.objects.create_superuser('admin', 'admin@test.com', 'admin123')\""
    )


@transaction.atomic
def seed_categories(force=False, dry_run=False):
    """
    Fonction principale de seeding des catégories.
    
    Args:
        force (bool): Si True, supprime et recrée toutes les catégories.
        dry_run (bool): Si True, simule sans modifier la base.
    
    Returns:
        dict: Statistiques des opérations.
    """
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
    
    # Afficher les infos du Super-Admin
    print(f"\n✅ Super-Admin sélectionné :")
    print(f"   • ID : {super_admin.id}")
    
    if hasattr(super_admin, 'phone_number'):
        print(f"   • Téléphone : {super_admin.phone_number}")
    
    if hasattr(super_admin, 'email'):
        print(f"   • Email : {super_admin.email}")
    
    if hasattr(super_admin, 'username'):
        print(f"   • Username : {super_admin.username}")
    
    print("")
    
    # Si on force, on supprime les anciennes catégories
    if force and not dry_run:
        count = Category.objects.count()
        if count > 0:
            print(f"⚠️ Suppression de {count} catégorie(s) existante(s)...")
            Category.objects.all().delete()
            print(f"✅ {count} catégorie(s) supprimée(s).\n")
    
    # Compteurs
    stats = {
        'created': 0,
        'existing': 0,
        'updated': 0,
        'total': 0
    }
    
    print("📦 Création des catégories :")
    print("-" * 50)
    
    for name in CATEGORY_NAMES:
        if dry_run:
            print(f"  🔍 [SIMULATION] Catégorie « {name} » sera créée.")
            stats['created'] += 1
            continue
        
        try:
            # Vérifier si la catégorie existe
            category, created = Category.objects.get_or_create(
                name=name,
                defaults={"created_by": super_admin}
            )
            
            if created:
                stats['created'] += 1
                print(f"  ✅ Catégorie « {name} » créée.")
            else:
                # Mettre à jour le created_by si force est activé
                if force and category.created_by != super_admin:
                    old_admin = category.created_by
                    category.created_by = super_admin
                    category.save(update_fields=['created_by'])
                    stats['updated'] += 1
                    print(f"  🔄 « {name} » mise à jour : créateur changé de "
                          f"{old_admin} à {super_admin}.")
                else:
                    stats['existing'] += 1
                    print(f"  ⏭️  « {name} » existe déjà.")
        
        except Exception as e:
            print(f"  ❌ Erreur pour « {name} » : {e}")
    
    # Statistiques finales
    stats['total'] = Category.objects.count()
    
    print("-" * 50)
    print("\n📊 RÉSULTAT :")
    print(f"  • Catégories créées : {stats['created']}")
    if stats['existing'] > 0:
        print(f"  • Catégories existantes : {stats['existing']}")
    if stats['updated'] > 0:
        print(f"  • Catégories mises à jour : {stats['updated']}")
    print(f"  • Total dans la base : {stats['total']} catégories.")
    
    if dry_run:
        print("\n🔍 DRY-RUN terminé. Utilisez sans --dry-run pour appliquer les changements.")
    
    stats['success'] = True
    return stats


# ═══════════════════════════════════════════════════════════════
# ÉTAPE 5 : Point d'entrée
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Initialise les catégories du site e-commerce RedSquare."
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Supprime et recrée toutes les catégories.'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Simule l\'exécution sans modifier la base.'
    )
    parser.add_argument(
        '--settings',
        type=str,
        default='config.settings',
        help='Module de configuration Django (défaut: config.settings)'
    )
    
    args = parser.parse_args()
    
    # Si un module settings est spécifié, l'utiliser
    if args.settings:
        os.environ['DJANGO_SETTINGS_MODULE'] = args.settings
        try:
            import django
            django.setup()
            print(f"✅ Django configuré avec : {args.settings}\n")
        except Exception as e:
            print(f"❌ Erreur : {e}")
            sys.exit(1)
    
    # Exécuter le seeding
    try:
        result = seed_categories(
            force=args.force,
            dry_run=args.dry_run
        )
        sys.exit(0 if result.get('success', False) else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Interruption par l'utilisateur.")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Erreur inattendue : {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)