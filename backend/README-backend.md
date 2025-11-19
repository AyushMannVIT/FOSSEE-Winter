# Backend (Django + DRF)

This folder contains a minimal Django backend for the Chemical Equipment Parameter Visualizer.

Requirements
- Python 3.9+
- Install dependencies:

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Run migrations and server:

```powershell
cd backend
python manage.py migrate
python manage.py runserver
```

Production Deployment (Example: Render / Railway / Fly.io)

1. Set environment variables:
	- `DEBUG=False`
	- `SECRET_KEY=<generate a strong secret>`
	- `ALLOWED_HOSTS=your-domain.onrender.com`
	- `DATABASE_URL=postgres://user:pass@host:port/dbname` (if using Postgres)
	- `CORS_ALLOWED_ORIGINS=https://your-frontend-domain.netlify.app` (optional)
2. Install dependencies & collect static (Render build command):
	```bash
	pip install -r requirements.txt
	python manage.py migrate
	python manage.py collectstatic --noinput
	```
3. Start command (Procfile):
	```bash
	gunicorn backend_project.wsgi --log-file -
	```
4. Media files: ensure persistent disk or configure S3 (later enhancement).
5. Test endpoints: `/api/upload/`, `/api/datasets/`, `/api/datasets/<id>/report/`.

Environment-driven settings are in `backend_project/settings.py`.

API endpoints
- POST /api/upload/  (multipart form with 'file')
- GET  /api/datasets/ (list last 5 uploads)
- GET  /api/datasets/{id}/report/ (PDF report with summary and charts)
