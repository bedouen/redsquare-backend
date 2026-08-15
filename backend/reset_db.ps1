# reset_db.ps1
Write-Host " Suppression de la base de données..." -ForegroundColor Yellow

# Supprimer la base
psql -U postgres -c "DROP DATABASE IF EXISTS redsquare;"
psql -U postgres -c "CREATE DATABASE redsquare OWNER postgres;"

Write-Host "Base de données recréée" -ForegroundColor Green

# Supprimer les migrations
Write-Host "Suppression des fichiers de migration..." -ForegroundColor Yellow

Remove-Item -Path accounts\migrations\*.py -Exclude "__init__.py" -ErrorAction SilentlyContinue
Remove-Item -Path catalog\migrations\*.py -Exclude "__init__.py" -ErrorAction SilentlyContinue
Remove-Item -Path orders\migrations\*.py -Exclude "__init__.py" -ErrorAction SilentlyContinue
Remove-Item -Path payments\migrations\*.py -Exclude "__init__.py" -ErrorAction SilentlyContinue
Remove-Item -Path reports\migrations\*.py -Exclude "__init__.py" -ErrorAction SilentlyContinue

Write-Host "Migrations supprimées" -ForegroundColor Green

# Créer les migrations
Write-Host "Création des migrations..." -ForegroundColor Yellow
python manage.py makemigrations

# Appliquer les migrations
Write-Host "Application des migrations..." -ForegroundColor Yellow
python manage.py migrate

# Créer un super-admin
Write-Host "Creation du super-admin..." -ForegroundColor Yellow
python manage.py createsuperuser

Write-Host " Réinitialisation terminée !" -ForegroundColor Green
Write-Host "Lancez : python manage.py runserver" -ForegroundColor Yellow