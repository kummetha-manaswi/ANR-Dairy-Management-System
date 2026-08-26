# Installation Guide - Local Development Setup

Follow these instructions to configure and run the ANR Dairy Management System locally.

---

## Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: Community Edition v6.x or higher running locally (port `27017`)

---

## 1. Backend Setup

1. Open a terminal and navigate to the backend folder:
   ```bash
   cd "Milk Management System/backend"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `backend` folder:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/anr_dairy
   JWT_SECRET=anr_dairy_premium_secret_key_1029
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```
4. Seed the database with demo datasets:
   ```bash
   node scratch/seed.js
   ```
5. Boot the development API server:
   ```bash
   npm run dev
   ```
   The API server will listen on `http://localhost:5000`.

---

## 2. Frontend Setup

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd "Milk Management System/frontend"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Boot the Vite development server:
   ```bash
   npm run dev
   ```
   The application UI will compile and open at `http://localhost:5173`.

---

## 3. Demo Credentials

Use these seeded logins to test the portal:
- **Admin**: Phone: `9999999999` | Password: `Admin@123`
- **Employee**: Phone: `8888888888` | Password: `Employee@123`
