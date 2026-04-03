# Pantry Pal – Backend

Django REST API backend deployed on Vercel (serverless).

## Static Files on Vercel

### How it works

Static files (CSS/JS for Django Admin and Jazzmin) are served via [WhiteNoise](https://whitenoise.readthedocs.io/) middleware directly from the Django/WSGI Lambda function.

1. **Build step** (`build_files.sh`) runs during each Vercel deployment:
   - `pip install -r requirements.txt`
   - `python manage.py migrate --noinput` — applies DB migrations
   - `python manage.py collectstatic --noinput` — copies all static assets into `staticfiles/`

2. **`vercel.json`** includes `"includeFiles": "staticfiles/**"` so that the collected static assets are bundled into the Vercel Lambda package and are accessible at runtime.

3. **WhiteNoise** (`whitenoise.middleware.WhiteNoiseMiddleware`) intercepts requests to `/static/...` and serves files directly from `STATIC_ROOT` (`staticfiles/`), without hitting Django views.

4. **Storage backend** is `whitenoise.storage.CompressedStaticFilesStorage`, which pre-compresses files at collect time for efficient serving.

### Verifying static files after deployment

Use `curl -I` to confirm assets return HTTP 200:

```bash
# Django Admin base CSS
curl -I https://<your-vercel-domain>/static/admin/css/base.css

# Jazzmin main CSS
curl -I https://<your-vercel-domain>/static/jazzmin/css/main.css
```

Both should return `HTTP/2 200` with `content-type: text/css`.

If you receive 404 for static assets, check:
- That `build_files.sh` ran successfully in the Vercel deployment logs
- That `staticfiles/` was populated (look for "X static files copied" in logs)
- That `"includeFiles": "staticfiles/**"` is present in `vercel.json`

## Local Development

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput   # optional locally
python manage.py runserver
```

Environment variables are loaded from `.env` (copy `.env.example` to get started).
