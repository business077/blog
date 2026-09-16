# Inkwell Journal

A MERN-style editorial blog with a React/Vite client, Express API, and Mongoose `Post` model.

## Run locally

1. Install dependencies: `npm run install:all`
2. Copy `.env.example` to `.env` and set `MONGODB_URI`, `ADMIN_PASSWORD`, `JWT_SECRET`, `CLIENT_URL`, `VITE_API_URL`, and `PORT`.
3. Start both apps: `npm run dev`
4. Open `http://localhost:5173`

MongoDB is optional for a quick preview. Without a reachable database, the API uses two seeded in-memory posts for the current server session. The default admin password is `journalist`; set a strong `ADMIN_PASSWORD` and `JWT_SECRET` before deploying.

## Deployment

Deploy the `server` as a Node service and the `client` as a Vite static site. Set `CLIENT_URL` to the deployed client URL and set the client build variable `VITE_API_URL` to the deployed API URL. MongoDB Atlas provides the production `MONGODB_URI`.
