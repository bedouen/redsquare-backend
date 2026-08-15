# reset_full.ps1 - Réinitialisation sans psql
Write-Host "🔧 Réinitialisation complète..." -ForegroundColor Yellow

# Aller dans le dossier backend
cd C:\Users\Ucac-icam.local\redsquare\backend

# Activer l'environnement virtuel
venv\Scripts\activate

# 1. Vider la base
Write-Host "🧹 Vidage de la base de données..." -ForegroundColor Yellow
python manage.py flush --noinput

# 2. Supprimer les migrations
Write-Host "🧹 Suppression des migrations..." -ForegroundColor Yellow
Remove-Item -Path accounts\migrations\*.py -Exclude "__init__.py" -ErrorAction SilentlyContinue
Remove-Item -Path catalog\migrations\*.py -Exclude "__init__.py" -ErrorAction SilentlyContinue
Remove-Item -Path orders\migrations\*.py -Exclude "__init__.py" -ErrorAction SilentlyContinue
Remove-Item -Path payments\migrations\*.py -Exclude "__init__.py" -ErrorAction SilentlyContinue
Remove-Item -Path reports\migrations\*.py -Exclude "__init__.py" -ErrorAction SilentlyContinue

# 3. Réinitialiser les migrations Django
Write-Host "🔄 Réinitialisation des migrations..." -ForegroundColor Yellow
python manage.py migrate --fake auth zero
python manage.py migrate --fake contenttypes zero
python manage.py migrate --fake sessions zero
python manage.py migrate --fake admin zero

# 4. Créer les nouvelles migrations
Write-Host "📝 Création des migrations..." -ForegroundColor Yellow
python manage.py makemigrations accounts
python manage.py makemigrations catalog
python manage.py makemigrations orders
python manage.py makemigrations payments
python manage.py makemigrations reports

# 5. Appliquer les migrations
Write-Host "🔄 Application des migrations..." -ForegroundColor Yellow
python manage.py migrate

# 6. Créer un super-admin
Write-Host "👤 Création du super-admin..." -ForegroundColor Yellow
python manage.py createsuperuser

Write-Host "✅ Réinitialisation terminée !" -ForegroundColor Green
Write-Host "🚀 Lancez : python manage.py runserver" -ForegroundColor Yellow