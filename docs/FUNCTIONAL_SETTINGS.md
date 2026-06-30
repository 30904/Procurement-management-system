# Settings & Configuration — Functional Guide

> Part of the [Functional Documentation Index](./FUNCTIONAL_INDEX.md)  
> **Route prefix:** `/app/configuration`  
> **Sidebar label:** Settings  
> **Access:** Admin and Super Admin (Settings icon in sidebar footer)

---

## 1. Settings Hub Overview

The Settings landing page (`/app/configuration`) displays **six configuration groups** as hub tiles:

```
Settings (/app/configuration)
├── 1. Company Setup
├── 2. Application Setup
├── 3. Roles & Access
├── 4. Data Management          [Admin only]
├── 5. Communication
└── 6. System
```

Each group opens a sub-hub with individual setup screens.

---

## 2. Company Setup

**Group route:** `/app/configuration/company-setup`  
**Access:** Users with permission on respective child menu codes (typically Admin)

| # | Screen | Menu Code | Route | Purpose |
|---|--------|-----------|-------|---------|
| 1 | **Company** | `company_setup` | `/app/configuration/company` | Company legal profile, GST, MSME, address, contacts |
| 2 | **Location Master** | `location_master` | `/app/configuration/location-master` | Business locations with GSTIN, address, contacts |
| 3 | **Sub Location Master** | `sub_locations` | `/app/configuration/sub-locations` | Sub-locations under parent locations |
| 4 | **Inventory Stores** | `inventory_stores` | `/app/configuration/inventory-stores` | Stock-holding stores linked to locations |

### 2.1 Company Profile

**What you configure:**
- Company name, constitution, industry type  
- PAN, TAN, GST classification, MSME registration  
- Registered address and contact persons  
- Nature of business, status  

**When to use:** First step after deployment; required before transactional modules.

### 2.2 Location Master

**What you configure:**
- Location code and name  
- GSTIN (for tax compliance)  
- Full address, city, state, pin code  
- Geo coordinates (optional)  
- Multiple contact persons  
- Active / Inactive status  

**Actions:** List, Create (`/new`), Edit (`/:id/edit`)

**Business impact:** Active location in header determines which PO, GRN, and stock documents are created.

### 2.3 Sub Location Master

**What you configure:**
- Sub-location code under a parent location  
- Address and status  

**Use case:** Warehouse zones, production bays, or logical subdivisions within a location.

### 2.4 Inventory Stores

**What you configure:**
- Store code and name  
- Linked location  
- Store type and status  

**Actions:** List, Create, Edit  

**Business impact:** GRN posting and stock transfers reference inventory stores for stock balance tracking.

---

## 3. Application Setup

**Group route:** `/app/configuration/app-setup`  
**Access:** Super Admin (tiles hidden by default; can be unhidden via Menu Setup)

| # | Screen | Menu Code | Route | Purpose |
|---|--------|-----------|-------|---------|
| 1 | **Application Set-up** | `application_setup` | `/app/configuration/application-setup` | App name, version, tagline, theme colours, logos |
| 2 | **Menu Setup** | `menu_setup` | `/app/configuration/menu-setup` | Sidebar items, order, visibility |
| 3 | **Modules Setup** | `modules_setup` | `/app/configuration/modules-setup` | Landing page module cards per sidebar menu |
| 4 | **Groups Setup** | `groups_setup` | `/app/configuration/groups-setup` | Card groups under any sidebar menu |
| 5 | **Menu Icons** | `icons_setup` | `/app/configuration/icons-setup` | Upload custom sidebar icons |
| 6 | **Role Dashboard Mapping** | `dashboard_role_mapping` | `/app/configuration/dashboard-role-mapping` | Assign dashboard variant per role |

### 3.1 Application Set-up

**What you configure:**
- Application name, short name, version, tagline  
- Developer name, support email/phone  
- Primary and accent theme colours (applied instantly across UI)  
- Logos: main, sidebar, login, favicon  
- Environment label (development / staging / production)  

**Business impact:** Branding on login page, sidebar, document titles, and print headers.

