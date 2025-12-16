# 🐝 Smart-Hive - Sistema de Gerenciamento de Apiário

Sistema profissional para gerenciamento de colmeias de abelhas, desenvolvido com Django + SQLite no backend e React (Vite + MUI) no frontend.

![Smart-Hive](https://img.shields.io/badge/Status-Em%20Desenvolvimento-yellow)
![Django](https://img.shields.io/badge/Django-4.2-green)
![React](https://img.shields.io/badge/React-18-blue)
![License](https://img.shields.io/badge/License-MIT-orange)

## 📋 Funcionalidades

### 🏠 Dashboard
- Visão geral com métricas em tempo real
- Gráficos de produção mensal
- Status das colmeias (ativas, quarentena, inativas)
- Alertas de tratamentos e próximas inspeções

### 📍 Gestão de Apiários
- Cadastro de múltiplos apiários
- Localização com coordenadas GPS
- Controle de responsáveis e contatos
- Estatísticas por apiário

### 🐝 Gestão de Colmeias
- Cadastro detalhado de cada colmeia
- Quantidade estimada de abelhas
- Tipo/espécie de abelha
- Status (ativa, inativa, em quarentena)
- Histórico de movimentações
- Idade da rainha

### 🔍 Inspeções
- Registro de inspeções periódicas
- Checklist completo de verificação
- Registro de pragas e doenças
- Agendamento de próximas inspeções
- Condições ambientais

### 🍯 Produção de Mel
- Registro de colheitas
- Quantidade por colmeia
- Tipo e qualidade do mel
- Relatórios de produtividade
- Gráficos por período

### 💉 Tratamentos
- Registro de tratamentos e medicamentos
- Controle de período e dosagem
- Status de andamento
- Custos associados

### 🐜 Espécies de Abelhas
- Cadastro de espécies
- Nível de agressividade
- Produção média anual
- Características

## 🚀 Tecnologias

### Backend
- **Python 3.11+**
- **Django 4.2**
- **Django REST Framework**
- **SQLite** (banco de dados)
- **django-cors-headers** (CORS)
- **Pillow** (processamento de imagens)

### Frontend
- **React 18**
- **Vite** (bundler)
- **Material-UI (MUI)** (componentes)
- **React Router DOM** (navegação)
- **Axios** (requisições HTTP)
- **Recharts** (gráficos)
- **Day.js** (datas)

## 📦 Instalação

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- Git

### Backend

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/Smart-Hive.git
cd Smart-Hive

# Entre na pasta do backend
cd backend

# Crie e ative o ambiente virtual
python -m venv venv
.\venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Instale as dependências
pip install -r requirements.txt

# Execute as migrações
python manage.py migrate

# Crie um superusuário (opcional, para acessar o admin)
python manage.py createsuperuser

# Inicie o servidor
python manage.py runserver
```

O backend estará disponível em: `http://localhost:8000`

### Frontend

```bash
# Em outro terminal, entre na pasta do frontend
cd frontend

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O frontend estará disponível em: `http://localhost:5173`

## 🔗 Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/dashboard/` | Estatísticas gerais |
| GET/POST | `/api/especies/` | Listar/Criar espécies |
| GET/PUT/DELETE | `/api/especies/{id}/` | Detalhe/Editar/Excluir espécie |
| GET/POST | `/api/apiarios/` | Listar/Criar apiários |
| GET/PUT/DELETE | `/api/apiarios/{id}/` | Detalhe/Editar/Excluir apiário |
| GET | `/api/apiarios/{id}/colmeias/` | Colmeias do apiário |
| GET/POST | `/api/colmeias/` | Listar/Criar colmeias |
| GET/PUT/DELETE | `/api/colmeias/{id}/` | Detalhe/Editar/Excluir colmeia |
| GET | `/api/colmeias/{id}/historico/` | Histórico da colmeia |
| GET/POST | `/api/inspecoes/` | Listar/Criar inspeções |
| GET/PUT/DELETE | `/api/inspecoes/{id}/` | Detalhe/Editar/Excluir inspeção |
| GET/POST | `/api/producoes/` | Listar/Criar produções |
| GET | `/api/producoes/relatorio/` | Relatório de produção |
| GET/POST | `/api/tratamentos/` | Listar/Criar tratamentos |
| POST | `/api/tratamentos/{id}/finalizar/` | Finalizar tratamento |

## 🎨 Design

O sistema utiliza uma paleta de cores inspirada no universo apícola:

| Cor | Hex | Uso |
|-----|-----|-----|
| 🍯 Mel Dourado | `#F4A100` | Cor primária |
| 🌿 Verde Natureza | `#2E7D32` | Cor secundária |
| 🪵 Marrom Terra | `#5D4037` | Textos |
| 🥛 Creme | `#FFF8E1` | Backgrounds |

## 📁 Estrutura do Projeto

```
Smart-Hive/
├── backend/
│   ├── api/
│   │   ├── migrations/
│   │   ├── admin.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── smarthive/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── manage.py
│   ├── requirements.txt
│   └── db.sqlite3
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Apiarios.jsx
│   │   │   ├── Colmeias.jsx
│   │   │   ├── Inspecoes.jsx
│   │   │   ├── Producao.jsx
│   │   │   ├── Tratamentos.jsx
│   │   │   └── Especies.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── theme.js
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔐 Acesso ao Admin Django

Após criar um superusuário, acesse: `http://localhost:8000/admin/`

## 📄 Licença

Este projeto está sob a licença MIT.

## 👥 Autor

Desenvolvido com ❤️ para apicultores

---

**Smart-Hive** - Transformando a gestão do seu apiário! 🐝
