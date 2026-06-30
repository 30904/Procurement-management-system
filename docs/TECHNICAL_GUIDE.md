# Procurement Management System — Technical Guide

> **Version:** 1.1.0  
> **Last Updated:** June 2026  
> **Audience:** Developers building applications on top of this framework

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Getting Started](#3-getting-started)
4. [Project Structure](#4-project-structure)
5. [Backend Deep Dive](#5-backend-deep-dive)
   - 5.1 [Models & Collections](#51-models--collections)
   - 5.2 [API Routes](#52-api-routes)
   - 5.3 [Middleware Pipeline](#53-middleware-pipeline)
   - 5.4 [Services](#54-services)
   - 5.5 [Plugins](#55-plugins)
6. [Frontend Deep Dive](#6-frontend-deep-dive)
   - 6.1 [App Shell & Layout](#61-app-shell--layout)
   - 6.2 [Routing](#62-routing)
   - 6.3 [Reusable Components](#63-reusable-components)
   - 6.4 [Context Providers](#64-context-providers)
   - 6.5 [Custom Hooks](#65-custom-hooks)
   - 6.6 [Styling System](#66-styling-system)
     - 6.6.1 [Dynamic Theme Colours](#dynamic-theme-colours)
     - 6.6.2 [SVG Inline Rendering](#svg-inline-rendering)
7. [Framework Features](#7-framework-features)
   - 7.1 [Authentication & Authorization](#71-authentication--authorization)
   - 7.2 [Dynamic Navigation System](#72-dynamic-navigation-system)
   - 7.3 [Role-Based Access Control (RBAC)](#73-role-based-access-control-rbac)
   - 7.4 [Company & Application Branding](#74-company--application-branding)
   - 7.5 [Location Management](#75-location-management)
   - 7.6 [Master Data Management](#76-master-data-management)
   - 7.7 [Notification System](#77-notification-system)
   - 7.8 [Email Service](#78-email-service)
   - 7.9 [Audit Trail](#79-audit-trail)
   - 7.10 [Bulk CSV Import](#710-bulk-csv-import)
   - 7.11 [File Upload Service](#711-file-upload-service)
   - 7.12 [Active Users Monitoring](#712-active-users-monitoring)
   - 7.13 [Profile & Password Management](#713-profile--password-management)
   - 7.14 [Card Groups (Dynamic Grouping)](#714-card-groups-dynamic-grouping)
8. [Settings Panel Organisation](#8-settings-panel-organisation)
9. [Building Your Application](#9-building-your-application)
   - 9.1 [Step-by-Step Setup Sequence](#91-step-by-step-setup-sequence)
   - 9.2 [Adding a New Module](#92-adding-a-new-module)
   - 9.3 [Adding a New Model](#93-adding-a-new-model)
   - 9.4 [Adding a New Page](#94-adding-a-new-page)
   - 9.5 [Registering a CSV Import Profile](#95-registering-a-csv-import-profile)
   - 9.6 [Sending Emails from Your App](#96-sending-emails-from-your-app)
   - 9.7 [Using the File Upload Service](#97-using-the-file-upload-service)
   - 9.8 [Creating Notifications](#98-creating-notifications)
10. [Database Collections Reference](#10-database-collections-reference)
11. [Environment Variables](#11-environment-variables)
12. [Scripts Reference](#12-scripts-reference)
13. [Conventions & Best Practices](#13-conventions--best-practices)
14. [Production Deployment](#14-production-deployment)
15. [Procurement Modules Reference](#15-procurement-modules-reference)

---

## 1. Overview

The Procurement Management System is a full-stack application that provides authentication, role-based access, dynamic menus, notifications, email, file uploads, audit logging, and procurement workflows — developed by Celeris Venture Systems Pvt. Ltd.

### What's Included Out of the Box

| Category              | Features                                                                 |
|-----------------------|--------------------------------------------------------------------------|
| **Auth**              | JWT login/logout, password hashing, session tracking                     |
| **Access Control**    | Roles, permissions per menu item, `PermissionGuard` component            |
| **Navigation**        | Database-driven sidebar, landing hub cards, card groups, 3-level depth   |
| **Company Setup**     | Company profile, branding, logos, fully dynamic theme colours            |
| **Locations**         | Multi-location with GSTIN, contacts, sub-locations                      |
| **Master Data**       | Generic key-value CRUD (trades, skills, cities, departments, etc.)       |
| **Users**             | User CRUD, user codes, profile editing, password change                  |
| **Notifications**     | In-app bell + full page, read/unread, broadcast, categories              |
| **Email**             | SMTP config per company, template engine, test email                     |
| **File Uploads**      | Category-based validation, preview, storage, file manager                |
| **CSV Import**        | Profile-based parsing, validation preview, bulk insert                   |
| **Audit Trail**       | Auto-logs CREATE/UPDATE/DELETE on all models, filterable UI              |
| **Active Users**      | Live view of logged-in users, IPs, last login timestamps                 |
| **Dashboard**         | Welcome banner, quick stats, navigation grid, setup checklist            |
| **Data Table**        | Reusable table with search, sort, column filters, actions                |

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React + Vite)                 │
│  React 18  ·  React Router 6  ·  Recharts  ·  SVGR  ·  CSS Vars│
│  Dev: port 5173  ·  Prod: static build in frontend/dist         │
├─────────────────────────────────────────────────────────────────┤
│                     REST API (Express.js)                       │
│  JWT Auth  ·  RBAC Middleware  ·  Multer  ·  Nodemailer         │
│  Port: 5020 (default)  ·  Listens on 0.0.0.0 in production     │
├─────────────────────────────────────────────────────────────────┤
│                     Database (MongoDB)                          │
│  Mongoose 7  ·  Framework + procurement collections             │
└─────────────────────────────────────────────────────────────────┘
```

**Production (https://pms.idms-atp.com):** Nginx serves `frontend/dist` and reverse-proxies `/api/*` to Node on port 5020. See [deploy/DEPLOY.md](../deploy/DEPLOY.md).

### Tech Stack

| Layer      | Technology                  | Version |
|------------|-----------------------------|---------|
| Frontend   | React                       | 18.3    |
| Bundler    | Vite                        | 4.5     |
| Routing    | React Router DOM            | 6.28    |
| Charts     | Recharts                    | 2.13    |
| Backend    | Express.js                  | 4.21    |
| Database   | MongoDB (via Mongoose)      | 7.8     |
| Auth       | JSON Web Tokens (jsonwebtoken) | 9.0  |
| Hashing    | bcryptjs                    | 2.4     |
| Email      | Nodemailer                  | 8.0     |
| Uploads    | Multer                      | 1.4     |
| CSV        | csv-parse                   | 6.2     |
| Excel      | exceljs                     | 4.4     |
| Security   | Helmet                      | 6.2     |
| SVG Inline | vite-plugin-svgr            | 4.x     |
| Logging    | Morgan                      | 1.10    |

---

## 3. Getting Started

### Prerequisites

- **Node.js** >= 14.18.0
- **MongoDB** (Atlas or local instance)
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd code

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Setup

Create `backend/.env`:

```env
PORT=5020
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=*
NODE_ENV=development
```

### First Run (Fresh Setup)

```bash
# 1. Start the backend
cd backend
npm run dev

# 2. Seed the framework (creates company, admin user, roles, menus)
npm run seed:framework

# 3. Start the frontend
cd ../frontend
npm run dev
```

### Default Login Credentials

After seeding, use these credentials:

| Field    | Value                |
|----------|----------------------|
| Username | `superadmin@celeris.local` |
| Password | `Admin@123`          |

---

## 4. Project Structure

```
code/
├── backend/
│   ├── server.js                    # Entry point — boots Express + MongoDB
│   ├── package.json
│   ├── .env                         # Environment variables
│   ├── uploads/                     # File upload storage (auto-created)
│   ├── scripts/                     # Seed & migration scripts
│   │   ├── seed-framework.js        # Main seed: company, user, roles, menus
│   │   ├── menu-catalog.js          # Static menu catalog definition
│   │   ├── drop-legacy-collections.js
│   │   ├── group-settings-cards.js
│   │   └── add-*.js                 # Individual menu seed scripts
│   └── src/
│       ├── app.js                   # Express app config (CORS, helmet, routes)
│       ├── config/
│       │   └── database.js          # MongoDB connection + audit trail init
│       ├── models/                  # 12 Mongoose models
│       ├── controllers/             # Request handlers
│       ├── services/                # Business logic layer
│       ├── routes/                  # API route definitions
│       ├── middleware/              # Auth, RBAC, error handling
│       ├── plugins/                 # Mongoose plugins (audit trail)
│       └── utils/                   # AppError, helpers
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js               # Vite config (includes vite-plugin-svgr)
│   ├── index.html
│   └── src/
│       ├── App.jsx                  # Route definitions
│       ├── main.jsx                 # React root
│       ├── assets/                  # SVG icons (inline via SVGR), images
│       ├── components/
│       │   ├── auth/                # ProtectedRoute, PermissionGuard
│       │   ├── common/              # DataTable, ActionDropdown, FileUploader
│       │   ├── dashboard/           # QuickStats, SetupChecklist, WelcomeBanner
│       │   ├── hub/                 # HubLandingPage, DynamicMenuHubRoute, DynamicGroupRoute
│       │   ├── layout/              # AppSidebar, Header, Footer, NotificationBell
│       │   ├── modals/              # ChangePasswordModal, CsvImportModal, etc.
│       │   └── settings/            # AddSidebarMenuModal, MenuCatalogPanel, etc.
│       ├── config/                  # navigation.js, iconRegistry.js, subModulesConfig.js
│       ├── context/                 # FooterContext, PermissionsContext, AppBrandingContext
│       ├── hooks/                   # useToast, useLogin, usePermissions, etc.
│       ├── layouts/                 # AppShellLayout (main authenticated shell)
│       ├── pages/
│       │   ├── DashboardPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── ProfilePage.jsx
│       │   ├── NotificationsPage.jsx
│       │   ├── ModulePlaceholderPage.jsx
│       │   └── settings/            # All settings sub-pages (incl. GroupsSetupPage)
│       ├── services/
│       │   └── api.js               # Centralised API client (all fetch calls)
│       ├── styles/                  # CSS files (theme, global, modules)
│       └── utils/                   # authStorage.js
│
└── docs/
    └── TECHNICAL_GUIDE.md           # This document
```

---

## 5. Backend Deep Dive

### 5.1 Models & Collections

| Model         | Collection     | Purpose                                      |
|---------------|----------------|----------------------------------------------|
| `Company`     | `Company`      | Organisation profile, branding, app settings |
| `User`        | `User`         | User accounts, credentials, login tracking   |
| `Role`        | `Role`         | Role definitions with granular permissions   |
| `MenuItem`    | `MenuItem`     | Dynamic navigation items (sidebar, cards, card groups) |
| `MenuIcon`    | `MenuIcon`     | Custom SVG icons for sidebar menus           |
| `Location`    | `Location`     | Business locations with GSTIN and contacts   |
| `SubLocation` | `SubLocation`  | Sub-locations under parent locations         |
| `MasterData`  | `MasterData`   | Generic key-value lookup data                |
| `Notification`| `Notification` | In-app notifications per user                |
| `EmailConfig` | `EmailConfig`  | Per-company SMTP configuration               |
| `AuditLog`    | `AuditLog`     | Automatic operation logs (CUD)               |
| `FileUpload`  | `FileUpload`   | Uploaded file metadata and paths             |

### 5.2 API Routes

All routes are prefixed with `/api`.

#### Authentication (`/api/auth`)
| Method | Endpoint   | Auth | Description            |
|--------|------------|------|------------------------|
| GET    | `/status`  | No   | Health check           |
| POST   | `/login`   | No   | Login with identifier + password |
| POST   | `/logout`  | Yes  | Logout (sets isLoggedIn=N) |

#### Users (`/api/users`)
| Method | Endpoint            | Auth | Description                    |
|--------|---------------------|------|--------------------------------|
| GET    | `/`                 | No   | List all users                 |
| POST   | `/`                 | No   | Create user                    |
| GET    | `/next-code`        | No   | Get next auto-generated code   |
| GET    | `/sessions`         | Yes  | List all user sessions (for Active Users page) |
| GET    | `/profile`          | Yes  | Get current user's profile     |
| PUT    | `/profile`          | Yes  | Update current user's profile  |
| POST   | `/change-password`  | Yes  | Change current user's password |
| PUT    | `/:id`              | No   | Update user by ID              |
| DELETE | `/:id`              | No   | Delete user by ID              |

#### Roles (`/api/roles`)
| Method | Endpoint   | Auth | Description               |
|--------|------------|------|---------------------------|
| GET    | `/`        | No   | List all roles            |
| POST   | `/`        | No   | Create role               |
| PUT    | `/:id`     | No   | Update role               |
| DELETE | `/:id`     | No   | Delete role               |

#### Company (`/api/company`)
| Method | Endpoint            | Auth | Description              |
|--------|---------------------|------|--------------------------|
| GET    | `/`                 | Yes  | Get company details      |
| PUT    | `/`                 | Yes  | Update company details   |
| GET    | `/application`      | Yes  | Get application settings |
| PUT    | `/application`      | Yes  | Update application settings |

#### Framework (`/api/framework`)
| Method | Endpoint                 | Auth | Description                       |
|--------|--------------------------|------|-----------------------------------|
| GET    | `/sidebar`               | Yes  | Get sidebar menu items            |
| GET    | `/landing/:parentCode`   | Yes  | Get landing cards for a parent    |
| GET    | `/menus`                 | Yes  | List all menu items               |
| POST   | `/menus`                 | Yes  | Create menu item                  |
| PUT    | `/menus/:id`             | Yes  | Update menu item                  |
| DELETE | `/menus/:id`             | Yes  | Delete menu item (cascade)        |
| PATCH  | `/menus/:id/visibility`  | Yes  | Toggle menu visibility            |
| PATCH  | `/menus/reorder`         | Yes  | Reorder menu items                |
| GET    | `/modules`               | Yes  | Get module (landing card) items   |
| POST   | `/modules`               | Yes  | Create module                     |
| PUT    | `/modules/:id`           | Yes  | Update module                     |
| DELETE | `/modules/:id`           | Yes  | Delete module                     |
| GET    | `/icons`                 | Yes  | List all menu icons               |
| POST   | `/icons`                 | Yes  | Upload new icon                   |
| PUT    | `/icons/:id`             | Yes  | Update icon                       |
| DELETE | `/icons/:id`             | Yes  | Delete icon                       |
| POST   | `/menus/groups`          | Yes  | Create a card group               |
| PATCH  | `/menus/:id/assign`      | Yes  | Assign a card to a group          |
| GET    | `/rbac`                  | Yes  | Get current user's RBAC data      |

#### Locations (`/api/locations`)
| Method | Endpoint   | Auth | Description           |
|--------|------------|------|-----------------------|
| GET    | `/`        | Yes  | List locations        |
| POST   | `/`        | Yes  | Create location       |
| PUT    | `/:id`     | Yes  | Update location       |
| DELETE | `/:id`     | Yes  | Delete location       |

#### Sub-Locations (`/api/sub-locations`)
| Method | Endpoint   | Auth | Description           |
|--------|------------|------|-----------------------|
| GET    | `/`        | Yes  | List sub-locations    |
| POST   | `/`        | Yes  | Create sub-location   |
| PUT    | `/:id`     | Yes  | Update sub-location   |
| DELETE | `/:id`     | Yes  | Delete sub-location   |

#### Master Data (`/api/master-data`)
| Method | Endpoint       | Auth | Description              |
|--------|----------------|------|--------------------------|
| GET    | `/`            | Yes  | List (with ?category=)   |
| GET    | `/categories`  | Yes  | Get distinct categories  |
| POST   | `/`            | Yes  | Create entry             |
| PUT    | `/:id`         | Yes  | Update entry             |
| DELETE | `/:id`         | Yes  | Delete entry             |

#### Notifications (`/api/notifications`)
| Method | Endpoint         | Auth | Description                  |
|--------|------------------|------|------------------------------|
| GET    | `/`              | Yes  | List user's notifications    |
| GET    | `/count`         | Yes  | Unread count                 |
| PATCH  | `/:id/read`      | Yes  | Mark as read                 |
| PATCH  | `/read-all`      | Yes  | Mark all as read             |
| DELETE | `/:id`           | Yes  | Delete notification          |
| POST   | `/broadcast`     | Yes  | Broadcast to all users       |

#### Email (`/api/email`)
| Method | Endpoint   | Auth | Description              |
|--------|------------|------|--------------------------|
| GET    | `/config`  | Yes  | Get SMTP config          |
| PUT    | `/config`  | Yes  | Save/update SMTP config  |
| POST   | `/test`    | Yes  | Send test email          |
| POST   | `/send`    | Yes  | Send transactional email |

#### Audit Logs (`/api/audit-logs`)
| Method | Endpoint       | Auth | Description               |
|--------|----------------|------|---------------------------|
| GET    | `/`            | Yes  | List logs (paginated, filtered) |
| GET    | `/model-names` | Yes  | Get distinct model names  |
| DELETE | `/:id`         | Yes  | Delete single log         |
| DELETE | `/bulk`        | Yes  | Delete multiple logs      |
| DELETE | `/clear-all`   | Yes  | Clear all logs            |

#### CSV Import (`/api/csv-import`)
| Method | Endpoint           | Auth | Description                  |
|--------|--------------------|------|------------------------------|
| GET    | `/profiles`        | Yes  | List available import profiles |
| GET    | `/template/:key`   | Yes  | Download CSV template        |
| POST   | `/parse`           | Yes  | Upload and validate CSV      |
| POST   | `/import`          | Yes  | Execute validated import     |

#### File Upload (`/api/files`)
| Method | Endpoint          | Auth | Description                |
|--------|-------------------|------|----------------------------|
| GET    | `/categories`     | Yes  | List file categories       |
| POST   | `/upload`         | Yes  | Upload single file         |
| POST   | `/upload-multiple` | Yes | Upload multiple files      |
| GET    | `/`               | Yes  | List uploaded files        |
| GET    | `/:id`            | Yes  | Get file by ID             |
| DELETE | `/:id`            | Yes  | Delete file                |

#### Static Files
| Path               | Description                     |
|--------------------|---------------------------------|
| `/api/uploads/*`   | Serves uploaded files statically |

### 5.3 Middleware Pipeline

Request flow: `Helmet → CORS → JSON parser → Morgan → Routes → notFound → errorHandler`

| Middleware       | File                     | Purpose                                            |
|------------------|--------------------------|-----------------------------------------------------|
| `requireAuth`    | `middleware/auth.js`     | Validates JWT, attaches `req.user`                  |
| `optionalAuth`   | `middleware/auth.js`     | Same as above but doesn't reject if missing         |
| `loadRbac`       | `middleware/loadRbac.js` | Loads user document + RBAC permissions onto request |
| `requirePermission` | `middleware/authorize.js` | Checks specific menu+action permission           |
| `asyncHandler`   | `middleware/asyncHandler.js` | Wraps async controllers (catches errors)        |
| `errorHandler`   | `middleware/errorHandler.js` | Global error handler (returns JSON)             |
| `notFoundHandler`| `middleware/notFound.js` | 404 handler for unmatched routes                   |

### 5.4 Services

| Service                    | File                          | Purpose                                           |
|----------------------------|-------------------------------|---------------------------------------------------|
| **Auth Service**           | `services/auth.service.js`    | Login, logout, JWT creation/verification          |
| **RBAC Service**           | `services/rbac.service.js`    | Resolves user roles → merged permissions          |
| **Email Service**          | `services/email.service.js`   | SMTP transporter, template engine, send mail      |
| **Audit Log Service**      | `services/auditLog.service.js`| Query, filter, delete audit logs                  |
| **CSV Import Service**     | `services/csvImport.service.js`| Profile registry, CSV parsing, validation, import|
| **File Upload Service**    | `services/fileUpload.service.js`| Category validation, storage, metadata CRUD     |
| **Menu Service**           | `services/menu.service.js`      | Sidebar, cards, groups, card assignment          |

### 5.5 Plugins

| Plugin             | File                              | Purpose                                        |
|--------------------|-----------------------------------|------------------------------------------------|
| **Audit Trail**    | `plugins/auditTrail.plugin.js`    | Auto-attaches Mongoose hooks to all models for CUD logging |

The audit trail plugin is registered once after database connection in `config/database.js`. It automatically applies `save`, `findOneAndUpdate`, `findOneAndDelete`, and `deleteOne` hooks to every model (except `AuditLog` itself).

---

## 6. Frontend Deep Dive

### 6.1 App Shell & Layout

The authenticated application uses `AppShellLayout` which provides:

- **Header** — company name, notification bell (`NotificationBell`), user account dropdown
- **Sidebar** — dynamically rendered from database, collapsible, with icon support
- **Footer** — contextual record counts via `FooterContext`
- **Content Area** — renders child routes via `<Outlet />`

### 6.2 Routing

All authenticated routes are nested under `/app` and wrapped in `ProtectedRoute`.

Key route patterns:
- `/app/dashboard` — Dashboard
- `/app/menu-:menuNum` — Dynamic sidebar menu hub pages
- `/app/:hubSegment` — Dynamic segment-based hub pages
- `/app/configuration` — Settings landing (6 group cards)
- `/app/configuration/:groupSlug` — Dynamic group sub-page (resolved by `DynamicGroupRoute`)
- `/app/configuration/<page>` — Individual settings page (specific routes take priority)
- `/app/configuration/groups-setup` — Card group management page
- `/app/notifications` — Full notifications page
- `/app/profile` — User profile page

**Dynamic Group Route:** The `DynamicGroupRoute` component reads the `:groupSlug` from the URL, finds the matching `card_group` menu item, and renders a `HubLandingPage` with that group's children. This replaces the need for separate hardcoded group pages.

### 6.3 Reusable Components

#### `DataTable` (`components/common/DataTable.jsx`)
The primary list/table component used across all pages.

**Props:**
| Prop               | Type       | Default         | Description                                  |
|--------------------|------------|-----------------|----------------------------------------------|
| `columns`          | Array      | required        | `{ key, label, width, align, sortable?, filterable?, render?, type? }` |
| `rows`             | Array      | required        | Data rows (each needs `id` or `_id`)         |
| `loading`          | Boolean    | `false`         | Hides table while loading                    |
| `searchPlaceholder`| String     | `"Search..."`   | Search input placeholder                     |
| `showSearch`       | Boolean    | `true`          | Show/hide search bar                         |
| `showNewBtn`       | Boolean    | `true`          | Show/hide "+ New" button                     |
| `onNew`            | Function   | —               | Callback for new button click                |
| `actions`          | Array      | —               | `[{ label, onClick(row) }]` dropdown actions |
| `onRowClick`       | Function   | —               | Row click callback                           |
| `emptyMessage`     | String     | `"No records"`  | Empty state text                             |
| `toolbarRight`     | ReactNode  | —               | Custom toolbar content                       |

**Static method:** `DataTable.useRecordCount(rows, setFooterContent)` — auto-updates footer with record count.

**Column types:** `"date"`, `"status"`, `"password"`, or custom via `render` function.

#### `FileUploader` (`components/common/FileUploader.jsx`)
Drag-and-drop file upload component with preview.

#### `ActionDropdown` (`components/common/ActionDropdown.jsx`)
Three-dot action menu for table rows.

#### `PermissionGuard` (`components/auth/PermissionGuard.jsx`)
Wraps routes/components to enforce RBAC. Shows "Access Denied" if the user lacks permission.

```jsx
<PermissionGuard menuCode="master_data">
  <MasterDataPage />
</PermissionGuard>
```

#### `HubLandingPage` (`components/hub/HubLandingPage.jsx`)
Renders landing cards from the database for a given `parentCode`. Used for Settings, Masters, and custom hub pages.

#### `DynamicGroupRoute` (`components/hub/DynamicGroupRoute.jsx`)
Resolves `:groupSlug` URL parameters to `card_group` menu items and renders the appropriate `HubLandingPage`. Used for database-driven group pages (e.g., `/app/configuration/company-setup`).

#### `NotificationBell` (`components/layout/NotificationBell.jsx`)
Header bell icon with unread count badge and dropdown panel.

### 6.4 Context Providers

| Context               | File                          | State Managed                           |
|-----------------------|-------------------------------|------------------------------------------|
| `FooterContext`       | `context/FooterContext.jsx`   | Footer content (record counts)           |
| `PermissionsContext`  | `context/PermissionsContext.jsx` | User's RBAC permissions, `isSuperAdmin` |
| `AppBrandingContext`  | `context/AppBrandingContext.jsx` | Company name, logo URLs, dynamic CSS theme variables |

### 6.5 Custom Hooks

| Hook                  | File                           | Purpose                                   |
|-----------------------|--------------------------------|-------------------------------------------|
| `useLogin`            | `hooks/useLogin.js`            | Login form state, API call, token storage |
| `useToast`            | `hooks/useToast.js`            | Toast notification system (success/error) |
| `usePermissions`      | `hooks/usePermissions.js`      | Access permissions context                |
| `useFooter`           | `hooks/useFooter.js`           | Footer content setter (via context)       |
| `useAppBranding`      | `hooks/useAppBranding.js`      | Company branding data                     |
| `useMenuIconCatalog`  | `hooks/useMenuIconCatalog.js`  | Loaded sidebar icon catalog               |
| `useModalDrag`        | `hooks/useModalDrag.js`        | Draggable modal position logic            |

### 6.6 Styling System

The framework uses a combination of global CSS and CSS Modules:

| File                          | Scope                                        |
|-------------------------------|----------------------------------------------|
| `styles/theme.css`            | Tables, toolbars, tooltips, master list styles |
| `styles/global.css`           | Page layout, breadcrumbs, buttons, grids      |
| `styles/erp-layout.css`       | App shell, sidebar, header, footer            |
| `styles/subcomponents.css`    | Modals, cards, form fields, dropdowns         |
| `styles/page-toolbar.module.css` | Page-level toolbar (CSS Module)           |

**Design conventions:**
- All sizes use `vw`/`vh` units for responsive scaling
- Font family: `Inter` (Google Fonts)
- All brand colours are fully dynamic via CSS custom properties (see below)

#### Dynamic Theme Colours

The framework uses a **database-driven colour system**. When the user changes the primary or accent colour in `Settings > Application Setup`, the change propagates to every element in the application — including CSS, inline styles, and SVG icons.

**How it works:**
1. `AppBrandingContext` loads the configured `themePrimaryColor` and `themeAccentColor` from the database
2. The `applyColorScale()` utility generates a set of derived CSS variables on `document.documentElement`
3. All CSS files, inline styles, and SVG icons reference these variables instead of hardcoded hex values

**Generated CSS Variables:**

| Variable                     | Derivation        | Example (primary = `#197dfa`) |
|------------------------------|-------------------|-------------------------------|
| `--brand-primary`            | Base colour       | `#197dfa`                     |
| `--brand-primary-rgb`        | RGB components    | `25, 125, 250`                |
| `--brand-primary-dark`       | 12% darker        | `rgb(22, 110, 220)`           |
| `--brand-primary-light`      | 94% tint          | `rgb(242, 248, 255)`          |
| `--brand-primary-bg`         | 88% tint          | `rgb(229, 241, 254)`          |
| `--brand-primary-border`     | 75% tint          | `rgb(197, 222, 252)`          |
| `--brand-primary-ring`       | 18% opacity       | `rgba(25, 125, 250, 0.18)`    |
| `--brand-primary-outline`    | 25% opacity       | `rgba(25, 125, 250, 0.25)`    |
| `--brand-primary-shadow`     | 15% opacity       | `rgba(25, 125, 250, 0.15)`    |
| `--brand-primary-subtle`     | 8% opacity        | `rgba(25, 125, 250, 0.08)`    |
| `--brand-primary-10`         | 10% opacity       | `rgba(25, 125, 250, 0.1)`     |
| `--brand-primary-20`         | 20% opacity       | `rgba(25, 125, 250, 0.2)`     |
| `--brand-primary-35`         | 35% opacity       | `rgba(25, 125, 250, 0.35)`    |
| `--brand-primary-80`         | 80% opacity       | `rgba(25, 125, 250, 0.8)`     |
| `--brand-primary-text`       | 35% darker        | `rgb(16, 81, 163)`            |
| `--brand-chevron-svg`        | SVG data URI      | Dynamic dropdown arrow SVG    |

The same set is generated for `--brand-accent-*` from `themeAccentColor`.

**Default colours** (used when no database values are configured):
- Primary: `#197dfa`
- Accent: `#ff0096`

#### SVG Inline Rendering

All SVG icons with brand colours are imported as **React components** using `vite-plugin-svgr` (via the `?react` import suffix). This means SVGs render as inline `<svg>` elements in the DOM, allowing them to access CSS custom properties for dynamic colouring.

```jsx
// Brand-coloured SVG → inline React component
import BackIcon from "../../assets/back.svg?react";
<BackIcon className="erp-back-icon" />

// Non-brand SVG → stays as URL for <img>
import CloseBtnIcon from "../../assets/close-btn.svg";
<img src={CloseBtnIcon} alt="Close" />
```

Inside each SVG file, hardcoded hex values have been replaced with CSS variable references:
```css
/* Inside back.svg <style> block */
.cls-1 { fill: #fff; stroke: var(--brand-primary, #197dfa); }
.cls-2 { fill: var(--brand-primary, #197dfa); }
```

The `prefixIds` SVGO plugin is configured in `vite.config.js` to prevent CSS class name collisions when multiple inline SVGs are rendered on the same page.

---

## 7. Framework Features

### 7.1 Authentication & Authorization

**Login Flow:**
1. User submits `identifier` (email/username) + `password`
2. Backend finds user, verifies bcrypt hash
3. JWT token generated with payload: `{ sub, company, userType }`
4. Token stored in `localStorage` via `authStorage.js`
5. User's `lastLoggedIn`, `isLoggedIn`, `userIP`, `userDevice` updated
6. Frontend attaches token as `Authorization: Bearer <token>` header

**Logout Flow:**
1. Backend sets `user.isLoggedIn = "N"`
2. Frontend clears `localStorage` and redirects to `/login`

**Token Expiry:** Configurable via `JWT_EXPIRES_IN` env var (default: `7d`)

### 7.2 Dynamic Navigation System

The entire navigation — sidebar items and landing page cards — is driven from the `MenuItem` collection in MongoDB. This means you can add, remove, reorder, or hide menu items without any code changes.

**Menu Types:**
| Type            | Where it appears                          |
|-----------------|-------------------------------------------|
| `sidebar_main`  | Main sidebar navigation                   |
| `sidebar_bottom`| Bottom sidebar (e.g., Settings, Support)  |
| `landing_card`  | Hub landing page cards                    |
| `card_group`    | Grouping container for landing cards      |
| `page`          | Standalone pages                          |

**Key Fields:**
- `code` — unique identifier (used for permissions)
- `segment` — URL path segment
- `parentCode` — parent menu's code (for hierarchical cards)
- `sequence` — display order
- `isActive` / `isHidden` — visibility control
- `iconKey` / `activeIconKey` — sidebar icon references
- `requiresSuperAdmin` — restrict to super admin only
- `variant: "admin"` — shows the "S" badge on the card

**3-Level Navigation (with optional grouping):**
```
Sidebar Item → Hub Landing Page (group cards / cards) → Actual Page
                                    ↓
                            Group Sub-Page (cards) → Actual Page
```

**Card Groups:** The `card_group` menu type allows organising landing cards into logical groups. A `card_group` acts as a container — clicking it navigates to a sub-page showing only its child cards. Groups are fully database-driven and can be created via `Settings > Application Setup > Groups Setup`. The `DynamicGroupRoute` component resolves group URLs at runtime.

**Example hierarchy:**
```
Settings (sidebar_bottom)
  ├── Company Setup (card_group, parentCode: "settings")
  │   ├── Company (landing_card, parentCode: "company_setup_group")
  │   ├── Location Master (landing_card, parentCode: "company_setup_group")
  │   └── Sub-locations (landing_card, parentCode: "company_setup_group")
  ├── Application Setup (card_group, parentCode: "settings")
  │   ├── Application Set-up (landing_card, parentCode: "app_setup_group")
  │   └── ...
  └── ...
```

### 7.3 Role-Based Access Control (RBAC)

**How It Works:**

1. **Roles** are created with a set of **permissions** — each permission links to a `MenuItem` and grants specific actions (view, create, edit, delete, approve, cancel, download, etc.)
2. **Users** are assigned one or more roles
3. On login, the frontend fetches the user's merged permissions via `/api/framework/rbac`
4. `PermissionsContext` exposes `hasPermission(menuCode, action)` and `isSuperAdmin`
5. `PermissionGuard` component wraps routes to enforce access
6. Backend can enforce via `requirePermission(menuCode, action)` middleware

**Super Admin** users (`userType === "SUPER_ADMIN"`) bypass all permission checks.

**Permission Actions:**
| Action           | Description                          |
|------------------|--------------------------------------|
| `view`           | Can see the page/module              |
| `create`         | Can create new records               |
| `edit`           | Can edit existing records            |
| `delete`         | Can delete records                   |
| `approve`        | Can approve workflows                |
| `cancel`         | Can cancel operations                |
| `download`       | Can download/export data             |
| `reportGenerated`| Can generate reports                 |
| `acknowledgment` | Can acknowledge items                |

### 7.4 Company & Application Branding

The `Company` model stores both business details and application branding:

**Business Fields:** Company name, PAN, TAN, GSTIN classification, MSME, address, contacts

**Application Branding (via Settings > Application Setup):**
- Application name, short name, version, tagline
- Developer name, support email/phone
- Theme primary/accent colours
- Logos: main logo, sidebar logo, login page logo, favicon
- Environment: development / staging / production

The `AppBrandingContext` loads these on app start and applies them globally:
- **CSS Variables:** All brand colours are injected as CSS custom properties on `document.documentElement`, generating a full scale of derived colours (see Section 6.6)
- **SVG Icons:** All sidebar and UI icons automatically adopt the configured colours since they reference CSS variables internally
- **Favicon & Meta:** Dynamically updated based on configured logos
- **Document Title:** Reflects the configured application name

Changing the primary or accent colour in Application Setup immediately updates every button, link, icon, sidebar accent, table header, filter highlight, and SVG throughout the entire application — no code changes or page reload required.

### 7.5 Location Management

**Locations** (`Settings > Company Setup > Location Master`):
- Each location has a unique code, GSTIN, address, coordinates
- Supports multiple contact persons per location
- Active/Inactive status

**Sub-Locations** (`Settings > Company Setup > Sub-locations`):
- Child records under a parent location
- Own code, address, status

### 7.6 Master Data Management

A generic key-value store for any lookup data your application needs.

**How to Use:**
1. Go to `Settings > Data Management > Master Data`
2. Select or create a **category** (e.g., `trade`, `skill`, `department`, `city`)
3. Add entries with: Label, Value, Description, Sequence, Status

**From Code:**
```javascript
// Backend — query master data
const trades = await MasterData.find({ category: "trade", status: "Active" });

// Frontend — via API
const res = await apiFetch("/master-data?category=trade");
```

### 7.7 Notification System

**Creating Notifications (Backend):**
```javascript
import { Notification } from "../models/Notification.model.js";

await Notification.create({
  company: companyId,
  recipient: userId,
  title: "Application Approved",
  body: "Your application has been approved by the admin.",
  type: "success",       // info | success | warning | error | system
  category: "application",
  link: "/app/my-applications",
});
```

**Broadcasting (to all users):**
```javascript
POST /api/notifications/broadcast
{
  "title": "System Maintenance",
  "body": "Scheduled downtime on Saturday.",
  "type": "system"
}
```

**Frontend:**
- `NotificationBell` in header shows unread count and recent notifications
- `/app/notifications` page shows full list with DataTable

### 7.8 Email Service

**Setup:**
1. Go to `Settings > Communication > Email Configuration`
2. Enter SMTP details (host, port, user, password, from name/email)
3. Click "Test Email" to verify

**Sending Emails from Code:**
```javascript
import { sendEmail } from "../services/email.service.js";

await sendEmail({
  companyId: req.user.company,
  to: "user@example.com",
  subject: "Welcome to {{appName}}",
  template: "welcome",
  variables: {
    appName: "My Application",
    userName: "John Doe",
    loginUrl: "https://app.example.com/login",
  },
});
```

**Built-in Template Variables:**
The template engine replaces `{{variableName}}` with provided values. Templates are defined as HTML strings in the email service.

### 7.9 Audit Trail

The audit trail system **automatically logs** every CREATE, UPDATE, and DELETE operation on all Mongoose models with zero configuration.

**What Gets Logged:**
| Field         | Description                                  |
|---------------|----------------------------------------------|
| `action`      | CREATE, UPDATE, or DELETE                    |
| `modelName`   | Which model was affected                     |
| `documentId`  | The document's `_id`                         |
| `summary`     | Human-readable summary                       |
| `changes`     | Field-by-field diff (for updates)            |
| `previousData`| Full document before deletion                |
| `userName`    | Who performed the action                     |
| `ipAddress`   | Client IP address                            |
| `createdAt`   | When it happened                             |

**Viewing Logs:** `Settings > System > Audit Logs`
- Filter by action type, model name, date range
- View detailed changes for each entry
- Delete individual logs or clear all

**Excluded Models:** `AuditLog` (to prevent infinite loops)

### 7.10 Bulk CSV Import

The CSV import system uses **profiles** — predefined configurations that describe how a CSV maps to a Mongoose model.

**Built-in Profiles:**
| Profile       | Target Model | Columns                                    |
|---------------|--------------|---------------------------------------------|
| `master_data` | MasterData   | Category, Label, Value, Description, Sequence, Status |
| `users`       | User         | Name, Username, Email, Department, Password, User Type, Status |

**Import Workflow:**
1. Go to `Settings > Data Management > Bulk CSV Import`
2. Select a profile
3. Download the CSV template
4. Fill in data and upload
5. Preview valid/invalid rows with error details
6. Click Import to execute

**Registering a Custom Profile (see Section 9.5)**

### 7.11 File Upload Service

**File Categories:**
| Category       | Allowed Types                        | Max Size |
|----------------|--------------------------------------|----------|
| `profile_photo`| JPEG, PNG, WebP                      | 2 MB     |
| `document`     | PDF, JPEG, PNG, WebP                 | 10 MB    |
| `certificate`  | PDF, JPEG, PNG                       | 10 MB    |
| `spreadsheet`  | CSV, XLS, XLSX                       | 5 MB     |
| `general`      | Images, PDF, CSV, TXT, DOC, DOCX, XLS, XLSX | 10 MB |

**Uploading from Code:**
```javascript
// Frontend — using FileUploader component
import FileUploader from "../components/common/FileUploader.jsx";

<FileUploader
  category="document"
  onUploadComplete={(file) => console.log("Uploaded:", file)}
  multiple={false}
/>
```

**File Manager:** `Settings > Communication > File Manager` provides a Super Admin UI to browse, filter, upload, and delete files.

### 7.12 Active Users Monitoring

`Settings > System > Active Users` shows a table of all users with:
- Name, User Type, Role, Email
- Status (Active/Inactive badge)
- Logged In status (green/red dot)
- Last login date
- IP address from last login

This data is tracked automatically on every login.

### 7.13 Profile & Password Management

Every authenticated user can:
- **View/Edit Profile** at `/app/profile` — name, email, department
- **Change Password** via modal — requires current password, validates new password

### 7.14 Card Groups (Dynamic Grouping)

Card groups provide a way to organise landing cards into logical categories, fully managed from the database without code changes.

**Creating Groups:**
1. Go to `Settings > Application Setup > Groups Setup`
2. Select a parent sidebar menu (e.g., Settings)
3. Create a new group with a label, code, and optional description
4. The group appears as a tile on the parent's landing page

**Assigning Cards to Groups:**
Cards are assigned to groups by setting their `parentCode` to the group's `code`. This can be done via:
- The Menu Catalog Panel in the admin UI
- The `PATCH /api/framework/menus/:id/assign` API endpoint
- Database seed scripts

**Permission Management:**
Card groups participate in the standard RBAC system. The Permission Management page displays a three-tier hierarchy:
```
Sidebar Menu → Card Group → Individual Card
```
Permissions can be granted at any level, allowing fine-grained control over which users see which cards within a group.

---

## 8. Settings Panel Organisation

The Settings section is organised into **6 group cards**, each containing related sub-pages:

```
Settings
├── Company Setup
│   ├── Company              — Company profile and organisation settings
│   ├── Location Master      — Manage business locations and GSTIN
│   └── Sub-locations        — Manage sub-locations under parent locations
│
├── Application Setup
│   ├── Application Set-up   — App name, version, branding, logos, theme colours
│   ├── Menu Setup           — Sidebar navigation items, order, visibility
│   ├── Modules Setup        — Landing page module cards for each sidebar menu
│   ├── Groups Setup         — Create and manage card groups (database-driven)
│   └── Menu Icons           — Upload custom sidebar icons
│
├── Roles & Access
│   ├── User Management      — Create, edit, delete users
│   ├── Access Management    — Assign permissions to roles
│   └── Permission Management— View permission matrix
│
├── Data Management
│   ├── Master Data          — Generic key-value lookup data (CRUD)
│   └── Bulk CSV Import      — Upload and import CSV data
│
├── Communication
│   ├── Email Configuration  — SMTP settings and test email
│   └── File Manager         — Upload, preview, manage files
│
└── System
    ├── Audit Logs           — View/filter/delete operation logs
    └── Active Users         — Monitor logged-in users and sessions
```

---

## 9. Building Your Application

### 9.1 Step-by-Step Setup Sequence

When setting up the framework for a new application, follow this order:

| Step | Action                           | Where                                |
|------|----------------------------------|--------------------------------------|
| 1    | Configure environment            | `backend/.env`                       |
| 2    | Run `npm run seed:framework`     | Seeds company, admin user, roles, menus |
| 3    | Login as Super Admin             | Default credentials (see Section 3)  |
| 4    | Update Company Details           | Settings > Company Setup > Company   |
| 5    | Configure Application Branding   | Settings > Application Setup > Application Set-up |
| 6    | Upload Custom Logos              | Settings > Application Setup > Application Set-up |
| 7    | Configure Locations              | Settings > Company Setup > Location Master |
| 8    | Set Up Master Data               | Settings > Data Management > Master Data |
| 9    | Configure SMTP                   | Settings > Communication > Email Configuration |
| 10   | Create Roles                     | Settings > Roles & Access > Access Management |
| 11   | Set Permissions                  | Settings > Roles & Access > Permission Management |
| 12   | Create Users                     | Settings > Roles & Access > User Management |
| 13   | Customise Sidebar Menus          | Settings > Application Setup > Menu Setup |
| 14   | Add Module Cards                 | Settings > Application Setup > Modules Setup |
| 15   | Upload Custom Icons              | Settings > Application Setup > Menu Icons |
| 16   | Start Building Your Pages        | See sections 9.2–9.8                 |

### 9.2 Adding a New Module

To add a new business module (e.g., "Recruitment"):

**1. Create the Mongoose Model:**

```javascript
// backend/src/models/JobPosting.model.js
import mongoose from "mongoose";

const jobPostingSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  title: { type: String, trim: true, required: true },
  // ... your fields
}, { timestamps: true, collection: "JobPosting" });

export const JobPosting = mongoose.models.JobPosting || mongoose.model("JobPosting", jobPostingSchema);
```

**2. Create the Service:**

```javascript
// backend/src/services/jobPosting.service.js
import { JobPosting } from "../models/JobPosting.model.js";

export async function listJobPostings(companyId) {
  return JobPosting.find({ company: companyId }).sort({ createdAt: -1 }).lean();
}
// ... create, update, delete functions
```

**3. Create the Controller:**

```javascript
// backend/src/controllers/jobPosting.controller.js
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as service from "../services/jobPosting.service.js";

export const list = asyncHandler(async (req, res) => {
  const data = await service.listJobPostings(req.user.company);
  res.json({ success: true, data });
});
```

**4. Create the Route:**

```javascript
// backend/src/routes/jobPosting.routes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { list, create, update, remove } from "../controllers/jobPosting.controller.js";

const router = Router();
router.get("/", requireAuth, list);
router.post("/", requireAuth, create);
router.put("/:id", requireAuth, update);
router.delete("/:id", requireAuth, remove);
export default router;
```

**5. Register the Route:**

```javascript
// backend/src/routes/index.js
import jobPostingRoutes from "./jobPosting.routes.js";
router.use("/job-postings", jobPostingRoutes);
```

**6. Add the Menu Item (via Settings UI or seed script):**

Use `Settings > Application Setup > Menu Setup` to add a sidebar item, then `Modules Setup` to add landing cards under it.

**7. The audit trail will automatically log all CRUD operations** on your new model — no extra code needed.

### 9.3 Adding a New Model

Every model follows this pattern:

```javascript
import mongoose from "mongoose";

const schema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },
  // ... your fields
}, { timestamps: true, collection: "YourCollectionName" });

// Add useful indexes
schema.index({ company: 1, someField: 1 });

export const YourModel = mongoose.models.YourModel || mongoose.model("YourModel", schema);
```

**Important:** Import the model file in `server.js` or any controller/service file that runs on startup — this ensures Mongoose registers it before the audit trail plugin scans for models.

### 9.4 Adding a New Page

**1. Create the Page Component:**

```jsx
// frontend/src/pages/recruitment/JobPostingsPage.jsx
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFooter } from "../../context/FooterContext.jsx";
import DataTable from "../../components/common/DataTable.jsx";
import { apiFetch } from "../../services/api.js";

const COLUMNS = [
  { key: "title", label: "Job Title", width: "30%", align: "left", sortable: true, filterable: true },
  { key: "location", label: "Location", width: "20%", align: "left", sortable: true },
  // ... more columns
];

export default function JobPostingsPage() {
  const { setFooterContent } = useFooter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/job-postings");
      setRows(res?.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  DataTable.useRecordCount(rows, setFooterContent);

  return (
    <div className="erp-page">
      <DataTable
        columns={COLUMNS}
        rows={rows}
        loading={loading}
        searchPlaceholder="Search jobs..."
        onNew={() => {/* open create modal */}}
      />
    </div>
  );
}
```

**2. Add Route in `App.jsx`:**

```jsx
import JobPostingsPage from "./pages/recruitment/JobPostingsPage.jsx";

<Route path="recruitment/job-postings" element={
  <PermissionGuard menuCode="job_postings">
    <JobPostingsPage />
  </PermissionGuard>
} />
```

### 9.5 Registering a CSV Import Profile

Add a new profile in `csvImport.service.js`:

```javascript
registerProfile("job_postings", {
  modelName: "JobPosting",
  label: "Job Postings",
  columns: [
    { csv: "Title",       field: "title",       required: true },
    { csv: "Location",    field: "location",    required: true },
    { csv: "Salary Min",  field: "salaryMin",   type: "number" },
    { csv: "Salary Max",  field: "salaryMax",   type: "number" },
    { csv: "Status",      field: "status",      enum: ["Active", "Closed"], default: "Active" },
  ],
  transform: async (row) => {
    // Optional: custom transformations before insert
    return row;
  },
});
```

The profile will automatically appear in `Settings > Data Management > Bulk CSV Import`.

### 9.6 Sending Emails from Your App

```javascript
import { sendEmail } from "../services/email.service.js";

// In your controller or service:
await sendEmail({
  companyId: req.user.company,
  to: candidate.email,
  subject: "Your Application Status — {{jobTitle}}",
  html: `
    <h2>Hello {{candidateName}},</h2>
    <p>Your application for <strong>{{jobTitle}}</strong> has been {{status}}.</p>
    <p>Best regards,<br>{{companyName}}</p>
  `,
  variables: {
    candidateName: candidate.name,
    jobTitle: "Senior Developer",
    status: "shortlisted",
    companyName: "Acme Corp",
  },
});
```

### 9.7 Using the File Upload Service

**From Frontend:**

```jsx
import FileUploader from "../../components/common/FileUploader.jsx";

<FileUploader
  category="document"           // profile_photo | document | certificate | spreadsheet | general
  onUploadComplete={(file) => {
    console.log("File URL:", file.url);
    console.log("File ID:", file._id);
  }}
  multiple={false}
/>
```

**From Backend:**

```javascript
import { uploadFile } from "../services/fileUpload.service.js";

const result = await uploadFile({
  file: req.file,               // From multer
  category: "document",
  company: req.user.company,
  uploadedBy: req.user.sub,
  relatedModel: "JobPosting",
  relatedId: jobPostingId,
});
```

### 9.8 Creating Notifications

```javascript
import { Notification } from "../models/Notification.model.js";

// Single notification
await Notification.create({
  company: companyId,
  recipient: userId,
  title: "Interview Scheduled",
  body: "Your interview for Software Developer is on Monday at 10 AM.",
  type: "info",
  category: "recruitment",
  link: "/app/my-applications",
});

// Broadcast to all users via API
POST /api/notifications/broadcast
{
  "title": "Holiday Notice",
  "body": "Office will be closed on Friday.",
  "type": "system"
}
```

---

## 10. Database Collections Reference

| Collection     | Indexes                                              | Notes                      |
|----------------|------------------------------------------------------|----------------------------|
| `Company`      | `companyCode` (unique), `registrationNo` (sparse)    | Usually single document    |
| `User`         | `userCode`, `userName`, `userEmail`                  | No unique index on userName |
| `Role`         | `company+roleCode` (unique), `company+roleName` (unique) |                        |
| `MenuItem`     | `company+code` (unique), `company+parentCode+menuType+sequence` | menuType enum includes `card_group` |
| `MenuIcon`     | `company+key` (unique)                               |                            |
| `Location`     | `company+locationCode` (unique)                      |                            |
| `SubLocation`  | (inherits from schema)                               |                            |
| `MasterData`   | `company+category+label` (unique), `company+category+sequence` |                |
| `Notification` | `company+recipient+isRead+createdAt`, `company+recipient+createdAt` |            |
| `EmailConfig`  | `company` (unique)                                   | One config per company     |
| `AuditLog`     | `createdAt`, `company+createdAt`, `modelName+action` |                            |
| `FileUpload`   | (inherits from schema)                               |                            |
| `Rfq`          | `company+location+rfqNo` (unique per scope)          | RFQ transactions           |
| `SourceListMaster` | `company+...`                                    | Preferred vendor–material  |
| `PurchaseOrder`| location-scoped PO documents                         |                            |
| `PurchaseIndent` | location-scoped PR documents                       | Menu label: Purchase Requisition |
| `VendorEvaluationMaster` | criteria templates                           | Hidden from Masters hub    |

> Procurement collections follow the same service → controller → route pattern documented in [PURCHASE_ORDER_TRANSACTION_IMPLEMENTATION.md](./PURCHASE_ORDER_TRANSACTION_IMPLEMENTATION.md) and [RFQ_IMPLEMENTATION.md](./RFQ_IMPLEMENTATION.md).

---

## 11. Environment Variables

### Backend (`backend/.env`)

| Variable         | Required | Default       | Description                                |
|------------------|----------|---------------|--------------------------------------------|
| `PORT`           | No       | `5020`        | Server port                                |
| `MONGO_URI`      | **Yes**  | —             | MongoDB connection string                  |
| `JWT_SECRET`     | **Yes**  | —             | Secret for signing JWT tokens              |
| `JWT_EXPIRES_IN` | No       | `7d`          | Token expiry (e.g., `1h`, `7d`, `30d`)     |
| `CORS_ORIGIN`    | No       | `*`           | Allowed origins (comma-separated)          |
| `PUBLIC_APP_URL` | No       | —             | Public site URL for CORS (e.g. `https://pms.idms-atp.com`) |
| `TRUST_PROXY`    | No       | `0`           | Set `1` behind Nginx reverse proxy         |
| `SERVE_FRONTEND` | No       | `0`           | Set `1` to serve `frontend/dist` from Node (dev/single-process only) |
| `NODE_ENV`       | No       | `development` | `development`, `staging`, `production`     |

Templates: `backend/.env.example`, `backend/.env.production.example`

### Frontend (`frontend/.env.production`)

| Variable              | Production value | Description |
|-----------------------|------------------|-------------|
| `VITE_API_BASE_URL`   | *(empty)*        | Same-origin `/api` when Nginx proxies |
| `VITE_APP_PUBLIC_URL` | `https://pms.idms-atp.com` | Public app URL for links |
| `VITE_APP_NAME`       | PMS branding     | Application title |

Template: `frontend/.env.production.example`

---

## 12. Scripts Reference

Run from the `backend/` directory:

| Script                           | Command                          | Purpose                                       |
|----------------------------------|----------------------------------|-----------------------------------------------|
| `seed:erp-sidebar`               | `npm run seed:erp-sidebar`       | Sync full menu catalog (~222 items)           |
| `seed:rfq-setup`                 | `npm run seed:rfq-setup`         | RFQ doc counters, auto-increment, menus, RBAC |
| `seed:rfq-auto-increment`        | `npm run seed:rfq-auto-increment`| Company RFQ module numbering only             |
| `seed:rfq-module-access`         | `npm run seed:rfq-module-access` | Grant RFQ permissions to roles                |
| `seed:mpbcdc-logo`               | `npm run seed:mpbcdc-logo`       | MPBCDC application logo for login/print       |
| `seed:location-doc-auto-increment`| `npm run seed:location-doc-auto-increment` | Per-location document counters      |
| `seed:framework`                 | `npm run seed:framework`         | Full seed: company, admin, roles, all menus   |
| `migrate:generic-menus`          | `npm run migrate:generic-menus`  | Migrate menu items to generic catalog         |
| `cleanup:accounts`               | `npm run cleanup:accounts`       | Remove legacy accounts-specific modules       |
| Individual menu seeds            | `node scripts/add-*.js`          | Add specific menu items                       |
| `drop-legacy-collections.js`     | `node scripts/drop-legacy-collections.js` | Remove non-framework collections     |
| `group-settings-cards.js`        | `node scripts/group-settings-cards.js`   | Group settings cards into categories  |

---

## 13. Conventions & Best Practices

### Code Style
- **ES Modules** (`import`/`export`) throughout — both backend and frontend
- **Async/Await** for all asynchronous operations
- **`asyncHandler`** wrapper for all controller functions (auto-catches errors)
- **Service Layer** — controllers call services, services call models
- **No inline secrets** — all configuration via `.env`

### Naming Conventions
| What            | Convention                     | Example                        |
|-----------------|--------------------------------|--------------------------------|
| Models          | PascalCase, singular           | `User`, `JobPosting`           |
| Collections     | PascalCase, singular           | `User`, `JobPosting`           |
| Routes          | kebab-case                     | `/job-postings`, `/master-data`|
| Menu Codes      | snake_case                     | `job_postings`, `master_data`  |
| Components      | PascalCase                     | `DataTable`, `FileUploader`    |
| CSS Classes     | kebab-case with prefix         | `im-table`, `erp-back-btn`    |
| Hooks           | camelCase with `use` prefix    | `useToast`, `usePermissions`   |

### API Response Format
All API responses follow this structure:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": { }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

### Adding New Framework Collections
When adding new collections that are part of the framework (not app-specific), add them to the `FRAMEWORK_COLLECTIONS` set in `scripts/drop-legacy-collections.js` to protect them from cleanup.

### File Organisation Rules
1. One model per file in `models/`
2. One route file per resource in `routes/` — register in `routes/index.js`
3. Business logic in `services/`, HTTP handling in `controllers/`
4. Frontend pages in `pages/`, reusable UI in `components/`
5. All API calls centralised in `services/api.js`

---

## 14. Production Deployment

Full step-by-step guide: **[deploy/DEPLOY.md](../deploy/DEPLOY.md)**

### Target environment

| Item | Value |
|------|-------|
| URL | https://pms.idms-atp.com |
| Host | DigitalOcean droplet |
| Web server | Nginx (SSL termination, static UI) |
| Process manager | PM2 (`deploy/ecosystem.config.cjs`) |
| API port | 5020 (not exposed publicly) |

### Build & deploy summary

```bash
# On server — backend
cd backend
cp .env.production.example .env   # edit secrets
npm install --production
npm run seed:erp-sidebar          # if menus outdated
npm run seed:rfq-setup            # RFQ numbering + permissions

# Frontend
cd ../frontend
cp .env.production.example .env.production
npm install
npm run build                     # outputs frontend/dist

# PM2
pm2 start deploy/ecosystem.config.cjs
pm2 save
```

Nginx config template: `deploy/nginx-pms.idms-atp.com.conf`

### Key backend flags (production)

- `TRUST_PROXY=1` — correct client IP and secure cookies behind Nginx  
- `SERVE_FRONTEND=0` — Nginx serves UI; Node serves API only  
- `CORS_ORIGIN` or `PUBLIC_APP_URL=https://pms.idms-atp.com`

---

## 15. Procurement Modules Reference

### RFQ API

Mounted at `/api/purchase/rfqs` — see [RFQ_IMPLEMENTATION.md](./RFQ_IMPLEMENTATION.md).

| Method | Path | Action |
|--------|------|--------|
| GET | `/preview-number` | Next RFQ number |
| GET/POST | `/` | List / create |
| GET/PUT/DELETE | `/:id` | Read / update / delete (draft) |
| POST | `/:id/submit`, `/open`, `/close`, `/award`, `/cancel`, `/expire` | Workflow |

**Menu codes:** `purchase_rfq_management`, `reports_purchase_rfq_register`

### Shared frontend components (procurement)

| Component | Path | Use |
|-----------|------|-----|
| `DocumentStatusBadge` | `components/common/DocumentStatusBadge.jsx` | PO, PR, RFQ, GRN status |
| `AuditInformationSection` | `components/common/AuditInformationSection.jsx` | Created/updated by blocks |
| `DocumentOrganizationLogo` | `components/print/DocumentOrganizationLogo.jsx` | Print header logo |
| `RfqDocumentsSection` | `components/purchase/RfqDocumentsSection.jsx` | RFQ attachments |

**Status helpers:** `frontend/src/utils/documentStatus.js` (includes `awarded`, `expired`)

### Register reports (live)

| Report | Page | Data source |
|--------|------|-------------|
| PO Register | `PurchaseOrderReportPage.jsx` | `GET /api/purchase/reports/purchase-orders` |
| PR Register | `PurchaseIndentReportPage.jsx` | `GET /api/purchase/purchase-indents` (filtered list) |
| GRN Register | `GoodsReceiptReportPage.jsx` | `GET /api/purchase/goods-receipts` (filtered list) |
| RFQ Register | `RfqReportPage.jsx` | `GET /api/purchase/rfqs` (filtered list) |
| Item-wise PO | `ItemWisePoReportPage.jsx` | `GET /api/purchase/reports/item-wise-po` |
| SPO Register | `ServicePurchaseOrderReportPage.jsx` | `GET /api/purchase/reports/service-purchase-orders` |

### Source List & Vendor Evaluation

| Module | Backend | Frontend |
|--------|---------|----------|
| Source List master | `SourceListMaster.model.js`, `/api/masters/source-list` | `SourceListMasterPage.jsx` |
| Vendor Evaluation master | `VendorEvaluationMaster.model.js` | `VendorEvaluationMasterPage.jsx` |
| Vendor Evaluation showcase | `vendorEvaluationShowcase.routes.js` | `pages/purchase/vendorEvaluation/*` |

---

*This document is maintained alongside the codebase. When adding new framework features, update the relevant sections.*
