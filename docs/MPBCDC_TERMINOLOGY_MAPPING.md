# MPBCDC Government Procurement — Terminology Mapping Report

> **Organization:** Mahatma Phule Backward Class Development Corporation (MPBCDC)  
> **Scope:** UI / display labels; new modules add routes/APIs without renaming existing codes  
> **Last Updated:** June 2026

---

## 1. Summary

The Procurement Management System was rebranded for **government procurement terminology** while preserving:

- All **menu codes** (e.g. `purchase_purchase_indent`, `masters_purchase_supplier`)
- All **URL routes** (e.g. `/app/purchase/purchase-indent`, `/app/masters/purchase/supplier`)
- Existing **API field names** in payloads (`supplierCode`, `itemNo`, etc.)
- Backward-compatible **collections** for PR, PO, masters

**Menu catalog synced:** ~222 menu items (`npm run seed:erp-sidebar`)  
**Production URL:** https://pms.idms-atp.com  
**Frontend build:** ✓ Successful (`npm run build`)

---

## 2. Terminology Mapping Applied

### Purchase Module

| Previous Label | New Label | Menu Code (unchanged) |
|----------------|-----------|------------------------|
| Purchase Indent | Purchase Requisition | `purchase_purchase_indent` |
| Approved Indents | Approved Requisitions | `purchase_approved_purchase_indents` |
| Mat. Purchase Plan | Procurement Planning | `purchase_material_purchase_planning` |
| Generate PO | Purchase Orders | `purchase_purchase_order_generate_po` |
| Purchase Order | Purchase Orders | `purchase_purchase_order` |
| PO Domestic | Domestic Purchase Orders | `purchase_purchase_order_domestic` |
| Service PO | Service Purchase Orders | `purchase_service_po` |
| PINV Auth | Invoice Verification | `purchase_pinv_authorisation` |
| Debit Note | Debit Notes | `purchase_debit_note` |

### Stores Module (sidebar: **Inventory**)

| Previous Label | New Label | Menu Code |
|----------------|-----------|-----------|
| GRN | Goods Receipt | `stores_grn` |
| Goods Inward | Material Receipt | `stores_goods_inward` |
| Goods Transfer | Material Transfer | `stores_goods_transfer` |
| Stores Inventory Reco | Physical Verification | `stores_stores_inventory_reco` |
| Inventory Inward Entry | Inventory Adjustment | `stores_inventory_inward_entry` |

### Masters Module

| Previous Label | New Label | Menu Code |
|----------------|-----------|-----------|
| Supplier | Vendor Master | `masters_purchase_supplier` |
| Supplier Summary | Vendor Summary | (list page breadcrumb) |
| New Supplier | New Vendor | (form title) |
| Prospect Supplier | Prospect Vendor | `masters_purchase_prospect_supplier` |
| Item Master | Material Master | `masters_purchase_item_master` |
| Upload Item Master | Bulk Material Import | `masters_purchase_upload_item_master` |
| Logistics | Logistics Master | `masters_purchase_logistics` |
| GST/P | Tax Masters | `masters_purchase_gst_p` |
| HSN/P Master | HSN Master | `masters_purchase_gst_p_hsn_p_master` |
| SAC/P Master | SAC Master | `masters_purchase_gst_p_sac_p_master` |
| Stores (Masters hub) | Inventory Masters | `masters_stores` |

### Settings (Data Management)

| Previous Label | New Label |
|----------------|-----------|
| Item Document Types | Material Document Types |
| Item Attributes | Material Attributes |

### Reports Module

| Previous Label | New Label | Menu Code |
|----------------|-----------|-----------|
| Purchase Order (report) | Purchase Order Register | `reports_purchase_purchase_order` |
| Purchase Indent (report) | Purchase Requisition Register | `reports_purchase_purchase_requisition` |
| Service Purchase Order (report) | Service Purchase Order Register | `reports_purchase_service_purchase_order` |
| Item Wise PO | Material Wise Purchase Orders | `reports_purchase_item_wise_po` |
| Supplier (report) | Vendor Report | `reports_purchase_supplier` |
| Reorder Level | Reorder Level Report | `reports_purchase_reorder_level` |
| Item Master Summary | Material Master Summary | `reports_purchase_item_master_summary` |

### Dashboard

| Previous Label | New Label |
|----------------|-----------|
| Generate PO (quick action) | Purchase Orders |
| Purchase Indent (quick action) | Purchase Requisition |
| Mat. Planning (quick action) | Procurement Planning |
| Approved Indents (metric) | Approved Requisitions |
| Open POs (metric) | Open Purchase Orders |
| Fulfilled POs (metric) | Fulfilled Purchase Orders |
| Awaiting GRN (metric) | Awaiting Goods Receipt |
| Active suppliers | Active vendors |
| Top suppliers by spend | Top vendors by spend |
| Top items by spend | Top materials by spend |
| Active items | Active materials |

### Vendor / Material Field Labels (UI)

| Previous | New |
|----------|-----|
| Supplier Code | Vendor Code |
| Supplier Name | Vendor Name |
| Supplier Category | Vendor Category |
| Item Code / Item No. | Material Code |
| Item Name | Material Name |

---

## 3. Module Status (Post–June 2026)

