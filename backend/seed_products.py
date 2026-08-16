#!/usr/bin/env python
"""
Remplit la table `products` avec des produits de démonstration.
Chaque produit reçoit 4 vues d'images (front, gauche, dessus, droite)
téléchargées depuis plusieurs sources d'images libres de droits.

Usage :
    python seed_products.py
    python seed_products.py --force
    python seed_products.py --dry-run
"""

import os
import sys
import random
import time
import argparse
import uuid
from pathlib import Path
from decimal import Decimal
from io import BytesIO

import requests
from django.core.files.base import ContentFile
from django.core.files import File
from django.core.files.temp import NamedTemporaryFile
from PIL import Image

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
    sys.exit(1)

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 2 : Importer les modèles
# ═══════════════════════════════════════════════════════════════

from django.contrib.auth import get_user_model
from django.db import transaction
from django.conf import settings
from catalog.models import Category, Product

User = get_user_model()

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 3 : Fonctions pour télécharger les images
# ═══════════════════════════════════════════════════════════════

def generate_placeholder_image(text, width=400, height=400):
    """Génère une image placeholder avec du texte."""
    try:
        # Créer une image simple avec PIL
        img = Image.new('RGB', (width, height), color=(230, 57, 70))
        from PIL import ImageDraw, ImageFont
        draw = ImageDraw.Draw(img)
        
        # Texte centré
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30)
        except:
            font = ImageFont.load_default()
        
        # Positionner le texte au centre
        text_bbox = draw.textbbox((0, 0), text[:15], font=font)
        text_width = text_bbox[2] - text_bbox[0]
        text_height = text_bbox[3] - text_bbox[1]
        x = (width - text_width) // 2
        y = (height - text_height) // 2
        draw.text((x, y), text[:15], fill=(255, 255, 255), font=font)
        
        # Sauvegarder en mémoire
        buffer = BytesIO()
        img.save(buffer, format='JPEG', quality=85)
        return ContentFile(buffer.getvalue())
    except Exception as e:
        print(f"  ⚠️ Erreur génération placeholder: {e}")
        return None

def download_image_from_url(url, timeout=10):
    """Télécharge une image depuis une URL."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'image' in content_type:
                return ContentFile(response.content)
        return None
    except Exception as e:
        print(f"  ⚠️ Erreur téléchargement: {e}")
        return None

def download_image_unsplash(keyword, width=400, height=400):
    """Télécharge une image depuis Unsplash."""
    url = f"https://source.unsplash.com/{width}x{height}/?{keyword}"
    return download_image_from_url(url)

def download_image_picsum(keyword, width=400, height=400):
    """Télécharge une image depuis Picsum."""
    url = f"https://picsum.photos/{width}/{height}?random={random.randint(1, 1000)}"
    return download_image_from_url(url)

def download_image_placeholder(keyword, width=400, height=400):
    """Télécharge une image depuis Placeholder."""
    text = keyword.replace('-', ' ').title()[:20]
    url = f"https://via.placeholder.com/{width}x{height}/E63946/FFFFFF?text={text}"
    return download_image_from_url(url)

def download_all_images(keyword, base_filename):
    """Télécharge les 4 vues d'images pour un produit."""
    result = {'front': None, 'left': None, 'top': None, 'right': None}
    
    sources = [
        ('Unsplash', download_image_unsplash),
        ('Picsum', download_image_picsum),
        ('Placeholder', download_image_placeholder),
    ]
    
    views = ['front', 'left', 'top', 'right']
    view_labels = ['FACE', 'GAUCHE', 'DESSUS', 'DROITE']
    
    for view, label in zip(views, view_labels):
        print(f"  📥 [{label}] {keyword}...")
        image_content = None
        
        # Essayer chaque source
        for source_name, source_func in sources:
            try:
                content = source_func(keyword if view == 'front' else f"{keyword}-{view}")
                if content:
                    image_content = content
                    print(f"    ✅ Téléchargé via {source_name}")
                    break
            except Exception as e:
                continue
        
        # Si aucune source ne fonctionne, générer un placeholder
        if not image_content:
            print(f"    ⚠️ Génération d'un placeholder pour {view}")
            image_content = generate_placeholder_image(f"{keyword[:10]}-{view[:2]}")
        
        if image_content:
            result[view] = image_content
            time.sleep(0.2)  # Pause pour ne pas surcharger les serveurs
    
    return result

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 4 : Données des produits
# ═══════════════════════════════════════════════════════════════

