@echo off
:: backend/build.bat

echo 📦 Installation des dependances...
pip install -r requirements.txt

echo 📝 Application des migrations...
python manage.py migrate

echo 👤 Creation du super-admin...
python manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@redsquare.com', 'Admin123!') if not User.objects.filter(is_superuser=True).exists() else None"

echo 📦 Collecte des fichiers statiques...
python manage.py collectstatic --noinput

echo ✅ Build termine !