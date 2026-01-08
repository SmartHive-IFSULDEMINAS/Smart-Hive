# 🔧 Como Resolver o Conflito do Banco de Dados

## Problema
O arquivo `backend/db.sqlite3` está causando conflito no Git porque foi versionado anteriormente.

## ✅ Solução (Execute estes comandos)

### Opção 1: Manter seu banco local e ignorar o do repositório

```bash
# 1. Salve uma cópia do seu banco (precaução)
copy backend\db.sqlite3 backend\db.sqlite3.backup

# 2. Remova o arquivo do Git mas mantenha localmente
git rm --cached backend/db.sqlite3

# 3. Agora faça o pull (não haverá conflito)
git pull

# 4. Se o pull trouxer um db.sqlite3, delete e restaure o seu
del backend\db.sqlite3
copy backend\db.sqlite3.backup backend\db.sqlite3

# 5. Commit a remoção do tracking do db
git add .gitignore
git commit -m "Remove db.sqlite3 from version control"

# 6. Push
git push
```

### Opção 2: Forçar o uso do seu banco (mais simples)

```bash
# 1. Salve seu banco
copy backend\db.sqlite3 backend\db.sqlite3.backup

# 2. Descarte as mudanças locais do db
git checkout -- backend/db.sqlite3

# 3. Faça o pull
git pull

# 4. Restaure seu banco
del backend\db.sqlite3
copy backend\db.sqlite3.backup backend\db.sqlite3

# 5. Remova do Git permanentemente
git rm --cached backend/db.sqlite3
git commit -m "Remove db.sqlite3 from version control"
git push
```

### Opção 3: Stash (Guardar temporariamente)

```bash
# 1. Guarde suas mudanças temporariamente (incluindo o db)
git stash

# 2. Faça o pull
git pull

# 3. NÃO aplique o stash (para manter seu db intacto)
# Pronto! Seu banco local permanece como está
```

## 🎯 Recomendação: Use a Opção 3

É a mais simples e segura:

```bash
git stash
git pull
```

Seu banco de dados local será preservado e o Git vai parar de rastreá-lo.

## ⚠️ Importante

Após resolver, **sempre** que fizer pull/push, o banco de dados NÃO será sincronizado (e isso é bom!). Cada desenvolvedor deve ter seu próprio banco de desenvolvimento.

## 🔄 Para criar novo banco após pull

Se você quiser começar do zero com as novas migrations:

```bash
cd backend
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo_data  # Se existir
```

## ✅ Verificar se está funcionando

Após resolver, execute:

```bash
git status
```

Você NÃO deve ver `backend/db.sqlite3` na lista de arquivos modificados.