PRODUCTS_DATA = [
    ("Smartphone Galaxy A15", "Écran AMOLED 6.5 pouces, 128 Go, double SIM, batterie longue durée.",
     25, 145000, "Téléphonie & Accessoires", "smartphone"),
    ("Écouteurs sans fil", "Bluetooth 5.3, réduction de bruit active, autonomie 30h avec boîtier.",
     40, 18500, "Téléphonie & Accessoires", "earbuds"),
    ("Chargeur solaire portable", "Panneau solaire pliable 20W avec batterie 10000mAh intégrée.",
     15, 22000, "Électronique", "solar"),
    ("Télévision LED 43 pouces", "Smart TV Full HD avec Netflix, YouTube et Wifi intégré.",
     10, 185000, "Électronique", "tv"),
    ("Ordinateur portable 15\"", "Intel Core i5, 8 Go RAM, 512 Go SSD, idéal bureautique et études.",
     8, 385000, "Électronique", "laptop"),
    ("Robe wax élégante", "Robe traditionnelle en tissu wax, coupe moderne, taille unique ajustable.",
     20, 25000, "Mode & Vêtements", "dress"),
    ("Chemise homme slim fit", "Chemise en coton, coupe ajustée, disponible en plusieurs couleurs.",
     35, 12000, "Mode & Vêtements", "shirt"),
    ("Sac à main cuir", "Sac à main en cuir véritable, plusieurs compartiments, bandoulière amovible.",
     18, 35000, "Mode & Vêtements", "bag"),
    ("Baskets running homme", "Chaussures de sport respirantes, semelle amortissante, légères.",
     30, 28000, "Chaussures", "shoes"),
    ("Sandales femme été", "Sandales confortables en cuir synthétique, semelle antidérapante.",
     25, 15000, "Chaussures", "sandals"),
    ("Service à café en céramique", "Set de 6 tasses avec soucoupes, design moderne, passe au lave-vaisselle.",
     12, 19500, "Maison & Cuisine", "cups"),
    ("Mixeur électrique multifonction", "Mixeur 1000W avec 3 vitesses, bol en verre 1.5L, lames en inox.",
     14, 32000, "Maison & Cuisine", "blender"),
    ("Lot de casseroles inox", "Set de 5 casseroles antiadhésives avec couvercles en verre.",
     10, 45000, "Maison & Cuisine", "cookware"),
    ("Crème hydratante visage", "Crème hydratante naturelle au beurre de karité, tous types de peau.",
     50, 6500, "Beauté & Cosmétiques", "cream"),
    ("Parfum homme boisé", "Eau de toilette 100ml, notes boisées et épicées, longue tenue.",
     22, 28500, "Beauté & Cosmétiques", "perfume"),
    ("Kit de maquillage complet", "Palette de fards à paupières, rouges à lèvres et pinceaux inclus.",
     16, 22000, "Beauté & Cosmétiques", "makeup"),
    ("Riz parfumé 25kg", "Sac de riz long grain parfumé, qualité supérieure, origine Asie.",
     60, 21000, "Épicerie & Alimentation", "rice"),
    ("Huile végétale 5L", "Huile de table raffinée, idéale pour la cuisson et la friture.",
     45, 8500, "Épicerie & Alimentation", "oil"),
    ("Ballon de football officiel", "Ballon taille 5, homologué compétition, résistant à l'usure.",
     20, 14500, "Sport & Loisirs", "football"),
    ("Tapis de yoga antidérapant", "Tapis épais 6mm, surface antidérapante, sac de transport inclus.",
     24, 16000, "Sport & Loisirs", "yoga"),
]

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 5 : Fonction principale
# ═══════════════════════════════════════════════════════════════

