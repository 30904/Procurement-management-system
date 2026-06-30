# Purchase Module — Functional Guide

> Part of the [Functional Documentation Index](./FUNCTIONAL_INDEX.md)  
> **Hub route:** `/app/purchase`  
> **Menu code:** `purchase`

---

## 1. Module Purpose

The **Purchase** module covers the **procure-to-pay** cycle — from internal requisitions through RFQ, purchase orders, subcontracting, goods receipt, supplier invoicing, and post-invoice adjustments.

### Business Flow

```
Purchase Requisition → Approval → Procurement Planning → RFQ → Quotation (planned)
    → Purchase Order → Goods Receipt (Stores) → Invoice Verification → Debit Notes
```

Hub cards are arranged left-to-right, top-to-bottom in procure-to-pay sequence (MPBCDC government procurement labels).

---

## 2. Purchase Hub — Visible Cards

| # | Card Label | Menu Code | Route | Status |
|---|------------|-----------|-------|--------|
| 1 | Purchase Requisition | `purchase_purchase_indent` | `/app/purchase/purchase-indent` | **Live** |
| 2 | Approved Requisitions | `purchase_approved_purchase_indents` | `/app/purchase/purchase-indent/approved` | **Live** |
| 3 | Procurement Planning | `purchase_material_purchase_planning` | `/app/purchase/material-purchase-planning` | **Live** |
| 4 | RFQ Management | `purchase_rfq_management` | `/app/purchase/rfq-management` | **Live** |
| 5 | Quotation Management | `purchase_quotation_management` | `/app/purchase/quotation-management` | Placeholder |
| 6 | Comparative Statement | `purchase_comparative_statement` | `/app/purchase/comparative-statement` | Placeholder |
| 7 | Vendor Evaluation | `purchase_vendor_evaluation` | `/app/purchase/vendor-evaluation` | **Showcase** |
| 8 | Contract Management | `purchase_contract_management` | `/app/purchase/contract-management` | Placeholder |
| 9 | Purchase Orders | `purchase_purchase_order` | `/app/purchase/purchase-order` | Sub-hub |
| 10 | Service Purchase Orders | `purchase_service_po` | `/app/purchase/service-po` | Sub-hub |
| 11 | Import Purchase Orders | `purchase_purchase_order_import` | `/app/purchase/purchase-order-import` | **Partial** |
| 12 | Goods Receipt | `purchase_goods_receipt` | `/app/stores/grn` | **Live** (shortcut) |
| 13 | Source List | `purchase_source_list` | `/app/masters/purchase/source-list` | **Live** (shortcut) |
| 14 | Purchase Returns | `purchase_purchase_returns` | `/app/purchase/purchase-returns` | Placeholder |
| 15 | Purchase Reports | `purchase_purchase_register` | `/app/reports/purchase/purchase-order` | **Live** (shortcut) |
| 16 | Purchase Dashboard | `purchase_purchase_dashboard` | `/app/purchase/purchase-dashboard` | **Live** |

### Hidden Cards (Super Admin / Menu Setup)

Domestic PO, Debit Notes, MJW DC, delivery challans, Invoice Verification (`purchase_pinv_authorisation`), and legacy Job Work sub-cards remain registered but hidden until exposed.

---

## 3. Purchase Requisition (Purchase Indent)

**Menu label:** Purchase Requisition · **Menu code:** `purchase_purchase_indent` (unchanged)

**Routes:**
- List: `/app/purchase/purchase-indent`
- Create: `/app/purchase/purchase-indent/new`
- View: `/app/purchase/purchase-indent/:id`
- Edit: `/app/purchase/purchase-indent/:id/edit`
- Approved list: `/app/purchase/purchase-indent/approved`

**Status:** **Live**

### Purpose
Capture internal material/service demand before formal purchase ordering.

### Key Features
- Create indent with line items (item, quantity, required date, remarks)  
- Auto-generated indent number (from Auto Increment config)  
- Location-scoped documents  
- Draft → Submit → Approve workflow  
- Approved indents visible on separate approved list  
- Cancel draft indents  

### Typical Users
Department heads, production planners, purchase requestors.

---

## 4. Procurement Planning (Material Purchase Planning)

**Route:** `/app/purchase/material-purchase-planning`  
**Status:** **Live**

### Purpose
Review material requirements derived from approved indents and plan consolidated purchase actions.

### Key Features
- Requirements list from approved indents  
- Filter by item, supplier, date  
- Bridge between requisition approval and RFQ / PO generation  

---

## 5. RFQ Management — **Live**

**Routes:**
- List: `/app/purchase/rfq-management`
- Create: `/app/purchase/rfq-management/new`
- View: `/app/purchase/rfq-management/:id`
- Edit: `/app/purchase/rfq-management/:id/edit`
- Print: `/app/purchase/rfq-management/:id/print`

**Register report:** `/app/reports/purchase/rfq-register` (`reports_purchase_rfq_register`)

