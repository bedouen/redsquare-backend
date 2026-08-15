#!/usr/bin/env python
"""
Remplit la table `users` avec un super-admin, des administrateurs et des
clients de démonstration, chacun avec une vraie photo de profil téléchargée
depuis plusieurs services en ligne.

Usage :
    python seed_users.py
    python seed_users.py --force
    python seed_users.py --dry-run
"""

import os
import sys
import random
import time
from pathlib import Path

import requests
from django.core.files.base import ContentFile

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 1 : Configurer Django AVANT d'importer les modèles
# ═══════════════════════════════════════════════════════════════

# Ajouter le répertoire courant au PYTHONPATH
current_dir = Path(__file__).parent.absolute()
sys.path.insert(0, str(current_dir))

# Utiliser 'config.settings' car settings.py est dans le dossier config/
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
    print("  python seed_users.py")
    sys.exit(1)

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 2 : Importer les modèles
# ═══════════════════════════════════════════════════════════════

from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 3 : Fonctions pour télécharger les images
# ═══════════════════════════════════════════════════════════════

def download_image_pravatar(seed, width=300):
    """
    Télécharge un avatar depuis Pravatar.cc.
    
    Args:
        seed (int): Seed pour l'avatar
        width (int): Largeur de l'image
    
    Returns:
        bytes: Le contenu de l'image
        None: En cas d'erreur
    """
    try:
        url = f"https://i.pravatar.cc/{width}?img={seed}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return response.content
        return None
    except Exception as e:
        print(f"  ⚠️ Erreur Pravatar: {e}")
        return None


def download_image_ui_avatars(name, size=300):
    """
    Télécharge un avatar depuis UI Avatars (généré à partir du nom).
    
    Args:
        name (str): Nom pour générer l'avatar
        size (int): Taille de l'image
    
    Returns:
        bytes: Le contenu de l'image
        None: En cas d'erreur
    """
    try:
        # URL encodée avec le nom
        import urllib.parse
        encoded_name = urllib.parse.quote(name)
        url = f"https://ui-avatars.com/api/?name={encoded_name}&size={size}&background=E63946&color=FFFFFF&bold=true&font-size=0.5"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return response.content
        return None
    except Exception as e:
        print(f"  ⚠️ Erreur UI Avatars: {e}")
        return None


def download_image_placeholder_avatar(name, size=300):
    """
    Télécharge un avatar depuis Placeholder avec les initiales.
    
    Args:
        name (str): Nom pour générer l'avatar
        size (int): Taille de l'image
    
    Returns:
        bytes: Le contenu de l'image
        None: En cas d'erreur
    """
    try:
        # Extraire les initiales
        parts = name.split()
        if len(parts) >= 2:
            initials = f"{parts[0][0]}{parts[1][0]}".upper()
        else:
            initials = name[:2].upper()
        
        url = f"https://via.placeholder.com/{size}x{size}/E63946/FFFFFF?text={initials}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code == 200:
            return response.content
        return None
    except Exception as e:
        print(f"  ⚠️ Erreur Placeholder: {e}")
        return None


def download_avatar(name, seed, filename):
    """
    Télécharge un avatar depuis plusieurs sources.
    Essaie d'abord Pravatar, puis UI Avatars, puis Placeholder.
    
    Args:
        name (str): Nom de l'utilisateur
        seed (int): Seed pour Pravatar
        filename (str): Nom du fichier
    
    Returns:
        ContentFile: Le contenu de l'image
        None: En cas d'erreur
    """
    sources = [
        ('Pravatar', lambda: download_image_pravatar(seed)),
        ('UI Avatars', lambda: download_image_ui_avatars(name)),
        ('Placeholder', lambda: download_image_placeholder_avatar(name)),
    ]
    
    for source_name, source_func in sources:
        try:
            print(f"    📥 Essai {source_name}...")
            content = source_func()
            if content:
                print(f"    ✅ Avatar téléchargé via {source_name}")
                # Ajouter un délai pour éviter d'être bloqué
                time.sleep(0.5)
                return ContentFile(content, name=filename)
        except Exception as e:
            print(f"    ❌ {source_name} échoué: {e}")
            continue
    
    print(f"  ❌ Aucune source disponible pour l'avatar de {name}")
    return None


# ═══════════════════════════════════════════════════════════════
# ÉTAPE 4 : Données des utilisateurs
# ═══════════════════════════════════════════════════════════════

# (phone, first_name, last_name, email, city, neighborhood, role, avatar_seed)
USERS_DATA = [
    ("+237690000001", "Josiane", "Mballa", "josiane.mballa@redsquare.dev", 
     "Douala", "Bonamoussadi", "super_admin", 1),
    ("+237690000002", "Armand", "Fotso", "armand.fotso@redsquare.dev", 
     "Yaoundé", "Bastos", "admin", 2),
    ("+237690000003", "Nadège", "Ekwalla", "nadege.ekwalla@redsquare.dev", 
     "Douala", "Akwa", "admin", 3),
    ("+237690000004", "Serge", "Nguemo", "serge.nguemo@redsquare.dev", 
     "Bafoussam", "Centre", "admin", 4),
    ("+237690000005", "Aïcha", "Bello", None, 
     "Garoua", "Plateau", "client", 5),
    ("+237690000006", "Patrick", "Owona", "patrick.owona@gmail.com", 
     "Douala", "Deido", "client", 6),
    ("+237690000007", "Chantal", "Ateba", None, 
     "Yaoundé", "Mvan", "client", 7),
    ("+237690000008", "Junior", "Kamdem", "junior.kamdem@gmail.com", 
     "Douala", "Bonapriso", "client", 8),
    ("+237690000009", "Larissa", "Ngo Bilong", None, 
     "Yaoundé", "Nlongkak", "client", 9),
    ("+237690000010", "Michel", "Tchouta", "michel.tchouta@gmail.com", 
     "Kribi", "Centre-ville", "client", 10),
]

