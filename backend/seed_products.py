#!/usr/bin/env python
import os
import sys
import random
import time
import requests
from pathlib import Path
from decimal import Decimal
from django.core.files.base import ContentFile

# Configurer Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, str(Path(__file__).parent.absolute()))

import django
django.setup()

from django.contrib.auth import get_user_model
from django.db import transaction
from catalog.models import Category, Product

User = get_user_model()

# ═══════════════════════════════════════════════════════════════
# DONNÉES DES PRODUITS AVEC MOTS-CLÉS POUR LES IMAGES
# ═══════════════════════════════════════════════════════════════

PRODUCTS_DATA = [
    # Téléphonie & Accessoires
    ("Smartphone Galaxy A15", "Écran AMOLED 6.5 pouces, 128 Go, double SIM, batterie longue durée.",
     25, 145000, "Téléphonie & Accessoires", ["phone", "smartphone", "tech"]),
    ("Écouteurs sans fil", "Bluetooth 5.3, réduction de bruit active, autonomie 30h.",
     40, 18500, "Téléphonie & Accessoires", ["headphone", "earbuds", "audio"]),
    
    # Sport & Loisirs
    ("Tapis de yoga antidérapant", "Tapis épais 6mm, surface antidérapante, sac de transport inclus.",
     24, 16000, "Sport & Loisirs", ["yoga", "fitness", "sport"]),
    ("Ballon de football officiel", "Ballon taille 5, homologué compétition, résistant à l'usure.",
     20, 14500, "Sport & Loisirs", ["football", "soccer", "sport"]),
    
    # Épicerie & Alimentation
    ("Huile végétale 5L", "Huile de table raffinée, idéale pour la cuisson et la friture.",
     45, 8500, "Épicerie & Alimentation", ["oil", "cooking", "kitchen"]),
    ("Riz parfumé 25kg", "Sac de riz long grain parfumé, qualité supérieure, origine Asie.",
     60, 21000, "Épicerie & Alimentation", ["rice", "food", "grocery"]),
    
    # Beauté & Cosmétiques
    ("Kit de maquillage complet", "Palette de fards à paupières, rouges à lèvres et pinceaux inclus.",
     16, 22000, "Beauté & Cosmétiques", ["makeup", "cosmetics", "beauty"]),
    ("Parfum homme boisé", "Eau de toilette 100ml, notes boisées et épicées, longue tenue.",
     22, 28500, "Beauté & Cosmétiques", ["perfume", "fragrance", "luxury"]),
    ("Crème hydratante visage", "Crème hydratante naturelle au beurre de karité, tous types de peau.",
     50, 6500, "Beauté & Cosmétiques", ["cream", "skincare", "beauty"]),
    
    # Maison & Cuisine
    ("Lot de casseroles inox", "Set de 5 casseroles antiadhésives avec couvercles en verre.",
     10, 45000, "Maison & Cuisine", ["cookware", "kitchen", "pots"]),
    ("Mixeur électrique multifonction", "Mixeur 1000W avec 3 vitesses, bol en verre 1.5L.",
     14, 32000, "Maison & Cuisine", ["blender", "kitchen", "appliance"]),
    ("Service à café en céramique", "Set de 6 tasses avec soucoupes, design moderne.",
     12, 19500, "Maison & Cuisine", ["coffee", "cups", "ceramic"]),
    
    # Chaussures
    ("Sandales femme été", "Sandales confortables en cuir synthétique, semelle antidérapante.",
     25, 15000, "Chaussures", ["sandals", "shoes", "summer"]),
    ("Baskets running homme", "Chaussures de sport respirantes, semelle amortissante, légères.",
     30, 28000, "Chaussures", ["sneakers", "running", "shoes"]),
    
    # Mode & Vêtements
    ("Sac à main cuir", "Sac à main en cuir véritable, plusieurs compartiments, bandoulière amovible.",
     18, 35000, "Mode & Vêtements", ["bag", "leather", "fashion"]),
    ("Chemise homme slim fit", "Chemise en coton, coupe ajustée, disponible en plusieurs couleurs.",
     35, 12000, "Mode & Vêtements", ["shirt", "fashion", "clothing"]),
    ("Robe wax élégante", "Robe traditionnelle en tissu wax, coupe moderne, taille unique ajustable.",
     20, 25000, "Mode & Vêtements", ["dress", "fashion", "wax"]),
    
    # Électronique
    ("Ordinateur portable 15\"", "Intel Core i5, 8 Go RAM, 512 Go SSD, idéal bureautique.",
     8, 385000, "Électronique", ["laptop", "computer", "tech"]),
    ("Télévision LED 43 pouces", "Smart TV Full HD avec Netflix, YouTube et Wifi intégré.",
     10, 185000, "Électronique", ["tv", "television", "tech"]),
    ("Chargeur solaire portable", "Panneau solaire pliable 20W avec batterie 10000mAh intégrée.",
     15, 22000, "Électronique", ["solar", "charger", "tech"]),
]

