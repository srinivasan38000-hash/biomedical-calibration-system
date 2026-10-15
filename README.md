# Biomedical Device Calibration and Maintenance Management System (MERN)

Track biomedical devices, calibration records (with certificate upload), maintenance
records, and see upcoming / overdue calibrations on a dashboard.

**Stack:** MongoDB + Mongoose, Express, React (Vite), Node.js, JWT login.

Note: this is a record-keeping app. It does not perform or certify calibration.

## Folder structure
```
biomedical-calibration-system/
├── backend/    (Express API + MongoDB models + file uploads)
└── frontend/   (React app)
```

## 1. Quick Start (From Root Directory)

### Requirements
- Node.js 18 or newer (https://nodejs.org)
- MongoDB Community Server running locally (Default: `mongodb://127.0.0.1:27017`)

```bash
# 1. Install dependencies for root, backend, and frontend
npm install
npm run install:all

# 2. Seed realistic hospital equipment & calibration data (optional)
npm run seed

# 3. Start both backend and frontend concurrently
npm run dev
```
Open **http://localhost:5173** in your browser.

- Default Admin Account: `admin@biomedical.com` / `admin123`
- Default Technician Account: `tech@biomedical.com` / `tech123`

---

## 2. Manual Start (Separate Terminals)

### Step A - Start the backend
```bash
cd backend
npm install
npm run dev
```
You should see:
```
MongoDB connected
Server running on http://localhost:5000
```
Test it: open http://localhost:5000/api/health  ->  {"status":"ok"}

Settings live in `backend/.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/biomedical_calibration
JWT_SECRET=change_this_to_any_long_random_text
CLIENT_URL=http://localhost:5173
```

### Step B - Start the frontend (open a second terminal)
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

### How the three parts connect
- React (port 5173) calls `/api/...`. Vite forwards those calls to Express (port 5000) - see `frontend/vite.config.js`.
- Express talks to MongoDB using `MONGO_URI`.
- Uploaded certificates are saved in `backend/uploads/` and opened through `/uploads/<file>`.

### First use
1. Click **Register** - the first account becomes **ADMIN**.
2. Add a device (Devices -> + Add device).
3. Open the device -> add a calibration record (attach a PDF certificate) and maintenance records.
4. Go to Dashboard to see overdue and upcoming (next 30 days) calibrations.

### Roles
| Role | Can do |
|------|--------|
| ADMIN | everything, including delete |
| TECHNICIAN | add / edit devices, calibrations, maintenance |
| STAFF | view only |

## 2. API summary (all except auth need a login token)
| Method | URL | Purpose |
|--------|-----|---------|
| POST | /api/auth/register, /api/auth/login | sign up / sign in |
| GET | /api/auth/me | current user |
| GET, POST | /api/equipment | list (search, status filter) / add device |
| GET, PUT, DELETE | /api/equipment/:id | one device |
| GET, POST | /api/calibrations | list (?equipment=id) / add with certificate file |
| DELETE | /api/calibrations/:id | remove record |
| GET, POST | /api/maintenance | list (?equipment=id) / add |
| PUT, DELETE | /api/maintenance/:id | update status / remove |
| GET | /api/dashboard | counts, overdue list, upcoming list |

## 3. Deploy online (free tiers)

### Database - MongoDB Atlas
1. Create a free cluster at https://www.mongodb.com/atlas
2. Database Access -> add a user + password.
3. Network Access -> allow 0.0.0.0/0 (for a demo).
4. Connect -> Drivers -> copy the connection string, e.g.
   `mongodb+srv://USER:PASSWORD@cluster0.xxxx.mongodb.net/biomedical_calibration`

### Backend - Render
1. Push the project to GitHub.
2. Render -> New -> Web Service -> pick your repo.
3. Root Directory: `backend`  |  Build Command: `npm install`  |  Start Command: `npm start`
4. Environment variables:
   - `MONGO_URI` = your Atlas string
   - `JWT_SECRET` = a long random text
   - `CLIENT_URL` = your frontend URL (add after step below; no trailing slash)
5. Deploy and copy the backend URL, e.g. https://biomedical-api.onrender.com

Free Render disks are temporary, so uploaded certificates can disappear on restart.
For permanent files use Render's paid persistent disk or a cloud store such as Cloudinary.

### Frontend - Vercel (or Netlify)
1. Vercel -> New Project -> pick the repo.
2. Root Directory: `frontend`  (Framework: Vite; build `npm run build`; output `dist`)
3. Environment variable: `VITE_API_URL` = your Render backend URL (no trailing slash)
4. Deploy, then put the Vercel URL into `CLIENT_URL` on Render and redeploy the backend.

For Vercel, add `frontend/vercel.json` (already included) so page refresh works with React Router.

## Troubleshooting
- **MongoDB connection failed** - MongoDB service is not running, or `MONGO_URI` is wrong.
- **Network error / blank data** - backend not running on port 5000.
- **CORS error after deploy** - `CLIENT_URL` on the backend must exactly match the frontend URL.
- **Port already in use** - change `PORT` in `backend/.env` and the proxy target in `frontend/vite.config.js`.