### Purpose
Issue Request for Quotation documents to selected vendors before quotation comparison and PO award.

### Document lifecycle

| Status | Meaning |
|--------|---------|
| Draft | Editable; not yet submitted |
| Submitted | Ready to open for vendor response |
| Open | Vendors may submit quotes (closing date enforced) |
| Closed | Quotation window closed |
| Awarded | Winning vendor selected |
| Cancelled | Voided |
| Expired | Open past closing date (display status) |

### Key features
- RFQ header: title, dates, delivery location, terms  
- Line items from material master or PR reference  
- Invited vendor list with contact details  
- Document attachments (`purchase_rfq` entity type)  
- Audit trail and print layout with organisation logo  
- Actions: submit, open, close, award, cancel, expire  

### Placeholder actions (UI only)
Email Vendors, Vendor Portal Publish, Auto Vendor Selection, GeM Publish, Reverse Auction.

See [RFQ_IMPLEMENTATION.md](./RFQ_IMPLEMENTATION.md) for API and developer details.

---

## 6. Vendor Evaluation — **Showcase**

**Route:** `/app/purchase/vendor-evaluation`  
**Menu code:** `purchase_vendor_evaluation`

**Purpose:** Demonstration workspace for vendor scorecards, trends, comparison, and history using showcase data — not yet wired to live PO/GRN metrics.

**Sub-screens:** Dashboard, list, detail, scorecard, comparison, trend, history.

**Master data:** Vendor Evaluation criteria master exists at `/app/masters/purchase/vendor-evaluation` (hidden from Masters hub by default; Super Admin can expose).

---

## 7. Purchase Order Sub-Hub

**Route:** `/app/purchase/purchase-order`

| Card | Menu Code | Route | Status |
|------|-----------|-------|--------|
| Generate PO | `purchase_purchase_order_generate_po` | `/app/purchase/purchase-order/generate-po` | **Live** |
| Amend PO | `purchase_purchase_order_amend_po` | `/app/purchase/purchase-order/amend-po` | **Partial** |
| Cancel PO | `purchase_purchase_order_cancel_po` | `/app/purchase/purchase-order/cancel-po` | **Partial** |
| Short PO Closing | `purchase_purchase_order_short_po_closing` | `/app/purchase/purchase-order/short-po-closing` | Placeholder |
| Repeat PO | `purchase_purchase_order_repeat_po` | `/app/purchase/purchase-order/repeat-po` | Placeholder |

### 7.1 Generate PO — **Live**

**Routes:**
- List: `/app/purchase/purchase-order/generate-po`
- Create: `/app/purchase/purchase-order/generate-po/new`
- View: `/app/purchase/purchase-order/generate-po/:id`
- Edit: `/app/purchase/purchase-order/generate-po/:id/edit`
- Print: `/app/purchase/purchase-order/generate-po/:id/print`

**Purpose:** Create and manage purchase orders to suppliers.

**Document lifecycle:**

| Status | Meaning |
|--------|---------|
| Draft | Editable; appears in Generate PO workbench |
| Approved | Locked; appears in PO report; eligible for GRN |
| Partially Received / Closed | Updated when GRN lines are posted |
| Cancelled | Voided draft |

**Key fields:**
- Supplier, PO type, PO date, delivery date  
- Bill-to / ship-to locations (company name on print)  
- Line items: item, HSN, quantity, rate, discount, delivery date  
- Incidental expenses (from config)  
- Payment terms  
- GST calculated and stored on save (shown on print, not on edit form)  
- PO terms snapshotted from company config  

**Actions:** Create, edit (draft only), view, approve, cancel, delete (draft), print/PDF

**Dependencies (configure first):**
- Settings → PO Type, Incidental Expenses, PO Terms  
- Settings → Auto Increment (PO module)  
- Masters → Supplier, Item Master, HSN/P Master, Payment Terms  

See [PURCHASE_ORDER_TRANSACTION_IMPLEMENTATION.md](./PURCHASE_ORDER_TRANSACTION_IMPLEMENTATION.md) for full technical blueprint.

**Print:** MPBCDC organisation logo via `DocumentOrganizationLogo`; logo-only header option on PO print.

### 7.2 Amend PO — **Partial**

**Routes:** List + detail under `/app/purchase/purchase-order/amend-po`

**Purpose:** Modify approved POs through formal amendment workflow.

### 7.3 Cancel PO — **Partial**

**Routes:** List + detail under `/app/purchase/purchase-order/cancel-po`

**Purpose:** Cancel approved purchase orders with audit trail.

### 7.4 Import Purchase Orders

**Routes:**
- `/app/purchase/purchase-order-import`

**Purpose:** Workspace variant for import PO scenarios (customs, incoterms, etc.).  
**Status:** **Partial** — uses shared PO backend with workspace-specific UI.

Domestic PO (`purchase_purchase_order_domestic`) remains registered but hidden from the hub.

