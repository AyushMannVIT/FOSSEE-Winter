## Chemical Equipment Parameter Visualizer

Hybrid app with Django REST (backend) and React (frontend).

### Local Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py test
python manage.py runserver
```

### Local Frontend

```powershell
# In the root directory
npm install
npm start
```

### Deploy Backend to Render (Free)

This repo includes `render.yaml` (Render Blueprint) that provisions:
- A Python web service for the backend (gunicorn)
- A free Postgres database
- A 1GB disk mounted at `backend/media` for CSV/PDF files

Steps:
1. Push this repo to GitHub.
2. Open Render → New → Blueprint → Connect your repo.
3. Review and Deploy. Render will:
	- Install requirements, run migrations, collect static, launch gunicorn
	- Create a Postgres database and inject `DATABASE_URL`
4. After first deploy, set `CORS_ALLOWED_ORIGINS` to your frontend URL (e.g. `https://your-frontend.netlify.app`).
	- Render → Service → Environment → Add Environment Variable

Notes:
- `ALLOWED_HOSTS` defaults to `*` in the blueprint; tighten if desired.
- Disk is mounted to `/opt/render/project/src/backend/media` and mapped to `MEDIA_ROOT`.

### Deploy Frontend (Netlify)

1. In Netlify, create a new site from this repo (or a separate copy of the `chemstatilizer` folder if you prefer a subdir deploy).
2. Set the environment variable `REACT_APP_API_BASE` to your backend URL + `/api`, e.g. `https://<your-backend>.onrender.com/api`.
3. Build settings:
	- Build command: `npm run build`
	- Publish directory: `build`
4. Deploy.

### Testing After Deploy

```bash
curl -F "file=@sample_equipment_data.csv" https://<your-backend>.onrender.com/api/upload/
curl https://<your-backend>.onrender.com/api/datasets/
curl -o report.pdf https://<your-backend>.onrender.com/api/datasets/<ID>/report/
```

If CORS errors appear in the browser, ensure `CORS_ALLOWED_ORIGINS` on the backend exactly matches your frontend origin (protocol + host).
