# RFQ (Request for Quotation) — Implementation Guide

> **Status:** Live (June 2026)  
> **Audience:** Developers extending Quotation Management, Comparative Statement, and PO Award modules  
> **Related:** [FUNCTIONAL_PURCHASE.md](./FUNCTIONAL_PURCHASE.md) · [TECHNICAL_GUIDE.md](./TECHNICAL_GUIDE.md)

---

## 1. Overview

The RFQ module sits in the procure-to-pay flow **after Procurement Planning** and **before Quotation Management**:

```
Purchase Requisition → Procurement Planning → RFQ → Quotation → Comparative Statement → PO Award
```

It reuses existing frameworks (document numbering, file upload, audit, print, RBAC) without modifying PR, PO, Vendor Master, Material Master, or Source List collections/APIs.

---

## 2. Backend

| Layer | Path |
|--------|------|
| Model | `backend/src/models/Rfq.model.js` |
| Line schema | `backend/src/models/schemas/rfqLine.schema.js` |
| Vendor schema | `backend/src/models/schemas/rfqVendor.schema.js` |
| Service | `backend/src/services/rfq.service.js` |
| Controller | `backend/src/controllers/rfq.controller.js` |
| Routes | `backend/src/routes/purchaseTransaction.routes.js` (mounted at `/api/purchase`) |

**Collection:** `Rfq` (new — does not alter existing collections)

**Document module:** `RFQ` (Auto Increment)

### API (`/api/purchase/rfqs`)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/preview-number` | Next RFQ number preview |
| GET | `/` | List (location-scoped) |
| GET | `/:id` | Detail |
| POST | `/` | Create (Draft) |
| PUT | `/:id` | Update (Draft only) |
| DELETE | `/:id` | Delete (Draft only) |
| POST | `/:id/submit` | Draft → Submitted |
| POST | `/:id/open` | Submitted → Open |
| POST | `/:id/close` | Open → Closed |
| POST | `/:id/award` | Open/Closed → Awarded |
| POST | `/:id/cancel` | Cancel |
| POST | `/:id/expire` | Open → Expired |

### Status flow

`Draft` → `Submitted` → `Open` → `Closed` | `Cancelled` | `Awarded` | `Expired`

Display status **Expired** is also computed when status is `Open` and `closingDate` is in the past.

---

## 3. Frontend

| Asset | Path |
|--------|------|
| Paths | `frontend/src/config/rfqPaths.js` |
| Options | `frontend/src/config/rfqOptions.js` |
| Form state | `frontend/src/utils/rfqFormState.js` |
| Validation | `frontend/src/utils/rfqValidation.js` |
| Print helpers | `frontend/src/utils/rfqPrintHelpers.js` |
| Documents | `frontend/src/components/purchase/RfqDocumentsSection.jsx` |
| List | `frontend/src/pages/purchase/RfqListPage.jsx` |
| Create/Edit | `frontend/src/pages/purchase/RfqCreatePage.jsx` |
| Detail | `frontend/src/pages/purchase/RfqDetailPage.jsx` |
| Print | `frontend/src/pages/purchase/RfqPrintPage.jsx` |
| Register report | `frontend/src/pages/reports/RfqReportPage.jsx` |

### Routes

| Screen | Route | Menu code |
|--------|-------|-----------|
| List | `/app/purchase/rfq-management` | `purchase_rfq_management` |
| Create | `.../new` | same |
| Edit | `.../:id/edit` | same |
| Detail | `.../:id` | same |
| Print | `.../:id/print` | same |
| RFQ Register | `/app/reports/purchase/rfq-register` | `reports_purchase_rfq_register` |

### Reused components

- `DocumentStatusBadge`, `AuditInformationSection`, `FileUploader`
- `PoItemLookupModal`, `PoSupplierLookupModal`, `DataTable`
- `ProcurementPrintFooter`, `DocumentOrganizationLogo`
- `PurchaseIndentForm.module.css` / PO create layout patterns

### File upload entity type

`purchase_rfq` (document type codes in `frontend/src/config/rfqOptions.js`)

### Placeholder actions (Coming Soon)

Email Vendors, Vendor Portal Publish, Auto Vendor Selection, GeM Publish, Reverse Auction — UI buttons only.

---

## 4. Seed & permissions

```bash
cd backend
npm run seed:rfq-setup          # location doc counters + RFQ auto-increment + sidebar + permissions
npm run seed:rfq-auto-increment # company-wide RFQ module only
npm run seed:rfq-module-access  # copy PR-like flags to other roles
```

Menu codes: `purchase_rfq_management`, `reports_purchase_rfq_register`

---

## 5. Next modules (planned)

Build on this RFQ foundation:

1. **Quotation Management** — vendor quote capture  
2. **Comparative Statement** — line-wise comparison  
3. **Purchase Order Award** — PO from awarded RFQ  
