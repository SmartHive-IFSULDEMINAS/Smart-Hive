#!/bin/bash
set -e

echo "🐝 Smart-Hive Backend Starting..."

# Aguardar banco de dados estar pronto (se usar PostgreSQL no futuro)
echo "⏳ Waiting for database..."
sleep 2

# Executar migrações
echo "🔄 Running migrations..."
python manage.py migrate --noinput

# Coletar arquivos estáticos
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# Criar superusuário se não existir (opcional)
echo "👤 Ensuring superuser exists..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@smarthive.com', 'admin123')
    print('✅ Superuser created: admin/admin123')
else:
    print('ℹ️  Superuser already exists')
EOF

echo "🚀 Starting Gunicorn..."
exec gunicorn smarthive.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