---

## 8. Service PO Sub-Hub

**Route:** `/app/purchase/service-po`

| Card | Menu Code | Route | Status |
|------|-----------|-------|--------|
| Generate SPO | `purchase_service_po_generate_spo` | `/app/purchase/service-po/generate-spo` | **Live** |
| Cancel SPO | `purchase_service_po_cancel_spo` | `/app/purchase/service-po/cancel-spo` | **Partial** |
| Amend SPO | `purchase_service_po_amend_spo` | `/app/purchase/service-po/amend-spo` | **Partial** |

### Generate SPO — **Live**

**Purpose:** Purchase orders for services (not stock items) — maintenance, consulting, transport, etc.

**Key differences from goods PO:**
- Service lines instead of inventory items  
- SAC codes instead of HSN  
- Service-specific print layout  

**Routes:** List, create, edit, view, print (mirror goods PO pattern)

---

## 9. Job Work Sub-Hub

**Route:** `/app/purchase/job-work`

| Card | Menu Code | Route | Status |
|------|-----------|-------|--------|
| Generate JWO | `purchase_job_work_generate_jwo` | `/app/purchase/job-work/generate-jwo` | **Live** |

### Generate JWO — **Live**

**Purpose:** Job Work Orders for subcontracting — sending raw material to a job worker for processing.

**Routes:**
- List: `/app/purchase/job-work/generate-jwo`
- Create: `/app/purchase/job-work/generate-jwo/new`
- Edit: `/app/purchase/job-work/generate-jwo/:id/edit`

**Key features:**
- Job worker (supplier) selection  
- Material issue lines and expected return  
- Approve workflow  

See [JOB_WORK_ORDER_IMPLEMENTATION.md](./JOB_WORK_ORDER_IMPLEMENTATION.md).

---

## 10. Purchase Dashboard — **Live**

**Route:** `/app/purchase/purchase-dashboard`

**Purpose:** Procurement KPI dashboard with charts, quick actions, and RFQ placeholder metrics (Open RFQs, Closing Today, Pending Award, Expired RFQs) pending live API wiring.

---

## 11. Delivery Challan Cards (Placeholder / Hidden)

| Card | Purpose |
|------|---------|
| MJW DC | Material Job Work delivery challan to subcontractor |
| DC E-Way Bill | E-way bill generation for delivery challans |
| Intra DC | Inter-location delivery challan |
| DC (Generic) | Generic delivery challan document |

**Status:** Placeholder — menu registered; screens not yet implemented.

---

## 12. Invoice Verification (Placeholder / Hidden)

**Route:** `/app/purchase/pinv-authorisation`

**Purpose:** Authorise supplier purchase invoices against GRN/PO before payment processing.

**Backend note:** Purchase Invoice API exists (`/api/purchase/purchase-invoices`); UI is placeholder.

---

## 13. Debit Note (Placeholder / Hidden)

**Route:** `/app/purchase/debit-note`

**Purpose:** Post-invoice debit adjustments to suppliers (returns, rate differences, quality rejections).

---

## 14. Goods Receipt (Cross-Module)

GRN is primarily a **Stores** function but also accessible from Purchase:

| Route | Module |
|-------|--------|
| `/app/purchase/goods-receipt` | Purchase shortcut |
| `/app/stores/grn` | Stores primary |

**Status:** **Live** (list screen; posting updates PO line received quantities)

---

## 15. Configuration Dependencies

Before using Purchase transactions, configure:

| Setting | Required for |
|---------|--------------|
| Auto Increment — Requisition, RFQ, PO, SPO, JWO | Document numbers |
| PO Type | Generate PO dropdown |
| Incidental Expenses | PO charge lines |
| PO Terms & Conditions | PO print page 2 |
| Location Master | Location-scoped documents |
| Supplier Master | PO supplier selection |
| Item Master + HSN/P | PO line items |
| Payment Terms | PO payment schedule |

| Source List Master | Preferred vendor per material (RFQ vendor selection) |

---

## 16. Permissions Summary

Each Purchase card has a unique menu code. Grant permissions via **Settings → Roles & Access → Permission Management**:

| Typical role | Suggested permissions |
|--------------|----------------------|
| Purchase Officer | view, create, edit on requisitions, RFQ, and PO |
| Purchase Manager | + approve on requisitions, RFQ, and PO |
| Store Keeper | view on PO (for GRN reference) |
| Admin | Full access |

---

## Related Documents

- [Stores](./FUNCTIONAL_STORES.md) — GRN and stock  
- [Masters — Purchase](./FUNCTIONAL_MASTERS.md)  
- [Reports — Purchase](./FUNCTIONAL_REPORTS.md)  
- [RFQ Implementation](./RFQ_IMPLEMENTATION.md)  
- [PO Implementation](./PURCHASE_ORDER_TRANSACTION_IMPLEMENTATION.md)  