# ═══════════════════════════════════════════════════════════════
# FONCTIONS DE TÉLÉCHARGEMENT D'IMAGES
# ═══════════════════════════════════════════════════════════════

def download_image_unsplash(keywords, width=600, height=600):
    """Télécharge une image depuis Unsplash."""
    try:
        # Essayer avec un mot-clé aléatoire
        keyword = random.choice(keywords)
        url = f"https://source.unsplash.com/featured/{width}x{height}/?{keyword}"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'image' in content_type:
                print(f"    ✅ Unsplash: {keyword}")
                return ContentFile(response.content)
        
        # Si échec, essayer avec un autre mot-clé
        for alt_keyword in keywords[1:]:
            alt_url = f"https://source.unsplash.com/featured/{width}x{height}/?{alt_keyword}"
            alt_response = requests.get(alt_url, headers=headers, timeout=10, allow_redirects=True)
            if alt_response.status_code == 200 and 'image' in alt_response.headers.get('content-type', ''):
                print(f"    ✅ Unsplash: {alt_keyword}")
                return ContentFile(alt_response.content)
        
        return None
    except Exception as e:
        print(f"    ⚠️ Unsplash error: {e}")
        return None

def download_image_picsum(width=600, height=600):
    """Télécharge une image aléatoire depuis Picsum."""
    try:
        url = f"https://picsum.photos/{width}/{height}?random={random.randint(1, 10000)}"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=10, allow_redirects=True)
        
        if response.status_code == 200:
            content_type = response.headers.get('content-type', '')
            if 'image' in content_type:
                print(f"    ✅ Picsum")
                return ContentFile(response.content)
        return None
    except Exception as e:
        print(f"    ⚠️ Picsum error: {e}")
        return None

def download_image(keywords, width=600, height=600):
    """Télécharge une image depuis plusieurs sources."""
    # Essayer Unsplash d'abord
    image = download_image_unsplash(keywords, width, height)
    if image:
        return image
    
    # Fallback sur Picsum
    print(f"    🔄 Fallback Picsum...")
    image = download_image_picsum(width, height)
    if image:
        return image
    
    print(f"    ❌ Échec téléchargement")
    return None

# ═══════════════════════════════════════════════════════════════
# FONCTION PRINCIPALE
# ═══════════════════════════════════════════════════════════════

@transaction.atomic
def seed_products_real_images():
    print("=" * 70)
    print("🚀 REDSQUARE - Seed produits avec vraies images")
    print("=" * 70)
    
    # Récupérer un admin
    admin = User.objects.filter(is_superuser=True).first()
    if not admin:
        print("❌ Aucun super-admin trouvé !")
        print("  Créez-en un : python manage.py createsuperuser")
        return
    
    print(f"✅ Admin: {admin.phone_number}\n")
    
    # Supprimer les produits existants
    count = Product.objects.count()
    Product.objects.all().delete()
    print(f"✅ {count} produits supprimés\n")
    print("📥 Téléchargement des images en cours...\n")
    
    stats = {'created': 0, 'errors': 0}
    
    for name, description, quantity, price, category_name, keywords in PRODUCTS_DATA:
        print(f"📦 {name}")
        
        try:
            category = Category.objects.get(name=category_name)
        except Category.DoesNotExist:
            print(f"  ⚠️ Catégorie « {category_name} » introuvable.")
            stats['errors'] += 1
            continue
        
        try:
            # Créer le produit
            product = Product(
                name=name,
                description=description,
                quantity=quantity,
                unit_price=Decimal(price),
                category=category,
                created_by=admin,
            )
            
            # Télécharger l'image
            print(f"  📥 Téléchargement...")
            image_file = download_image(keywords)
            
            if image_file:
                # Sauvegarder l'image
                safe_name = name[:15].replace(' ', '_').replace('"', '').replace("'", '')
                filename = f"front_{safe_name}_{random.randint(1000,9999)}.jpg"
                product.image_front.save(filename, image_file, save=False)
                print(f"  ✅ Image téléchargée")
            else:
                print(f"  ⚠️ Aucune image trouvée, placeholder")
            
            # Sauvegarder le produit
            product.save()
            stats['created'] += 1
            print(f"  ✅ Produit créé\n")
            
            # Pause pour ne pas surcharger les serveurs
            time.sleep(0.3)
            
        except Exception as e:
            print(f"  ❌ Erreur: {e}\n")
            stats['errors'] += 1
    
    print("=" * 70)
    print(f"📊 RÉSULTAT : {stats['created']} produits créés, {stats['errors']} erreurs")
    print("=" * 70)
    
    # Vérification
    products_with_images = Product.objects.filter(image_front__isnull=False).count()
    print(f"📸 Produits avec image : {products_with_images}/{stats['created']}")

if __name__ == "__main__":
    seed_products_real_images()