DEFAULT_PASSWORD = "RedSquare2026!"

# Mapping des rôles
ROLE_MAP = {
    'super_admin': 'super_admin',
    'admin': 'admin',
    'client': 'client',
}


# ═══════════════════════════════════════════════════════════════
# ÉTAPE 5 : Fonction principale
# ═══════════════════════════════════════════════════════════════

@transaction.atomic
def seed_users(force=False, dry_run=False):
    """
    Fonction principale de seeding des utilisateurs.
    
    Args:
        force (bool): Si True, supprime tous les utilisateurs existants
        dry_run (bool): Si True, simule sans modifier la base
    
    Returns:
        dict: Statistiques des opérations
    """
    print("=" * 60)
    print("🚀 REDSQUARE - Initialisation des utilisateurs")
    print("=" * 60)
    
    if dry_run:
        print("🔍 Mode DRY-RUN : aucune modification réelle.\n")
    
    # Vérifier que le modèle User a les champs nécessaires
    required_fields = ['phone_number', 'first_name', 'role']
    missing_fields = []
    for field in required_fields:
        if not hasattr(User, field):
            missing_fields.append(field)
    
    if missing_fields:
        print(f"❌ Le modèle User n'a pas les champs requis : {', '.join(missing_fields)}")
        print("Vérifiez votre modèle User dans accounts/models.py")
        return {'success': False, 'error': 'Missing fields'}
    
    # Si on force, supprimer tous les utilisateurs (sauf ceux qu'on va recréer)
    if force and not dry_run:
        count = User.objects.count()
        if count > 0:
            print(f"⚠️ Suppression de {count} utilisateur(s) existant(s)...")
            # Ne pas supprimer les utilisateurs qui pourraient être nécessaires
            User.objects.all().delete()
            print(f"✅ {count} utilisateur(s) supprimé(s).\n")
    
    # Compteurs
    stats = {
        'created': 0,
        'skipped': 0,
        'errors': 0,
        'total': 0
    }
    
    print("📦 Création des utilisateurs :")
    print("-" * 50)
    
    for phone, first_name, last_name, email, city, neighborhood, role, avatar_seed in USERS_DATA:
        if dry_run:
            print(f"  🔍 [SIMULATION] Utilisateur {first_name} {last_name} ({role}) sera créé.")
            stats['created'] += 1
            continue
        
        # Vérifier si l'utilisateur existe déjà
        if User.objects.filter(phone_number=phone).exists():
            print(f"  ⏭️  {phone} existe déjà, ignoré.")
            stats['skipped'] += 1
            continue
        
        try:
            # Déterminer les flags is_staff et is_superuser
            is_staff = (role in ['admin', 'super_admin'])
            is_superuser = (role == 'super_admin')
            
            # Créer l'utilisateur
            user = User(
                phone_number=phone,
                first_name=first_name,
                last_name=last_name if last_name else '',
                email=email,
                city=city if city else '',
                neighborhood=neighborhood if neighborhood else '',
                role=role,
                is_staff=is_staff,
                is_superuser=is_superuser,
            )
            user.set_password(DEFAULT_PASSWORD)
            
            # Télécharger la photo de profil
            print(f"  📥 Téléchargement de l'avatar pour {first_name} {last_name}...")
            avatar_content = download_avatar(
                f"{first_name} {last_name}",
                avatar_seed,
                f"avatar_{phone.strip('+')}.jpg"
            )
            
            if avatar_content:
                # Si le modèle a un champ profile_picture
                if hasattr(user, 'profile_picture'):
                    user.profile_picture.save(
                        f"avatar_{phone.strip('+')}.jpg",
                        avatar_content,
                        save=False
                    )
                else:
                    print(f"  ⚠️ Le modèle User n'a pas de champ 'profile_picture'")
            
            # Sauvegarder l'utilisateur
            user.save()
            stats['created'] += 1
            
            role_display = role.upper().replace('_', ' ')
            print(f"  ✅ Utilisateur {first_name} {last_name} ({role_display}) créé.")
            
        except Exception as e:
            print(f"  ❌ Erreur pour {first_name} {last_name} : {e}")
            stats['errors'] += 1
    
    # Statistiques finales
    stats['total'] = User.objects.count()
    
    print("-" * 50)
    print("\n📊 RÉSULTAT :")
    print(f"  • Utilisateurs créés : {stats['created']}")
    if stats['skipped'] > 0:
        print(f"  • Utilisateurs ignorés : {stats['skipped']}")
    if stats['errors'] > 0:
        print(f"  • Erreurs : {stats['errors']}")
    print(f"  • Total dans la base : {stats['total']} utilisateurs.")
    
    if stats['created'] > 0:
        print(f"\n🔑 Mot de passe pour tous les utilisateurs : {DEFAULT_PASSWORD}")
    
    if dry_run:
        print("\n🔍 DRY-RUN terminé. Utilisez sans --dry-run pour appliquer les changements.")
    
    stats['success'] = True
    return stats


# ═══════════════════════════════════════════════════════════════
# ÉTAPE 6 : Point d'entrée
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Initialise les utilisateurs du site e-commerce RedSquare."
    )
    parser.add_argument(
        '--force',
        action='store_true',
        help='Supprime et recrée tous les utilisateurs.'
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
        result = seed_users(
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