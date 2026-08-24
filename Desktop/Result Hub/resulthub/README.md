# ResultHub — College Result Management & Publishing System

ResultHub is a multi-tenant SaaS for **result management and publishing** — not an
examination or online-test platform. Institutions (junior colleges, degree colleges,
schools, coaching and training institutes) configure their own courses, upload marks
from Excel, review and edit them, then publish results students look up with their
Hall Ticket Number.

Fully independent stack: **React (Vite) + Tailwind + Express + Firebase Firestore + JWT**.
Uses Firebase Admin SDK for server-side database operations and Firebase Authentication.

```
resulthub/
├── backend/                  Express API (MVC)
│   ├── src/config            env + firebase admin
│   ├── src/controllers       request handling
│   ├── src/routes            route tables
│   ├── src/middleware        JWT auth, roles, errors
│   ├── src/services          result calculation, Excel, queries
│   ├── src/validation        zod schemas
│   ├── src/utils             jwt, errors, helpers
│   └── src/database          seed scripts
└── frontend/                 React + Vite + Tailwind + React Router
```

## 1. Requirements

- Node.js 18+
- A Firebase project (Firestore + Authentication)

## 2. Firebase setup

1. Create a project at console.firebase.google.com.
2. Enable **Firestore Database** in Native mode.
3. Enable **Authentication** (Email/Password).
4. Go to **Project Settings → Service Accounts** and generate a private key.
5. Download the JSON service account file and extract:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (include newlines as `\n`)
6. Go to **Project Settings → General → Your apps** and add a web app to get:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `authDomain` → `VITE_FIREBASE_AUTH_DOMAIN`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `storageBucket` → `VITE_FIREBASE_STORAGE_BUCKET`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`

Firestore security rules are enforced at the API level — every college-scoped query
filters on the `college_id` inside the JWT for complete tenant isolation.

## 3. Environment variables

`backend/.env` (copy from `backend/.env.example`):

| Variable | Purpose |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Service account private key |
| `JWT_SECRET` | Signs access tokens — use a long random string |
| `JWT_EXPIRES_IN` | Token lifetime, default `12h` |
| `PORT` | API port, default `4000` |
| `CORS_ORIGIN` | Allowed frontend origin(s), comma separated |
| `SEED_SUPER_ADMIN_*` | Credentials for the seed script |

`frontend/.env` (copy from `frontend/.env.example`):

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the Express API |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

Nothing is hardcoded — the app reads all credentials from the environment.

## 4. Local development

```bash
# backend
cd backend
cp .env.example .env      # fill in your Firebase credentials
npm install
npm run seed              # creates the first Super Admin in Firestore
npm run dev               # http://localhost:4000

# frontend (second terminal)
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

There is **no registration page** for Super Admin or College Admin, by design.
The Super Admin is created by `npm run seed`; colleges are created by the Super Admin.

## 5. Using the platform

**Super Admin** (`/admin`) — platform stats (total / active / disabled colleges, total
students, published results) and college management: add, edit, reset password,
activate, deactivate, delete.

**College Admin** (`/college`)

1. **Courses** — create a course (MPC, BiPC, …), list its subjects with maximum and
   passing marks, and toggle percentage, ranking, pass/fail and grade. All rules live
   in the database; no board logic is hardcoded.
2. **Sections** — any number of sections per course.
3. **Upload Marks** — one workflow with two choices:
   - **Upload All Subjects** — pick course + section + exam, download the template generated
     from that course's configured subjects, fill it, then upload or paste rows into the
     spreadsheet grid; every row is validated (missing or duplicate Hall Ticket Number,
     missing name, invalid or out-of-range marks, unknown section, unknown column, empty
     rows) with problem cells highlighted before import.
   - **Upload Subject-wise** — pick course + section + exam + subject, generate a faculty
     share link (scoped to that single subject) with the section's 4-digit upload code.
     Faculty open the link, verify the code, then upload an Excel file (using the pre-filled
     subject template) or paste rows into the spreadsheet grid; marks are saved as draft until
     the college reviews and publishes.
4. **Students / Results** — search and filter by course, section, exam, pass, fail or rank.
   Edit marks, correct details, add or delete students; totals, percentage, pass/fail,
   section rank and course rank are recalculated on every change. Review subject-wise draft
   marks, publish when satisfied, unpublish to correct, then republish. Export Excel or PDF.

**Students** (`/`) — no login. Search by Hall Ticket Number; only published
results are returned. Print or download a PDF marksheet.

## 6. API summary

```
POST   /api/auth/login                     Super Admin or College Admin
GET    /api/auth/me

GET    /api/super-admin/stats
GET    /api/super-admin/colleges
POST   /api/super-admin/colleges
PUT    /api/super-admin/colleges/:id
PATCH  /api/super-admin/colleges/:id/activate | /deactivate | /password
DELETE /api/super-admin/colleges/:id

GET    /api/college/dashboard
CRUD   /api/college/courses  /api/college/sections  /api/college/students
GET    /api/college/upload/template?course_id=
POST   /api/college/upload/preview   (multipart)
POST   /api/college/upload/preview-paste
POST   /api/college/upload/commit    (accepts existing exam_id or creates a new exam)
POST   /api/college/results/recalculate | /publish
GET    /api/college/results/export/excel | /export/data

GET    /api/public/results?identifier=      published results only

POST   /api/public/faculty-upload/context   subject-wise upload context
GET    /api/public/faculty-upload/template  subject template (link + code)
POST   /api/public/faculty-upload/preview   subject marks preview (excel or paste)
POST   /api/public/faculty-upload/verify    verify faculty upload code
POST   /api/public/faculty-upload/submit    save marks for the link's subject
```

## 7. Security

JWT bearer auth, bcrypt password hashing (cost 10), role-based route guards,
per-request college isolation, zod input validation on every write, 5 MB upload
limit, centralised error handling, and Firebase Admin SDK for privileged server-side
operations.

## 8. Deployment

**Backend on Render** — new Web Service from `backend/`, build `npm install`,
start `npm start`, add every backend environment variable including Firebase credentials,
set `CORS_ORIGIN` to your frontend URL.

**Frontend on Vercel** — import the repo with root `frontend/`, build `npm run build`,
output `dist`, set `VITE_API_URL` to the Render URL and all Firebase web config variables.
Add a rewrite so client-side routes resolve:

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

Run `npm run seed` with production environment variables to create the first Super Admin
in your production Firestore database.
