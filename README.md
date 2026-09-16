# Inkwell Journal

A MERN-style editorial blog with a React/Vite client, Express API, and Mongoose `Post` model.

## Run locally

1. Install dependencies: `npm run install:all`
2. Copy `.env.example` to `.env` and set `MONGODB_URI`, `ADMIN_PASSWORD`, `JWT_SECRET`, `CLIENT_URL`, `VITE_API_URL`, and `PORT`.
3. Start both apps: `npm run dev`
4. Open `http://localhost:5173`

MongoDB is optional for a quick preview. Without a reachable database, the API uses two seeded in-memory posts for the current server session. The default admin password is `journalist`; set a strong `ADMIN_PASSWORD` and `JWT_SECRET` before deploying.

## Deployment

This repository includes deployment configuration for both platforms:

- `render.yaml` configures the Node API with `autoDeploy: true`.
- `client/vercel.json` configures the Vite SPA build and routing.

One-time setup:

1. In Render, create a Blueprint from this repository and add the secret values requested by `render.yaml`.
2. In Vercel, import this repository, set the root directory to `client`, and enable Git integration. Add `VITE_API_URL=https://your-render-service.onrender.com`.
3. In Render, set `CLIENT_URL=https://your-vercel-app.vercel.app`. You can provide multiple origins separated by commas for custom domains or preview URLs.
4. Enable automatic deployments in both dashboards. After that, pushes to the connected branch automatically deploy the backend and frontend.

MongoDB Atlas provides the production `MONGODB_URI`. Vercel preview URLs matching the project deployment pattern are accepted by the API; use `CLIENT_URL` for custom domains.
