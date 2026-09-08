# BuildFlow — Construction Delivery Management System

Lightweight web app to manage construction delivery workflows (frontend + backend).

## Quick start (local)

1. Backend
   - cd backend
   - npm install
   - cp .env.example .env && set MONGO_URI, JWT_SECRET, PORT...
   - npm run dev   # nodemon server.js

2. Frontend
   - cd Frontend
   - npm install
   - cp .env.example .env && set VITE_API_URL (e.g. http://localhost:5000)
   - npm run dev   # starts Vite dev server

Open the frontend URL printed by Vite (usually http://localhost:5173) and ensure backend is running.

## Repo layout
- /Frontend — React + Vite app (Tailwind CSS)
- /backend — Express API (MongoDB via mongoose)
- Other helper zips/scripts in each folder

## Scripts
Frontend (in /Frontend)
- npm run dev — start Vite dev server
- npm run build — production build
- npm run preview — preview production build
- npm run lint — ESLint

Backend (in /backend)
- npm run dev — start server with nodemon
- npm start — run production server
- npm test — run backend route tests

## Important environment variables
Backend (.env)
- MONGO_URI — MongoDB connection string
- JWT_SECRET — JSON Web Token secret
- PORT — server port (default 5000)

Frontend (.env or .env.local)
- VITE_API_URL — backend base URL (e.g. http://localhost:5000)

## Deployment (recommended)
- Build frontend: cd Frontend && npm run build → outputs production files (deploy to Vercel/Netlify or serve from a static host).
- Run backend: host on Node-capable platform (Heroku, DigitalOcean, Render) and set env vars.
- For single-host setups, serve built frontend from a static server and configure API URL to the hosted backend.

## Tech stack
- Frontend: React + Vite, Tailwind CSS
- Backend: Node.js, Express, Mongoose (MongoDB), JWT, bcryptjs
- Dev tools: ESLint, nodemon, Vite

## Troubleshooting
- 404 images / assets: check filenames and case-sensitivity.
- API errors: verify VITE_API_URL and backend MONGO_URI are correct and server is running.

## Contributing
- Fork → branch `feat/name` → open PR. Run lint/tests before submitting.

## License
MIT © Your Name