| Module / Feature | Route | Status |
|------------------|-------|--------|
| **RFQ Management** | `/app/purchase/rfq-management` | **Live** — full CRUD, workflow, print, register |
| **RFQ Register** | `/app/reports/purchase/rfq-register` | **Live** |
| **Source List** | `/app/masters/purchase/source-list` | **Live** — master CRUD + Purchase hub shortcut |
| **Vendor Evaluation (showcase)** | `/app/purchase/vendor-evaluation` | **Showcase** — demo data, scorecards |
| **Vendor Evaluation master** | `/app/masters/purchase/vendor-evaluation` | **Live** — hidden from Masters hub |
| **PR / GRN registers** | `/app/reports/purchase/purchase-requisition`, `goods-receipt-register` | **Live** |
| **Quotation Management** | `/app/purchase/quotation-management` | Placeholder |
| **Comparative Statement** | `/app/purchase/comparative-statement` | Placeholder |
| **Contract Management** | `/app/purchase/contract-management` | Placeholder |
| **Gate Pass** | `/app/stores/gate-pass` | Placeholder |
| **Finance sidebar** | `/app/finance` | Placeholder hub |

---

## 4. Hub Layout Changes

### Purchase Hub (16 visible cards)
Procure-to-pay order: Requisition → Approved → Planning → **RFQ** → Quotation → Comparative → **Vendor Evaluation** → Contract → PO → SPO → Import PO → Goods Receipt → Source List → Returns → Reports → Dashboard.

### Masters → Purchase (9 visible)
Material Master, Service Master, Vendor Master, **Source List**, Asset, Payment Terms, Logistics, Tax Masters, Bulk Material Import. Prospect Vendor, Vendor Evaluation master, Service R1 hidden.

### Masters → Inventory (6 visible)
Warehouse, Location, Rack, Bin, Material Inventory Levels, Bulk Material Import. Material Master duplicate hidden.

### Quality Hub (11 visible)
Inspection Parameters, Inspection Plan, Inspection Checklist, Inspection Schedule, Incoming Inspection, Quality Inspection, Inspection Results, Quality Decisions, Rejected Materials, Quality Reports, Quality Dashboard. Legacy MRN/PDIR cards hidden.

### Inventory Hub / Stores sidebar
12 visible stock-operation cards; manufacturing/legacy cards hidden.

---

## 5. Branding & Print

| Asset | Location |
|-------|----------|
| MPBCDC logo seed | `npm run seed:mpbcdc-logo` |
| Print logo component | `frontend/src/components/print/DocumentOrganizationLogo.jsx` |
| Branding config | `frontend/src/config/documentBranding.js` |
| PO print | Company name in Bill To/Ship To; logo-only header option |

---

## 6. Production Deployment

| Item | Value |
|------|-------|
| Public URL | https://pms.idms-atp.com |
| API (internal) | Node on port **5020** |
| Architecture | Nginx serves `frontend/dist`; proxies `/api/*` to backend |
| Frontend env | `frontend/.env.production` — `VITE_API_BASE_URL=` (same-origin) |
| Backend env | See `backend/.env.production.example` |
| Deploy guide | [deploy/DEPLOY.md](../deploy/DEPLOY.md) |

---

## 7. Files Modified (Key)

### Backend

| File | Changes |
|------|---------|
| `backend/scripts/menu-catalog.js` | MPBCDC labels, RFQ, registers, Finance, hub cleanup |
| `backend/scripts/menu-card-descriptions.js` | Updated card descriptions |
| `backend/src/models/Rfq.model.js` | New RFQ collection |
| `backend/src/services/rfq.service.js` | RFQ business logic |
| `backend/src/app.js` | Trust proxy, CORS, optional static frontend |

### Frontend

| File | Changes |
|------|---------|
| `frontend/src/pages/purchase/Rfq*.jsx` | RFQ screens |
| `frontend/src/pages/reports/*Register*.jsx` | PR, GRN, RFQ registers |
| `frontend/src/pages/masters/SourceList*.jsx` | Source List master |
| `frontend/src/pages/purchase/vendorEvaluation/*` | Vendor Evaluation showcase |
| `frontend/src/components/print/DocumentOrganizationLogo.jsx` | Print branding |
| `frontend/.env.production.example` | Production API URL template |

---

## 8. Verification Checklist

| Check | Status |
|-------|--------|
| Frontend production build | ✓ Pass |
| Menu seed to MongoDB | ✓ ~222 items (`seed:erp-sidebar`) |
| RFQ auto-increment | ✓ `seed:rfq-setup` |
| MPBCDC logo on prints | ✓ After `seed:mpbcdc-logo` |
| PO Register columns | ✓ Simplified layout (no overlap) |
| Hard refresh after menu seed | Required — re-login reloads `/api/framework/session` |

---

## 9. Post-Deploy Steps

1. **Hard refresh** browser or **log out and log back in** after menu seeds  
2. Run `npm run seed:erp-sidebar` and `npm run seed:rfq-setup` on server if RFQ menus missing  
3. Run `npm run seed:mpbcdc-logo` for organisation logo on login and prints  
4. Verify **Purchase hub** shows RFQ, Vendor Evaluation, Source List shortcut  
5. Verify **Reports → Purchase** shows PR, RFQ, GRN registers  
6. Configure Nginx + SSL + PM2 per [deploy/DEPLOY.md](../deploy/DEPLOY.md)

---

## Related Documentation

- [FUNCTIONAL_INDEX.md](./FUNCTIONAL_INDEX.md)  
- [RFQ_IMPLEMENTATION.md](./RFQ_IMPLEMENTATION.md)  
- [FUNCTIONAL_NAVIGATION_AND_ACCESS.md](./FUNCTIONAL_NAVIGATION_AND_ACCESS.md)  
- [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md)  