### 3.2 Menu Setup

**What you configure:**
- All sidebar and hub card entries from the menu catalog  
- Sequence (display order)  
- Hidden / visible state  
- Labels and route segments  

### 3.3 Modules Setup & Groups Setup

**Modules Setup:** Configure the four placeholder module tiles on hub pages (e.g. Dashboard Module 1–4).

**Groups Setup:** Create nested card groups — e.g. add a new configuration group under Purchase or Settings.

### 3.4 Menu Icons

Upload SVG icons that replace default sidebar icons without code changes.

### 3.5 Role Dashboard Mapping

Map each role to a dashboard variant (Purchase Dashboard, Default Workspace, etc.).

---

## 4. Roles & Access

**Group route:** `/app/configuration/roles-access`  
**Access:** Super Admin, Admin role, or users with `roles_access` permission

| # | Screen | Route | Purpose |
|---|--------|-------|---------|
| 1 | **User Management** | `/app/configuration/roles-access/user-management` | Create, edit, deactivate users |
| 2 | **Access Management** | `/app/configuration/roles-access/access-management` | Define roles (Admin, Purchase Officer, etc.) |
| 3 | **Permission Management** | `/app/configuration/roles-access/permission-management` | Permission matrix — menu × action per role |
| 4 | **Module Management** | `/app/configuration/roles-access/module-management/:id` | Per-role module visibility (from role detail) |

### 4.1 User Management

**Capabilities:**
- List all users (excludes Super Admin from list display)  
- Add user — name, username, password, role assignment  
- Edit user details and role  
- Activate / deactivate users  
- Delete users  

**Columns:** Enrollment date, name, role, username, status, actions

### 4.2 Access Management

**Capabilities:**
- Create custom roles with display name and role code  
- Edit role metadata  
- Navigate to Module Management for a role  

### 4.3 Permission Management

**Capabilities:**
- Matrix view: rows = menu items, columns = permission flags  
- Toggle view, create, edit, delete, approve, cancel, download, report, acknowledgment per role  
- Changes take effect on next session refresh  

### 4.4 Module Management

Per-role screen to enable/disable entire module groups for simplified access control.

---

## 5. Data Management

**Group route:** `/app/configuration/data-management`  
**Access:** **Admin and Super Admin only** (normal visible tiles)

| # | Screen | Menu Code | Route | Purpose |
|---|--------|-----------|-------|---------|
| 1 | **Auto Increment** | `auto_increment` | `/app/configuration/auto-increment` | Document numbering prefixes and sequences |
| 2 | **Master Data** | `master_data` | `/app/configuration/master-data` | Generic lookup categories (UOM, departments, etc.) |
| 3 | **PO Type** | `po_type` | `/app/configuration/po-type` | Purchase order types for Generate PO |
| 4 | **Incidental Expenses** | `incidental_expenses` | `/app/configuration/incidental-expenses` | Extra charge types on PO |
| 5 | **PO Terms & Conditions** | `po_terms_and_conditions` | `/app/configuration/po-terms-and-conditions` | Terms appended to supplier PO print |
| 6 | **Quotation Terms & Conditions** | `quotation_terms_and_conditions` | `/app/configuration/quotation-terms-and-conditions` | Terms for quotation print copies |
| 7 | **Item Document Types** | `item_document_types` | `/app/configuration/item-document-types` | Drawing/document types for Item Master |
| 8 | **Item Attributes** | `item_attributes` | `/app/configuration/item-attributes` | Custom attribute definitions for items |
| 9 | **Bulk CSV Import** | `bulk_import` | `/app/configuration/bulk-import` | Mass import into registered models |

### 5.1 Auto Increment

**What you configure:**
- Module code (e.g. PO, PI, GRN, Indent)  
- Prefix pattern (may include location code, financial year)  
- Current sequence number  
- Padding length  

**Business impact:** Every transactional document number (PO-2025-0001) comes from this configuration.

### 5.2 Master Data

**What you configure:**
- **Categories** — e.g. `uom`, `department`, `payment_mode`, `trade`  
- **Entries** — label, value, description, sequence, active/inactive  

