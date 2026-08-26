# ANR Dairy Management System (v1.0.0)

A premium, production-ready, SaaS-enabled Enterprise Resource Planning (ERP) platform for milk dairies. Designed specifically for Indian milk dairies to manage daily collection logistics, automate complex tiered pricing, generate cyclic invoices, process payments, and engage farmers via instant WhatsApp notifications.

---

## 🚀 Key Modules & Capabilities

1. **Farmer Directory**: Manage complete profiles, preferred milk types (Cow/Buffalo), bank details, and toggle active status.
2. **Dynamic Rates Engine**: Supports formula-based calculations or matrix lookups (FAT & SNF) to calculate fair rates per liter instantly.
3. **Milk Collection**: Dual daily shift collections (Morning & Evening) with automated validation ranges for FAT and SNF.
4. **Automated Billing**: Cyclic billing periods (10-day, monthly, weekly) with automated invoices, bonus options, and deductions logs.
5. **WhatsApp Communication**: Broadcast daily summaries, bill alerts, and payment receipts automatically using provider integrations.
6. **Administrative Console**: Role-based access control, security logs audit, data backup archiving, and restorations.
7. **Progressive Web App (PWA)**: Support for offline caching and installation onto mobile devices.

---

## 🛠 Tech Stack

- **Frontend**: React (Vite), React Router v6, Tailwind CSS, Lucide icons, Framer Motion, i18next (bilingual EN/TE support).
- **Backend**: Node.js, Express, Helmet, Express Rate Limit, Morgan, JWT, PDFKit, ExcelJS.
- **Database**: MongoDB (Mongoose ODM).

---

## 📂 Project Architecture

```text
Milk Management System/
├── backend/
│   ├── config/          # Database & configuration loaders
│   ├── controllers/     # API request-response handlers
│   ├── middleware/      # JWT, role verification, and security shields
│   ├── models/          # Mongoose collection schemas
│   ├── routes/          # Express route definitions
│   ├── services/        # Auto-backup scheduler daemon
│   └── server.js        # Backend HTTP API entry point
└── frontend/
    ├── public/          # PWA manifests, icons, service workers
    └── src/
        ├── components/  # Reusable UI controls, Sidebar, Header
        ├── context/     # Global state context (UI, Toast)
        ├── locales/     # English & Telugu translation catalogs
        ├── pages/       # Dashboard and administration UI pages
        ├── services/    # Client API transaction hooks
        └── main.jsx     # Frontend entry point
```

For complete implementation instructions, manuals, REST specs, and system architectures, please refer to the files located inside the [`docs/`](./docs/) directory.
