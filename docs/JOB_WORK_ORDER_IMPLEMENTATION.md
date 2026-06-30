# Job Work Order (JWO) — Implementation Notes

## Overview

Job Work Order mirrors **Service PO / Material PO** patterns: location from header scope, draft → approve lifecycle, subcontractor as **Job Worker** (Supplier Master), lines as **JWI** (Item Master / supplier-linked items).

**Routes**

| Area | Path |
|------|------|
| Hub | `app/purchase/job-work` |
| Summary | `app/purchase/job-work/generate-jwo` |
| Create / Edit | `.../generate-jwo/new`, `.../generate-jwo/:id/edit` |

**API** (`/api/purchase/job-work-orders`)

- `GET preview-number`, `GET/POST` list/create, `GET/PUT/DELETE :id`, `POST :id/approve`

**Numbering:** `JWO/{FY}/000001` (auto-increment module `JWO`, location-scoped).

## Data setup (before UAT)

1. **Reseed sidebar** (new menu tile *Generate JWO*):
   ```bash
   cd backend && npm run seed:erp-sidebar
   ```

2. **Job workers** — use **Masters → Purchase → Supplier**. Register subcontractors; optional: link items on each supplier in Item Master → Suppliers tab.

3. **JWI (job work items)** — **Masters → Purchase → Item Master**. Lines on JWO are added via *Add JWI Lines* (supplier-linked items first; falls back to all items if none linked).

4. **JWO Terms** (modal):
   - **Ship To** — company locations (`listLocations`)
   - **Mode of Transport / Freight Terms** — Settings → Master Data
   - **Transporter** — Logistics Master (active LSP)
   - **Payment Terms** — Payment Terms Master + Master Data

5. **Location** — select plant/location in the **header** before save (same as PO/SPO).

6. **Auto-increment** — first save creates `JWO` sequence for the active location if missing.

## ERP flow (typical)

1. Create **Draft JWO** with job worker, JWI lines (qty, rate, schedule), terms, remarks.
2. **Approve** from summary (locks document; `issueStatus` = Not Started for future MJW DC).
3. *(Future)* Material issue to job worker (MJW DC), receipt of processed goods, PINV.

## Files (main)

| Layer | Path |
|-------|------|
| Model | `backend/src/models/JobWorkOrder.model.js` |
| Service | `backend/src/services/jobWorkOrder.service.js` |
| UI Create | `frontend/src/pages/purchase/JobWorkOrderCreatePage.jsx` |
| UI List | `frontend/src/pages/purchase/JobWorkOrderListPage.jsx` |
| Modals | `JwoTermsModal`, `JwoRemarksModal`, `JwoJobWorkerLookupModal`, `JwoJwiLinePickerModal` |

## Not in this MVP

- Amend / Cancel JWO, JWO print/PDF, JWO report, MJW Delivery Challan, JW Master (planning) — menu placeholders remain.