**Use case:** Dropdown values across the application without hard-coding.

### 5.3 PO Type

**What you configure:**
- PO type code and label  
- Display sequence on Generate PO screen  
- Active status  

### 5.4 Incidental Expenses

**What you configure:**
- Expense type code and label  
- Default amount or percentage flags  
- Display order on PO incidental charges section  

### 5.5 PO Terms & Conditions

**What you configure:**
- Opening line for supplier PO copy  
- Rich HTML terms body (multi-page print support)  

**Business impact:** Terms are **snapshotted** onto each PO at save time so historical prints remain unchanged if terms are later edited.

### 5.6 Quotation Terms & Conditions

Same pattern as PO terms, for customer quotation documents (when sales/quotation modules are active).

### 5.7 Item Document Types

Define document categories attachable to Item Master records (drawings, certificates, spec sheets).

### 5.8 Item Attributes

Define industry-specific dynamic fields for Item Master (e.g. voltage rating, material grade) with data types and validation.

### 5.9 Bulk CSV Import

**Workflow:**
1. Select import profile (registered model)  
2. Download CSV template  
3. Upload filled CSV  
4. Preview validation errors  
5. Confirm import  

Supported profiles depend on backend registration (suppliers, items, etc.).

---

## 6. Communication

**Group route:** `/app/configuration/communication`  
**Access:** Super Admin (hidden tiles by default)

| # | Screen | Menu Code | Route | Purpose |
|---|--------|-----------|-------|---------|
| 1 | **Email Configuration** | `email_setup` | `/app/configuration/email-setup` | SMTP settings, templates, test email |
| 2 | **File Manager** | `file_manager` | `/app/configuration/file-manager` | Upload, preview, manage stored files |

### 6.1 Email Configuration

**What you configure:**
- SMTP host, port, security (TLS/SSL)  
- Username, password, from name/email  
- Email templates for transactional messages  
- **Test Email** button to verify connectivity  

### 6.2 File Manager

**Capabilities:**
- Browse uploaded files by category  
- Preview images and PDFs  
- Download and delete files  
- View upload metadata (user, date, size)  

---

## 7. System

**Group route:** `/app/configuration/system`  
**Access:** Super Admin (hidden tiles by default)

| # | Screen | Menu Code | Route | Purpose |
|---|--------|-----------|-------|---------|
| 1 | **Audit Logs** | `audit_logs` | `/app/configuration/audit-logs` | System-wide change history |
| 2 | **Active Users** | `active_users` | `/app/configuration/active-users` | Currently logged-in sessions |

### 7.1 Audit Logs

**What you see:**
- Timestamp, user, action (CREATE / UPDATE / DELETE)  
- Collection / model name  
- Document ID and changed fields  
- Filter by date range, user, action type  

**Business impact:** Compliance and troubleshooting — who changed what and when.

### 7.2 Active Users

**What you see:**
- User name, IP address, login time  
- Last activity timestamp  
- Session status  

---

## 8. Recommended Configuration Order

| Step | Screen | Why |
|------|--------|-----|
| 1 | Company | Legal entity for all documents |
| 2 | Location Master | Multi-location scoping |
| 3 | Inventory Stores | GRN and stock posting |
| 4 | Auto Increment | Document numbers before first transaction |
| 5 | Master Data | UOM, departments, etc. |
| 6 | PO Type, Incidental Expenses, PO Terms | Before first PO |
| 7 | Roles & Access | Users and permissions |
| 8 | Masters (Purchase) | Suppliers, items, HSN |
| 9 | Email (optional) | Notifications and alerts |

---

## Related Documents

- [Navigation & Access](./FUNCTIONAL_NAVIGATION_AND_ACCESS.md)  
- [Masters](./FUNCTIONAL_MASTERS.md)  
- [Purchase](./FUNCTIONAL_PURCHASE.md)  
- [Multi-Location Guide](./MULTI_LOCATION_IMPLEMENTATION_AND_IMPACT.md)  
