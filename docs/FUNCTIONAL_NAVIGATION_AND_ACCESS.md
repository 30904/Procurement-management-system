# Navigation, Hub Cards & Access Control

> Part of the [Functional Documentation Index](./FUNCTIONAL_INDEX.md)

---

## 1. How Navigation Works

PMS uses a **three-level navigation model**:

```
Level 1 — Sidebar item          (e.g. Purchase)
Level 2 — Hub landing page      (grid of tiles/cards)
Level 3 — Sub-hub or screen     (transaction list, form, or nested hub)
```

### Menu Types (Database)

| `menuType` | Purpose | Example |
|------------|---------|---------|
| `sidebar_main` | Primary sidebar entries | Purchase, Stores, Quality |
| `sidebar_bottom` | Footer sidebar entries | Masters, Settings |
| `landing_card` | Clickable tile on a hub page | Generate PO, Supplier Master |
| `card_group` | Grouping tile that opens a sub-hub | Company Setup, Data Management |
| `flyout_item` | Flyout under Applications (unused in PMS) | — |

### URL Convention

| Sidebar label | Segment in URL | Example |
|---------------|----------------|---------|
| Settings | `configuration` | `/app/configuration/company` |
| Purchase | `purchase` | `/app/purchase/purchase-order/generate-po` |
| Masters | `masters` | `/app/masters/purchase/supplier` |

All routes are prefixed with `/app/` after login.

---

## 2. Complete Sidebar Structure

### Main Sidebar (Top Section)

| # | Label | Menu Code | Route | Essential |
|---|-------|-----------|-------|-----------|
| 1 | Dashboard | `dashboard` | `/app/dashboard` | Yes — always visible |
| 2 | Purchase | `purchase` | `/app/purchase` | Permission-based |
| 3 | Stores | `stores` | `/app/stores` | Permission-based |
| 4 | Quality | `quality` | `/app/quality` | Permission-based |
| 5 | Reports | `reports` | `/app/reports` | Permission-based |
| 6 | Finance | `finance` | `/app/finance` | Placeholder hub |

### Bottom Sidebar

| # | Label | Menu Code | Route | Notes |
|---|-------|-----------|-------|-------|
| 1 | Applications | `applications` | — | Hidden; HR/Accounts removed |
| 2 | Masters | `masters` | `/app/masters` | Reference data hub |
| 3 | Settings | `settings` | `/app/configuration` | **Admin / Super Admin only** |
| 4 | Support | `support` | — | Essential; no route |

---

## 3. Hub Landing Pages

When a sidebar item has child cards, clicking it opens a **hub landing page** — a responsive grid of tiles.

Each tile shows:
- Icon (from menu icon library or default hub icon)  
- Label and short description  
- Click action → navigate to sub-hub or transaction screen  

### Masters Hub (`/app/masters`)

| Card | Menu Code | Route |
|------|-----------|-------|
| Purchase | `masters_purchase` | `/app/masters/purchase` |
| Inventory Masters | `masters_stores` | `/app/masters/stores` |
| Quality | `masters_quality` | `/app/masters/quality` |

### Reports Hub (`/app/reports`)

| Card | Menu Code | Route |
|------|-----------|-------|
| Purchase | `reports_purchase` | `/app/reports/purchase` |
| Stores | `reports_stores` | `/app/reports/stores` |
| Quality | `reports_quality` | `/app/reports/quality` |
| Finance | `reports_finance` | `/app/reports/finance-reports` |

> **Note:** Purchase reports have **20** registered report cards (6 live: PO, PR, RFQ, GRN, Item-wise PO, SPO registers). Stores and Quality report sub-cards are planned.

---

## 4. Access Control Model

### Role Hierarchy

| Role | Access Level |
|------|--------------|
| **Super Admin** | Unrestricted access to all menus; bypasses permission matrix; can see Super Admin hidden tiles |
| **Admin** | Settings hub, Data Management, Roles & Access; cannot access Super Admin-only hidden menus by default |
| **Custom roles** | Permissions assigned per menu code via Permission Management |

### Permission Flags

Each menu item can grant these actions per role:

| Flag | User can… |
|------|-----------|
| `view` | Open the screen |
| `create` | Add new records |
| `edit` | Modify existing records |
| `delete` | Remove records |
| `approve` | Approve workflow documents |
| `cancel` | Cancel documents |
| `download` | Export / download data |
| `reportGenerated` | Run and generate reports |
| `acknowledgment` | Acknowledge items |

