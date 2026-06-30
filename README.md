# Procurement Management System (PMS)

Enterprise web application for procurement, inventory, quality control, and reporting. Built by **Celeris Venture Systems Pvt. Ltd.**

## Modules

| Module | Description |
|--------|-------------|
| **Purchase** | Requisitions, RFQ, purchase orders, goods receipt, supplier management |
| **Inventory** | GRN, internal issue, material transfer, stock inquiry, physical verification |
| **Quality** | Inspection planning and quality master data |
| **Finance & Reports** | Procurement registers and operational dashboards |
| **Settings** | Roles, menus, multi-location support, branding |

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Recharts
- **Backend:** Node.js, Express, Mongoose, JWT
- **Database:** MongoDB (Atlas)

## Quick Start

### Prerequisites

- Node.js `>=14.18.0 <15`
- MongoDB (Atlas or local)
- npm

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure environment

Copy `backend/.env.example` to `backend/.env` and set:

```env
PORT=5020
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 3. Run the app

**Terminal 1 — Backend** (port `5020`):

```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend** (port `5173`):

```bash
cd frontend
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173).

### First-time database setup

```bash
cd backend
npm run seed:framework
npm run seed:erp-sidebar
```

## Project Structure

```
├── backend/          # Express API, models, scripts
├── frontend/         # React + Vite UI
├── docs/             # Functional and technical documentation
└── deploy/           # Production deployment notes
```

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/FUNCTIONAL_INDEX.md](docs/FUNCTIONAL_INDEX.md) | Business / user documentation index |
| [docs/TECHNICAL_GUIDE.md](docs/TECHNICAL_GUIDE.md) | Architecture, APIs, development guide |
| [docs/FUNCTIONAL_OVERVIEW.md](docs/FUNCTIONAL_OVERVIEW.md) | Login, app shell, dashboard |
| [deploy/DEPLOY.md](deploy/DEPLOY.md) | Production deployment |

## Useful Scripts

```bash
# Backend (from backend/)
npm run dev              # Start API with nodemon
npm run seed:framework   # Seed company, users, roles, menus
npm run seed:erp-sidebar # Sync sidebar and hub cards from menu catalog

# Frontend (from frontend/)
npm run dev              # Start Vite dev server
npm run build            # Production build
```

---

**Version:** 1.1.0 · **Developer:** Celeris Venture Systems Pvt. Ltd.
