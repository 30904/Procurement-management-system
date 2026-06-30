# Functional Overview — Procurement Management System

> Part of the [Functional Documentation Index](./FUNCTIONAL_INDEX.md)

---

## 1. What Is PMS?

The **Procurement Management System (PMS)** is a browser-based enterprise application that helps organisations manage:

- **Purchase** — Requisitions, procurement planning, RFQ, purchase orders (goods and services), job work, vendor evaluation, goods receipt shortcuts, and reports  
- **Stores (Inventory)** — Goods receipt (GRN), goods issue, material transfer, inventory adjustment, gate pass, physical verification  
- **Quality** — Inspection hub cards (plan, schedule, incoming inspection) and quality master data  

PMS is developed by **Celeris Venture Systems Pvt. Ltd.** and runs as a responsive web application suitable for desktop and mobile browsers.

### Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Hub-and-spoke navigation** | Each main module opens a landing page of tiles (cards). Cards drill down to sub-hubs or transaction screens. |
| **Role-based access** | Every menu item and card can be permission-controlled per role. |
| **Multi-location** | Documents and stock can be scoped to business locations; users switch active location from the header. |
| **Configurable without code** | Super Admin can adjust menus, icons, branding, and master data through Settings screens. |
| **Audit trail** | Create, update, and delete operations on key records are logged for compliance. |

---

## 2. Branding & Identity

Default application branding (configurable under **Settings → Application Setup**):

| Field | Default |
|-------|---------|
| Application name | Procurement Management System |
| Short name | PMS |
| Tagline | Purchase · Stores · Quality |
| Production URL | https://pms.idms-atp.com |
| Developer | Celeris Venture Systems Pvt. Ltd. |
| Version | 1.1.0 |

The login page displays:
- Organisation logo (MPBCDC branding when seeded via `npm run seed:mpbcdc-logo`) + application name  
- **Welcome Back** heading  
- Username and password fields  
- Developer copyright in footer  

SSO (Single Sign-On) is **disabled** in the current build; the login form is the primary authentication method.

---

## 3. Authentication

### Login

| Field | Description |
|-------|-------------|
| **Username** | User ID configured in User Management |
| **Password** | Hashed credentials stored securely on server |
| **Remember me** | Optional session persistence |

After successful login, the user is redirected to **Dashboard** (`/app/dashboard`).

### Session

- Authentication uses **JWT (JSON Web Token)** stored in browser local storage.  
- Session data includes user profile, assigned role(s), navigation menu, and permission matrix.  
- Logging out clears the session and returns to the login page.

### Password Management

Users can change their password from **Profile** (`/app/profile`).

---

## 4. Application Shell

After login, users work inside the **App Shell** — a consistent layout with:

| Area | Purpose |
|------|---------|
| **Sidebar (left)** | Primary navigation — Dashboard, Purchase, Stores, Quality, Reports, Masters, Settings |
| **Header (top)** | Location switcher, notifications bell, user menu, profile link |
| **Main content** | Page-specific toolbar (breadcrumb + back button) and workspace |
| **Footer (optional)** | Context actions on list screens (e.g. Add New on User Management) |

### Location Switcher

When multiple business locations exist, users select the **active location** from the header. Most transactional documents (PO, GRN, etc.) are created and filtered for the active location.

Locations are configured under **Settings → Company Setup → Location Master**.

---

## 5. Dashboard

**Route:** `/app/dashboard`

The dashboard shown depends on the user's role mapping:

| Dashboard | Description |
|-----------|-------------|
| **Purchase Dashboard** | Procurement KPIs, charts, quick actions, RFQ metric placeholders (default for most users) |
| **Purchase module dashboard** | Dedicated dashboard at `/app/purchase/purchase-dashboard` |
| **Default Workspace Dashboard** | Generic welcome, setup checklist, navigation grid |

Role-to-dashboard mapping is configured under **Settings → Application Setup → Role Dashboard Mapping** (Super Admin).

### Dashboard Features

- Welcome banner with user name  
- Key statistics (module-specific)  
- Quick navigation to frequently used modules  
- Setup progress indicators for new deployments  

### Document Print Branding

Approved transaction prints (PO, PR, GRN, RFQ, SPO) use:
- **DocumentOrganizationLogo** — company/MPBCDC logo from application branding  
- **Bill To / Ship To** — company legal name on PO print  
- Shared **ProcurementPrintFooter** and audit blocks where applicable  

Configure logo and colours under **Settings → Application Setup**.

---

## 6. Notifications

**Route:** `/app/notifications`  
**Header:** Notification bell with unread count

| Capability | Description |
|------------|-------------|
| In-app alerts | Status changes, system messages, admin broadcasts |
| Read / unread | Mark individual or all notifications as read |
| Categories | info, success, warning, error, system |
| Deep links | Notifications can link directly to relevant screens |

Administrators can broadcast messages to all users via the backend notification API.

---

## 7. Profile

**Route:** `/app/profile`

Users can view and update:

- Display name and contact details  
- Profile photo (if configured)  
- **Change password**  
- Account preferences  

Profile editing respects the same validation rules enforced on the server.

---

## 8. Support

The **Support** item appears in the sidebar footer. It is marked as an **essential menu** (always visible regardless of permissions) but does not navigate to a dedicated route in the current build — it serves as a placeholder for future help-desk or documentation integration.

---

## 9. User Types & Roles (Summary)

| Role | Typical Use |
|------|-------------|
| **Super Admin** | Full system access; can see hidden Super Admin menus; bypasses all permission checks |
| **Admin** | Company administrator; access to Settings, Data Management, Roles & Access |
| **Standard roles** | Custom roles (e.g. Purchase Officer, Store Keeper, QC Inspector) with granular permissions per menu |

Detailed access rules are documented in [FUNCTIONAL_NAVIGATION_AND_ACCESS.md](./FUNCTIONAL_NAVIGATION_AND_ACCESS.md).

---

## 10. Typical User Journeys

### Purchase Officer

1. Login → Dashboard  
2. **Masters** → Maintain vendors, materials, and source list  
3. **Purchase** → Create Purchase Requisition → Approve  
4. **Purchase** → Procurement Planning → RFQ → (future: Quotation) → Generate PO  
5. **Purchase** → Approve PO → Print PO copy  
6. **Reports** → PO / PR / RFQ / GRN registers  

### Store Keeper

1. Login → Select location  
2. **Stores** → GRN → Receive goods against PO  
3. **Stores** → Goods Transfer → Move stock between stores  
4. **Reports** → Inventory reports (when implemented)  

### Quality Inspector

1. Login  
2. **Quality** → MRN / PDIR Entry (when implemented)  
3. **Masters → Quality** → Item QCL, Inspection Checklist, RM Specifications  

### System Administrator

1. **Settings → Company Setup** → Company, locations, stores  
2. **Settings → Roles & Access** → Users, roles, permissions  
3. **Settings → Data Management** → Auto increment, PO types, terms  
4. **Masters** → Seed reference data  
5. **Settings → System** → Audit logs, active users (Super Admin)  

---

## 11. Related Documents

- [Navigation & Access](./FUNCTIONAL_NAVIGATION_AND_ACCESS.md) — Full menu tree and permissions  
- [Settings](./FUNCTIONAL_SETTINGS.md) — Configuration hub details  
- [Purchase](./FUNCTIONAL_PURCHASE.md) — Procure-to-pay transactions  
- [Technical Guide — Production deployment](./TECHNICAL_GUIDE.md#14-production-deployment)  
- [Deploy guide](../deploy/DEPLOY.md)  
