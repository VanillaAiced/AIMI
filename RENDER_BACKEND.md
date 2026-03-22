# Render Backend Deployment

Your Django backend is now configured for Render deployment with PostgreSQL.

## Quick Start (3 Steps)

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Configure for Render deployment"
git push origin main
```

### Step 2: Deploy on Render

1. Go to [render.com](https://render.com) → Sign up/Login
2. Click **New +** → **Blueprint**
3. **Connect your GitHub** repo
4. Click **Connect**
5. Render auto-detects `render.yaml` → Click **Deploy**
6. Wait 3-5 minutes for deployment

### Step 3: Update Vercel Frontend

Once the backend URL is ready:

1. Render Dashboard → **aimi-backend** service
2. Copy the **URL** (e.g., `https://aimi-backend-xxxxx.render.com`)
3. Go to **Vercel Dashboard**
4. Frontend project → **Settings** → **Environment Variables**
5. Update `REACT_APP_API_URL` to your Render backend URL
6. **Redeploy** on Vercel

**Done!** Your full stack is now deployed.

---

## What's Included

**render.yaml** sets up:

- ✅ Django web service on free tier
- ✅ PostgreSQL database (free tier, auto-configured)
- ✅ Auto-migrations on deploy
- ✅ Static files collection
- ✅ Environment variables pre-configured

**Features:**

- Auto scaling (free tier limited)
- SSL/HTTPS included
- PostgreSQL backup (7 days)
- Deploy hooks from GitHub

---

## Environment Variables (Render Dashboard)

These are pre-configured in `render.yaml`. You can edit in Render Dashboard if needed:

| Variable               | Value                                | Notes                                |
| ---------------------- | ------------------------------------ | ------------------------------------ |
| `DEBUG`                | `False`                              | Keep as False for security           |
| `SECRET_KEY`           | (auto-generated)                     | Keep this secret                     |
| `ALLOWED_HOSTS`        | `*.render.com,localhost`             | Render domain only                   |
| `CORS_ALLOWED_ORIGINS` | `https://your-vercel-app.vercel.app` | **UPDATE THIS with your Vercel URL** |
| `DATABASE_URL`         | (auto-from PostgreSQL)               | Auto-configured                      |

---

## Database Management

### View PostgreSQL Details

1. Render Dashboard → **aimi-postgres** service
2. **Internal Database URL** — Use this for migrations
3. Connection credentials available under "Info"

### Access Database

In Render Dashboard → aimi-backend → **Shell**:

```bash
# Run migrations
python backend/manage.py migrate

# Create superuser for admin panel
python backend/manage.py createsuperuser

# Check database
python backend/manage.py shell
```

### Reset Database (if needed)

1. Render Dashboard → **aimi-postgres**
2. Click **Delete** (careful — loses all data)
3. Render will create a new database automatically on next deploy

---

## Deployment Logs

Monitor your deployment in Render Dashboard:

1. Click **aimi-backend** service
2. **Logs** tab shows:
   - Build progress (dependencies)
   - Migration output
   - Static files collection
   - Runtime errors

Common success indicators:

```
Building buildCommand
Installing dependencies...
Running migrations...
Collecting static files...
Build successful
```

---

## Testing Your Backend

Once deployed:

```bash
# Test the API is running
curl https://aimi-backend-xxxxx.render.com/api/courses/

# Should return JSON (even if empty list)
# If you get CORS error, update CORS_ALLOWED_ORIGINS in Render Dashboard
```

---

## Restart Service

If you need to restart the backend:

1. Render Dashboard → **aimi-backend**
2. Click **Manual Deploy** → **Deploy Latest**
3. Service restarts with new environment

---

## Monitoring

Check health in Render Dashboard:

- **Green** ✓ = Service running
- **Building** = In progress
- **Red** ✗ = Error occurred (check Logs)

For continuous monitoring:

- Enable **Metrics** (free tier limited)
- Check PostgreSQL status under **aimi-postgres**

---

## Next Steps

After successful deployment:

1. ✅ Test backend API endpoints
2. ✅ Update Vercel with backend URL
3. ✅ Create admin user (`python manage.py createsuperuser` in Shell)
4. ✅ Test full frontend-to-backend flow
5. ✅ Set up backups (Render does 7-day auto-backup)

---

## Troubleshooting

### "Build failed"

- Check **Logs** for specific error
- Common: `requirements.txt` syntax error
- Solution: Fix and re-deploy

### "Internal Server Error" (500)

- Check backend Logs for Python error
- Usually migrations didn't run
- Solution: Manual run migrations in Shell

### Database connection error

- PostgreSQL may not be ready
- Wait 2-3 minutes and retry
- Check amipostgres status is Green

### CORS errors in frontend

- `CORS_ALLOWED_ORIGINS` missing your Vercel URL
- Solution: Update in Render Dashboard → aimi-backend → Environment

### Static files missing

- Render auto-runs `collectstatic`
- If missing after deploy: Manual Deploy again

---

## Free Tier Limits

Render free tier includes:

- ✅ 750 hours/month (always-on service)
- ✅ Shared CPU
- ✅ 1 PostgreSQL database
- ✅ Git auto-deploy
- ⚠️ Spins down after 15 min inactivity (pro tier removes this)

For production, consider upgrading to **Starter** plan ($7/month).

---

## Support

- Render docs: https://render.com/docs
- Django deployment: https://docs.djangoproject.com/en/6.0/howto/deployment/
- Got stuck? Check render.yaml and DEPLOYMENT.md
