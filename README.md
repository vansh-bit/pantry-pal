# 🥘 Pantry Pal

A full-stack recipe discovery and pantry management web app.

**Stack:** Python · Django · Django REST Framework · PostgreSQL · React.js · Axios · Vercel

---

## Quick Start (Local Development)

### Backend
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # fill in your values
python manage.py migrate
python manage.py seed_data    # creates sample data + admin account
python manage.py runserver
```
API runs at http://localhost:8000

**Default accounts after seeding:**
- Admin: `admin@pantrypal.com` / `admin123`
- Demo:  `demo@pantrypal.com`  / `demo1234`

### Frontend
```bash
cd frontend
npm install
# .env already set to http://localhost:8000
npm start
```
App runs at http://localhost:3000

---

## Deployment to Vercel

### Step 1 — PostgreSQL database
1. Create a free database at [Supabase](https://supabase.com) or [Neon](https://neon.tech)
2. Copy the connection string — looks like: `postgresql://user:pass@host:5432/dbname`

### Step 2 — Deploy the Django backend
1. Push the `backend/` folder to a GitHub repo
2. Import to Vercel → Framework: **Other**
3. Add environment variables in Vercel dashboard:

| Variable | Value |
|---|---|
| `SECRET_KEY` | Generate at https://djecrety.ir |
| `DEBUG` | `False` |
| `DATABASE_URL` | Your PostgreSQL connection string |
| `ALLOWED_HOSTS` | `your-backend.vercel.app,localhost` |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.vercel.app,http://localhost:3000` |
| `OPENAI_API_KEY` | Optional, enables AI pantry suggestions |
| `OPENAI_MODEL` | Optional, default `gpt-4o-mini` |

4. After first deploy, run migrations via Vercel CLI:
```bash
vercel env pull
python manage.py migrate
python manage.py seed_data
python manage.py createsuperuser
```

### Step 3 — Deploy the React frontend
1. Push `frontend/` to a GitHub repo
2. Import to Vercel → Framework: **Create React App** (auto-detected)
3. Add environment variable:

| Variable | Value |
|---|---|
| `REACT_APP_API_URL` | `https://your-backend.vercel.app` |

4. Deploy — done!

---

## Features
- 🔐 Token-based auth (register / login / logout)
- 📖 Browse & search approved recipes with filters
- ✍️ Submit recipes (multi-step form) with admin approval workflow
- ⭐ Rate and review recipes (one review per user)
- 🥕 Personal pantry — track what ingredients you have
- ✨ AI pantry meal planner — smart recipe suggestions from your pantry
- 🔍 Find recipes from your pantry ingredients
- 📜 Search history with re-run and delete
- 🛡️ Admin panel — approve/reject recipes, manage ingredients
- 🎨 Warm & cozy food-app design (earthy oranges, creams, warm greens)

## API Overview
Base URL: `/api/`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register/` | Create account |
| POST | `/auth/login/` | Get token |
| GET | `/recipes/` | List approved recipes |
| POST | `/recipes/` | Create recipe |
| GET | `/recipes/{id}/` | Recipe detail |
| GET | `/recipes/my-recipes/` | Your recipes |
| POST | `/recipes/{id}/reviews/` | Submit review |
| GET | `/pantry/` | Your pantry |
| POST | `/pantry/ai-suggestions/` | AI meal suggestions from pantry |
| POST | `/search/` | Search + log history |
| GET | `/ingredients/` | Ingredient catalog |
| GET | `/tags/` | All tags |
