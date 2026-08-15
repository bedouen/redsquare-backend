# RedSquare — Plateforme E-Commerce Multi-Rôles

Stack : **React (Vite + Tailwind)** + **Django REST Framework** + **PostgreSQL**
Devise : **FCFA (XAF)** — Frais de livraison automatiques de **2 000 FCFA**.

```
redsquare/
├── backend/     → API Django REST (accounts, catalog, orders, payments, reports)
└── frontend/    → Application React (boutique, panier, dashboards)
```

---

## 1. Prérequis à installer

- **Visual Studio Code** : https://code.visualstudio.com/
- **Python 3.11+** : https://www.python.org/downloads/
- **Node.js 18+** (inclut npm) : https://nodejs.org/
- **PostgreSQL 14+** : https://www.postgresql.org/download/
- Extensions VS Code recommandées : *Python* (Microsoft), *ESLint*, *Tailwind CSS IntelliSense*

---

## 2. Ouvrir le projet dans VS Code

1. Dézippez le dossier `redsquare` quelque part sur votre machine.
2. Ouvrez VS Code → `Fichier > Ouvrir le dossier...` → sélectionnez le dossier `redsquare` (le dossier racine contenant `backend/` et `frontend/`).
3. Ouvrez un terminal intégré : `Terminal > Nouveau Terminal` (ou `Ctrl+ù` / `Ctrl+backtick`).

---

## 3. Configurer la base de données PostgreSQL

Ouvrez `psql` ou pgAdmin et créez la base :

```sql
CREATE DATABASE redsquare;
CREATE USER redsquare_user WITH PASSWORD 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON DATABASE redsquare TO redsquare_user;
```

---

## 4. Lancer le Backend (Django)

Dans le terminal VS Code :

```bash
cd backend

# Créer et activer un environnement virtuel
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer votre fichier de configuration
cp .env.example .env
```

Ouvrez `backend/.env` et renseignez vos identifiants PostgreSQL réels (`DB_NAME`, `DB_USER`, `DB_PASSWORD`, `SECRET_KEY`...).

Ensuite, dans VS Code, sélectionnez l'interpréteur Python de votre venv :
`Ctrl+Shift+P` → `Python: Select Interpreter` → choisissez `./backend/venv/...`

Puis créez les migrations et lancez le serveur :

```bash
python manage.py makemigrations accounts catalog orders payments reports
python manage.py migrate

# Créer un compte Super-Admin pour accéder au dashboard global
python manage.py createsuperuser
# (il vous demandera phone_number, first_name, puis le mot de passe)

python manage.py runserver
```

Le backend est maintenant disponible sur **http://127.0.0.1:8000**
L'admin Django (utile pour vérifier vos données) : **http://127.0.0.1:8000/admin**

---

## 5. Lancer le Frontend (React)

Ouvrez un **second terminal** dans VS Code (icône `+` dans le panneau terminal) :

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Le frontend est maintenant disponible sur **http://localhost:5173**

---

## 6. Utilisation

1. Ouvrez http://localhost:5173 — vous voyez la boutique publique (visiteur).
2. **Inscrivez-vous** (`/register`) → un compte **Client** est créé automatiquement.
3. Pour tester les rôles **Admin** et **Super-Admin** :
   - Connectez-vous sur http://127.0.0.1:8000/admin avec le compte super-admin créé via `createsuperuser`.
   - Créez une catégorie (Super-Admin uniquement), puis un utilisateur avec le rôle `admin`.
   - Ou, une fois connecté en tant que Super-Admin sur le site (`/login`), utilisez l'onglet **Utilisateurs** du dashboard Super-Admin pour changer le rôle de n'importe quel compte.
4. Un compte **Admin** peut créer des produits (photo obligatoire) depuis `/admin`.
5. Un **Client** peut ajouter au panier, passer commande (`/checkout`), et voir son historique (`/client`).
6. Le **Super-Admin** (`/superadmin`) gère les utilisateurs, catégories, commandes globales, et voit les statistiques globales.

---

## 7. Points clés des règles métier implémentées

- **Connexion** : recherche par téléphone en priorité, puis par email si aucun compte ne correspond au numéro.
- **Inscription publique** : toujours un rôle `client`, quels que soient les champs envoyés.
- **Champs obligatoires à l'inscription** : uniquement `phone_number`, `first_name`, `password`.
- **Photo produit obligatoire** : le backend refuse la création d'un produit sans image (`catalog/serializers.py`).
- **Avatar par défaut** : si `profile_picture` est vide, l'API renvoie une URL d'avatar par défaut (`profile_picture_url`).
- **Devise FCFA** : tous les montants (`unit_price`, `subtotal`, `delivery_fee`, `total_amount`) sont exprimés en FCFA ; le frontend affiche systématiquement le suffixe `FCFA` via `utils/currency.js`.
- **Frais de livraison automatiques** : si les 3 champs `delivery_phone`, `delivery_city`, `delivery_neighborhood` sont renseignés au checkout, le backend ajoute automatiquement 2 000 FCFA (`orders/models.py` → `Order.DELIVERY_FEE_XAF`, calculé dans `CreateOrderSerializer.create`). Le frontend ne fait qu'un affichage indicatif ; le calcul définitif est toujours fait côté serveur pour la sécurité.
- **Unicité produit** : un produit est unique par `(name, created_by, category)` — contrainte au niveau base de données.
- **Génération PDF** : reçus de paiement et rapports de ventes générés avec ReportLab (dossier `media/receipts/`).

---

## 8. Prochaines étapes suggérées

- Brancher un vrai fournisseur SMS (Twilio, Orange SMS API...) dans `accounts/views.py` (`RequestOTPView`), actuellement simulé par un `print()`.
- Brancher les vraies API Orange Money / MTN Mobile Money / Visa dans `payments/views.py` (actuellement simulé, statut toujours `success`).
- Ajouter des graphiques (Recharts, déjà installé côté frontend) sur le dashboard Admin pour visualiser les ventes.
- Déployer : backend sur un service comme Railway/Render, frontend sur Vercel/Netlify, base PostgreSQL managée.