### Special Menu Flags

| Flag | Effect |
|------|--------|
| `isEssential: true` | Always enabled (Dashboard, Support) |
| `requiresAdmin: true` | Only Admin and Super Admin roles |
| `requiresSuperAdmin: true` + `isHidden: true` | Hidden from normal navigation; Super Admin can expose via Menu Setup |
| `isHidden: true` (without admin) | Not shown in sidebar/cards until unhidden |

### Admin-Only Menu Codes

These require **Admin** or **Super Admin** role:

| Menu Code | Label |
|-----------|-------|
| `settings` | Settings sidebar icon |
| `data_mgmt_group` | Data Management group |
| `auto_increment` | Auto Increment |
| `master_data` | Master Data |
| `po_type` | PO Type |
| `incidental_expenses` | Incidental Expenses |
| `po_terms_and_conditions` | PO Terms & Conditions |
| `quotation_terms_and_conditions` | Quotation Terms & Conditions |
| `item_document_types` | Item Document Types |
| `item_attributes` | Item Attributes |
| `bulk_import` | Bulk CSV Import |

### Roles & Access Hub

Accessible when:
- User is **Super Admin**, OR  
- User has **Admin** role, OR  
- User's role has `roles_access` permission enabled  

---

## 5. Permission Flow (Runtime)

```
User logs in
    ↓
Server returns session: navigation tree + permissionsByCode + isSuperAdmin
    ↓
Sidebar renders only menus where checkPermission(code).enabled = true
    ↓
User clicks a route → PermissionGuard validates menuCode
    ↓
If denied → redirect or access blocked
```

### Settings Footer Icon

The **Settings** icon in the sidebar footer is shown only to **Admin** and **Super Admin** users. Standard users do not see it.

---

## 6. Card Visibility Rules

### Normal Tiles
All users with `view` permission see the tile and can click it.

### Admin-Only Tiles (Data Management)
Visible as **normal tiles** (not greyed "hidden" style) to Admin and Super Admin only. Other users never see these cards.

### Super Admin Hidden Tiles
Marked `requiresSuperAdmin: true, isHidden: true` in the menu catalog. Examples:
- Application Setup children (Menu Setup, Modules Setup, etc.)  
- Email Configuration, File Manager  
- Audit Logs, Active Users  
- Several advanced Stores, Quality, and Masters tiles  

Super Admin can **unhide** these via **Menu Setup** to make them visible to other roles.

---

## 7. Default Role Permission Templates

When roles are seeded from the menu catalog:

| Role Template | Permissions |
|---------------|-------------|
| **Super Admin** | All actions on all menus |
| **Admin** | view, edit, create, download, reports on most menus; **no** Super Admin hidden menus |
| **Standard user** | view-only on assigned menus; **no** admin-only menus; **no** Settings hub |

Actual permissions are customised per deployment through **Permission Management**.

---

## 8. Multi-Location & Row-Level Scope

Most transactional data is scoped to:
- **Company** (tenant)  
- **Active location** (header switcher)  

Users only see documents for their active location unless the screen explicitly supports cross-location views (e.g. some reports).

Location setup: [FUNCTIONAL_SETTINGS.md](./FUNCTIONAL_SETTINGS.md) → Company Setup.

---

## 9. Dynamic Menu Customisation (Super Admin)

Super Admin can modify navigation without code deployment:

| Screen | Capability |
|--------|------------|
| **Menu Setup** | Add, reorder, hide sidebar items and cards |
| **Modules Setup** | Configure landing page module tiles |
| **Groups Setup** | Create card groups under any sidebar menu |
| **Menu Icons** | Upload custom SVG icons |

After catalog changes in code, run:
```bash
cd backend
node scripts/seed-erp-sidebar.js
```

---

## 10. Legacy Route Redirects

Old framework paths (e.g. `/app/menu-4`) redirect to procurement modules via `genericMenus.js`:

| Legacy | Redirects to |
|--------|--------------|
| menu-4 | purchase |
| expense | stores |

This ensures bookmarks from earlier deployments still work.

---

## Related Documents

- [Settings](./FUNCTIONAL_SETTINGS.md) — All configuration screens  
- [Purchase](./FUNCTIONAL_PURCHASE.md) — Purchase hub card tree  
- [Technical Guide — RBAC](./TECHNICAL_GUIDE.md) — Developer permission implementation  
