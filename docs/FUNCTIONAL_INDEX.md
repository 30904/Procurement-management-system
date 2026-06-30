# Procurement Management System — Functional Documentation Index

> **Version:** 1.1.0  
> **Last Updated:** June 2026  
> **Audience:** Business users, functional consultants, QA, and implementers  
> **Developer reference:** See [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md) for architecture and code conventions.

---

## About This Documentation Set

This documentation explains **what the Procurement Management System (PMS) does** from a user and business perspective — modules, menus, hub cards, settings, access rules, and feature availability.

It complements the existing technical guides:

| Document | Focus |
|----------|--------|
| [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md) | Architecture, APIs, development patterns, production deployment |
| [../deploy/DEPLOY.md](../deploy/DEPLOY.md) | DigitalOcean deployment — https://pms.idms-atp.com |
| [MULTI_LOCATION_IMPLEMENTATION_AND_IMPACT.md](./MULTI_LOCATION_IMPLEMENTATION_AND_IMPACT.md) | Location scoping, inventory stores |
| [PURCHASE_ORDER_TRANSACTION_IMPLEMENTATION.md](./PURCHASE_ORDER_TRANSACTION_IMPLEMENTATION.md) | PO transaction blueprint |
| [RFQ_IMPLEMENTATION.md](./RFQ_IMPLEMENTATION.md) | RFQ module — API, routes, status flow |
| [MPBCDC_TERMINOLOGY_MAPPING.md](./MPBCDC_TERMINOLOGY_MAPPING.md) | Government procurement UI labels (MPBCDC) |
| [MASTERS_MODULE_IMPLEMENTATION.md](./MASTERS_MODULE_IMPLEMENTATION.md) | Master data screen patterns |
| [JOB_WORK_ORDER_IMPLEMENTATION.md](./JOB_WORK_ORDER_IMPLEMENTATION.md) | Job Work Order implementation |

---

## Functional Documents

| # | Document | Contents |
|---|----------|----------|
| 1 | [FUNCTIONAL_OVERVIEW.md](./FUNCTIONAL_OVERVIEW.md) | Application purpose, branding, login, app shell, dashboard, profile, notifications |
| 2 | [FUNCTIONAL_NAVIGATION_AND_ACCESS.md](./FUNCTIONAL_NAVIGATION_AND_ACCESS.md) | Sidebar, hub cards, card groups, RBAC, roles, permission flags |
| 3 | [FUNCTIONAL_SETTINGS.md](./FUNCTIONAL_SETTINGS.md) | Settings hub — Company Setup, Application Setup, Roles & Access, Data Management, Communication, System |
| 4 | [FUNCTIONAL_PURCHASE.md](./FUNCTIONAL_PURCHASE.md) | Purchase — requisitions, planning, **RFQ**, PO, SPO, JWO, vendor evaluation |
| 5 | [FUNCTIONAL_STORES.md](./FUNCTIONAL_STORES.md) | Stores module — GRN, goods transfer, inward, reconciliation |
| 6 | [FUNCTIONAL_QUALITY.md](./FUNCTIONAL_QUALITY.md) | Quality module — inspection hub cards, quality masters |
| 7 | [FUNCTIONAL_MASTERS.md](./FUNCTIONAL_MASTERS.md) | Masters hub — Purchase, Inventory, Quality reference data |
| 8 | [FUNCTIONAL_REPORTS.md](./FUNCTIONAL_REPORTS.md) | Reports hub — PO, PR, GRN, RFQ registers |

---

## Application at a Glance

**Procurement Management System (PMS)** is an enterprise web application for **procure-to-pay** and **stores & quality** operations in manufacturing and trading organisations.

| Attribute | Value |
|-----------|-------|
| **Full name** | Procurement Management System |
| **Short name** | PMS |
| **Tagline** | Purchase · Stores · Quality |
| **Developer** | Celeris Venture Systems Pvt. Ltd. |
| **Production URL** | https://pms.idms-atp.com |
| **API port (server)** | 5020 (behind Nginx reverse proxy in production) |
| **Primary modules** | Purchase, Stores, Quality |
| **Supporting areas** | Masters, Reports, Settings (Configuration) |

### Business Scope

PMS supports the end-to-end procurement lifecycle:

```
Demand → Planning → RFQ → Quotation (planned) → Purchase Order → Goods Receipt → Quality → Stores → Invoice → Reports
```

The application is built on a **database-driven navigation framework**: sidebar items, landing hub tiles, and card groups are stored in MongoDB and can be customised by Super Admin through Menu Setup (without code changes).

---

## Navigation Map (High Level)

```
Login
└── App Shell (/app)
    ├── Dashboard
    ├── Purchase          → Hub cards → Sub-hubs → Transaction screens
    ├── Stores            → Hub cards → Transaction screens
    ├── Quality           → Hub cards → Transaction screens
    ├── Reports           → Purchase | Stores | Quality → Report screens
    ├── Masters           → Purchase | Stores | Quality → Master screens
    ├── Settings          → 6 configuration groups → Setup screens
    ├── Notifications
    └── Profile
```

**URL pattern:** All authenticated routes live under `/app/{segment}`. Settings uses the segment `configuration` (sidebar label: **Settings**).

Example: Purchase Indent → `/app/purchase/purchase-indent`

---

## Implementation Status Legend

Throughout these documents, features are tagged:

| Status | Meaning |
|--------|---------|
| **Live** | Fully implemented UI + backend API |
| **Partial** | Some screens or flows implemented; others placeholder |
| **Placeholder** | Menu card exists; screen shows "coming soon" module placeholder |
| **Super Admin only** | Hidden from normal users; visible to Super Admin (and optionally unhidden via Menu Setup) |
| **Admin only** | Visible only to users with Admin or Super Admin role |

---

## Recommended Setup Sequence (New Deployment)

For a new company instance, configure in this order:

1. **Company Setup** — Company profile, locations, sub-locations, inventory stores  
2. **Roles & Access** — Create roles, assign users, set permissions  
3. **Data Management** — Auto increment, master data, PO types, terms, item attributes  
4. **Masters** — HSN/SAC, suppliers, items, payment terms, quality specs  
5. **Purchase transactions** — Requisitions → Planning → RFQ → PO → GRN → Reports  
6. **Production deploy** — See [deploy/DEPLOY.md](../deploy/DEPLOY.md) for https://pms.idms-atp.com  

See [FUNCTIONAL_SETTINGS.md](./FUNCTIONAL_SETTINGS.md) for detailed setup descriptions.

---

## Quick Reference — Sidebar

| Sidebar Item | Route | Type |
|--------------|-------|------|
| Dashboard | `/app/dashboard` | Main |
| Purchase | `/app/purchase` | Main |
| Stores | `/app/stores` | Main |
| Quality | `/app/quality` | Main |
| Reports | `/app/reports` | Main |
| Masters | `/app/masters` | Bottom |
| Settings | `/app/configuration` | Bottom (Admin/Super Admin) |
| Support | — | Bottom (essential; no route) |