@transaction.atomic
def seed_products(force=False, dry_run=False):
    """Fonction principale de seeding des produits."""
    print("=" * 60)
    print("🚀 REDSQUARE - Initialisation des produits (4 vues d'images)")
    print("=" * 60)
    
    if dry_run:
        print("🔍 Mode DRY-RUN : aucune modification réelle.\n")
    
    # Récupérer les admins
    admins = list(User.objects.filter(is_superuser=True))
    if not admins:
        admins = list(User.objects.filter(role='super_admin'))
    
    if not admins:
        print("❌ Aucun Admin ou Super-Admin trouvé !")
        print("  Veuillez créer un super-admin d'abord :")
        print("  python manage.py createsuperuser")
        return {'success': False, 'error': 'No admin found'}
    
    print(f"✅ {len(admins)} Admin(s)/Super-Admin(s) trouvé(s)")
    
    # Supprimer les produits si force
    if force and not dry_run:
        count = Product.objects.count()
        if count > 0:
            print(f"⚠️ Suppression de {count} produit(s) existant(s)...")
            Product.objects.all().delete()
            print(f"✅ {count} produit(s) supprimé(s).\n")
    
    stats = {'created': 0, 'skipped': 0, 'errors': 0, 'total': 0}
    
    print("\n📦 Création des produits :")
    print("-" * 50)
    
    for name, description, quantity, price, category_name, keyword in PRODUCTS_DATA:
        if dry_run:
            print(f"  🔍 [SIMULATION] Produit « {name} » sera créé.")
            stats['created'] += 1
            continue
        
        try:
            category = Category.objects.get(name=category_name)
        except Category.DoesNotExist:
            print(f"  ⚠️ Catégorie « {category_name} » introuvable. Ignoré.")
            stats['skipped'] += 1
            continue
        
        created_by = random.choice(admins)
        
        if Product.objects.filter(name=name, created_by=created_by, category=category).exists():
            print(f"  ⏭️  « {name} » existe déjà, ignoré.")
            stats['skipped'] += 1
            continue
        
        try:
            product = Product(
                name=name,
                description=description,
                quantity=quantity,
                unit_price=Decimal(price),
                category=category,
                created_by=created_by,
            )
            
            print(f"\n  📦 Produit : {name}")
            print(f"  🖼️  Téléchargement des images...")
            
            file_id = random.randint(1000, 9999)
            base_filename = f"{keyword}_{file_id}.jpg"
            
            images = download_all_images(keyword, base_filename)
            
            # Assigner les images au produit
            img_count = 0
            if images and images.get('front'):
                product.image_front = images['front']
                img_count += 1
            
            if images and images.get('left'):
                product.image_left = images['left']
                img_count += 1
            
            if images and images.get('top'):
                product.image_top = images['top']
                img_count += 1
            
            if images and images.get('right'):
                product.image_right = images['right']
                img_count += 1
            
            # Sauvegarder le produit avec les images
            product.save()
            stats['created'] += 1
            
            print(f"  ✅ Produit « {name} » créé avec {img_count}/4 vues d'images")
            print(f"     Prix: {price:,} FCFA")
            
        except Exception as e:
            print(f"  ❌ Erreur pour « {name} » : {e}")
            stats['errors'] += 1
    
    stats['total'] = Product.objects.count()
    
    print("\n" + "-" * 50)
    print("\n📊 RÉSULTAT :")
    print(f"  • Produits créés : {stats['created']}")
    if stats['skipped'] > 0:
        print(f"  • Produits ignorés : {stats['skipped']}")
    if stats['errors'] > 0:
        print(f"  • Erreurs : {stats['errors']}")
    print(f"  • Total dans la base : {stats['total']} produits.")
    
    stats['success'] = True
    return stats


# ═══════════════════════════════════════════════════════════════
# ÉTAPE 6 : Point d'entrée
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Initialise les produits du site e-commerce RedSquare."
    )
    parser.add_argument('--force', action='store_true', help='Supprime et recrée tous les produits.')
    parser.add_argument('--dry-run', action='store_true', help='Simule l\'exécution sans modifier la base.')
    
    args = parser.parse_args()
    
    try:
        result = seed_products(force=args.force, dry_run=args.dry_run)
        sys.exit(0 if result.get('success', False) else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️ Interruption par l'utilisateur.")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Erreur inattendue : {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)