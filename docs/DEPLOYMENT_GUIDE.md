# Deployment Guide - Production Release

This guide explains how to deploy the ANR Dairy Management System (v1.0.0) to cloud environments.

---

## 1. Database Setup: MongoDB Atlas

1. Create a free account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Deploy a new shared database cluster (M0 sandbox is free).
3. Under **Network Access**, add whitelist rules (allow `0.0.0.0/0` for initial staging on Render).
4. Under **Database Access**, create a user account and save the password.
5. Retrieve your connection string in the format:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/anr_dairy?retryWrites=true&w=majority
   ```

---

## 2. Backend Hosting: Render Web Service

Render is recommended for hosting the Node.js/Express API.

1. Create a free account on [Render](https://render.com/).
2. Click **New** > **Web Service** and link your Git repository.
3. Configure the following service settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
4. Add the following **Environment Variables**:
   - `PORT`: `5000`
   - `MONGO_URI`: *Your MongoDB Atlas connection URI string*
   - `JWT_SECRET`: *A secure long random key string*
   - `JWT_EXPIRE`: `30d`
   - `NODE_ENV`: `production`
5. Deploy. Render will assign a public URL (e.g. `https://anr-dairy-api.onrender.com`).

---

## 3. Frontend Hosting: Vercel Static Hosting

Vercel is recommended for hosting the React static files.

1. Install Vercel CLI locally or link your repository to the dashboard at [Vercel](https://vercel.com/).
2. Create a `vercel.json` file inside the `frontend/` folder to route all request paths back to `index.html` (vital for React Router HTML5 pushState routes):
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```
3. Deploy the frontend from the Vercel dashboard.
4. Set the following environment variable during configuration:
   - `VITE_API_URL`: *Your Render backend service URL* (e.g., `https://anr-dairy-api.onrender.com/api/v1`)
5. Vercel compiles the build folder via `npm run build` and launches the application at a custom web URL.
