# fix_missing_columns.ps1
Write-Host "🔧 Ajout des colonnes manquantes..." -ForegroundColor Yellow

# Aller dans le dossier backend
cd C:\Users\Ucac-icam.local\redsquare\backend

# Activer l'environnement virtuel
venv\Scripts\activate

# Créer la migration
Write-Host "Création de la migration..." -ForegroundColor Yellow
python manage.py makemigrations accounts --empty --name add_missing_user_fields

# Appliquer la migration
Write-Host "Application de la migration..." -ForegroundColor Yellow
python manage.py migrate accounts

# Vérifier les colonnes
Write-Host "Vérification des colonnes..." -ForegroundColor Yellow
python manage.py dbshell -c "\d users"

Write-Host " Terminé !" -ForegroundColor Green
Write-Host "Lancez : python manage.py createsuperuser" -ForegroundColor Yellow