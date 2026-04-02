# 🥘 Pantry Pal

A full-stack web app to discover recipes and manage your pantry. You can browse recipes, track ingredients you already have, and get suggestions based on what’s available.

**Tech stack:** Django · Django REST Framework · PostgreSQL · React · Axios · Vercel

---

## Running locally

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# fill in the required values in .env

python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

Backend runs on: http://localhost:8000

**Test accounts (created by seed_data):**

* Admin → `admin@pantrypal.com` / `admin123`
* Demo → `demo@pantrypal.com` / `demo1234`

---

### Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on: http://localhost:3000

---

## Deployment (Vercel)

### 1. Set up database

Create a PostgreSQL database using something like Supabase or Neon.
Copy the connection string (format: `postgresql://user:pass@host:5432/dbname`).

For Supabase:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.your-project-ref.supabase.co:5432/postgres
```

For Vercel serverless runtime, prefer the Supabase pooler connection string if Supabase shows one in the `Connect` screen.

---

### 2. Deploy backend

* Push the project to GitHub
* Create a Vercel project with root directory `home/claude/pantrypal/backend`
* Import into Vercel as framework `Other`
* Keep [build.sh](/Users/vanshsharma/Downloads/PantryPal_Full/home/claude/pantrypal/backend/build.sh) in the backend root so Vercel can use it during deployment

Add these environment variables:

| Variable             | Value                                                  |
| -------------------- | ------------------------------------------------------ |
| SECRET_KEY           | your secret key                                        |
| DEBUG                | False                                                  |
| DATABASE_URL         | postgres connection string                             |
| ALLOWED_HOSTS        | localhost,127.0.0.1,.vercel.app                        |
| CORS_ALLOWED_ORIGINS | https://your-frontend.vercel.app,http://localhost:3000 |
| OPENAI_API_KEY       | optional                                               |
| OPENAI_MODEL         | optional                                               |

Run migrations from your local machine after setting `DATABASE_URL` to Supabase:

```bash
cd backend
python manage.py migrate
python manage.py seed_data
python manage.py createsuperuser
```

---

### 3. Deploy frontend

* Create another Vercel project with root directory `home/claude/pantrypal/frontend`
* Import into Vercel (auto-detects React)

Add:

| Variable          | Value                           |
| ----------------- | ------------------------------- |
| REACT_APP_API_URL | https://your-backend.vercel.app |

Deploy.

After frontend deploy, update backend `CORS_ALLOWED_ORIGINS` with the exact frontend Vercel URL and redeploy backend.

---

## Features

* User authentication (register, login, logout)
* Browse and filter recipes
* Add your own recipes (with admin approval)
* Rate and review recipes
* Pantry tracking (ingredients you have)
* Recipe suggestions based on pantry items
* Search with history tracking
* Admin panel for managing content

---

## API (base: `/api/`)

| Method | Endpoint                | Description         |
| ------ | ----------------------- | ------------------- |
| POST   | /auth/register/         | Register user       |
| POST   | /auth/login/            | Login and get token |
| GET    | /recipes/               | List recipes        |
| POST   | /recipes/               | Create recipe       |
| GET    | /recipes/{id}/          | Recipe details      |
| GET    | /recipes/my-recipes/    | User’s recipes      |
| POST   | /recipes/{id}/reviews/  | Add review          |
| GET    | /pantry/                | Get pantry          |
| POST   | /pantry/ai-suggestions/ | Get suggestions     |
| POST   | /search/                | Search recipes      |
| GET    | /ingredients/           | Ingredients list    |
| GET    | /tags/                  | Tags list           |
