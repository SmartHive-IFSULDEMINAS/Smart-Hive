"""
Script para resetar migrações e banco de dados
Execute: python reset_migrations.py
"""
import os
import shutil
import sys

def reset_migrations():
    # Caminhos
    migrations_dir = 'api/migrations'
    db_file = 'db.sqlite3'
    
    # Deletar migrações (exceto __init__.py)
    if os.path.exists(migrations_dir):
        for file in os.listdir(migrations_dir):
            if file.endswith('.py') and file != '__init__.py':
                file_path = os.path.join(migrations_dir, file)
                os.remove(file_path)
                print(f'Deletado: {file_path}')
    
    # Deletar banco de dados
    if os.path.exists(db_file):
        os.remove(db_file)
        print(f'Deletado: {db_file}')
    
    print('\n✅ Migrações e banco de dados resetados!')
    print('\nPróximos passos:')
    print('1. python manage.py makemigrations')
    print('2. python manage.py migrate')
    print('3. python manage.py createsuperuser')

if __name__ == '__main__':
    reset_migrations()

