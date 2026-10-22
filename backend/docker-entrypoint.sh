#!/bin/bash
set -e

echo "🐝 Smart-Hive Backend Starting..."

# O docker-compose só sobe o backend depois do healthcheck do Postgres

# Executar migrações
echo "🔄 Running migrations..."
python manage.py migrate --noinput

# Coletar arquivos estáticos
echo "📦 Collecting static files..."
python manage.py collectstatic --noinput

# Superusuário inicial só se a senha for informada (DJANGO_SUPERUSER_PASSWORD no
# .env). Antes era sempre admin/admin123: depois de uma perda de dados, qualquer
# um que conhecesse a senha padrão virava administrador.
if [ -n "${DJANGO_SUPERUSER_PASSWORD:-}" ]; then
    echo "👤 Ensuring superuser exists..."
    python manage.py shell << EOF
from django.contrib.auth import get_user_model
import os
User = get_user_model()
nome = os.environ.get('DJANGO_SUPERUSER_USERNAME', 'admin')
if not User.objects.filter(username=nome).exists():
    User.objects.create_superuser(nome, os.environ.get('DJANGO_SUPERUSER_EMAIL', ''), os.environ['DJANGO_SUPERUSER_PASSWORD'])
    print(f'✅ Superuser created: {nome}')
else:
    print('ℹ️  Superuser already exists')
EOF
fi

echo "🚀 Starting Gunicorn..."
exec gunicorn smarthive.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 3 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level info
