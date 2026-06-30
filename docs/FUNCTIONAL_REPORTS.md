# Reports Module — Functional Guide

> Part of the [Functional Documentation Index](./FUNCTIONAL_INDEX.md)  
> **Hub route:** `/app/reports`  
> **Menu code:** `reports`

---

## 1. Module Purpose

The **Reports** module provides **read-only analytical and register views** across Purchase, Stores, and Quality data — filters, export, print, and summary totals for management and compliance.

Reports require the `reportGenerated` permission flag (or `view` + report access) on the respective menu code.

---

## 2. Reports Hub

| Card | Menu Code | Route | Report Cards |
|------|-----------|-------|--------------|
| Purchase | `reports_purchase` | `/app/reports/purchase` | 20 registered |
| Stores | `reports_stores` | `/app/reports/stores` | Planned |
| Quality | `reports_quality` | `/app/reports/quality` | Planned |
| Finance | `reports_finance` | `/app/reports/finance-reports` | Planned |

---

## 3. Purchase Reports Hub

**Route:** `/app/reports/purchase`

All purchase reports follow the route pattern:  
`/app/reports/purchase/{report-slug}`

| # | Report Name | Menu Code | Route | Status |
|---|-------------|-----------|-------|--------|
| 1 | Purchase Order Register | `reports_purchase_purchase_order` | `/app/reports/purchase/purchase-order` | **Live** |
| 2 | Purchase Requisition Register | `reports_purchase_purchase_requisition` | `/app/reports/purchase/purchase-requisition` | **Live** |
| 3 | RFQ Register | `reports_purchase_rfq_register` | `/app/reports/purchase/rfq-register` | **Live** |
| 4 | Goods Receipt Register | `reports_purchase_goods_receipt_register` | `/app/reports/purchase/goods-receipt-register` | **Live** |
| 5 | Material Wise Purchase Orders | `reports_purchase_item_wise_po` | `/app/reports/purchase/item-wise-po` | **Live** |
| 6 | Outstanding PO Report | `reports_purchase_outstanding_po_report` | `/app/reports/purchase/outstanding-po-report` | Placeholder |
| 7 | Service Purchase Order Register | `reports_purchase_service_purchase_order` | `/app/reports/purchase/service-purchase-order` | **Live** |
| 8 | Inventory Report | `reports_purchase_inventory_report` | `/app/reports/purchase/inventory-report` | Placeholder |
| 9 | Job Work | `reports_purchase_job_work` | `/app/reports/purchase/job-work` | Placeholder |
| 10 | Debit Note | `reports_purchase_debit_note` | `/app/reports/purchase/debit-note` | Placeholder |
| 11 | Debit Note Summary | `reports_purchase_debit_note_summary` | `/app/reports/purchase/debit-note-summary` | Placeholder |
| 12 | Delivery Challan | `reports_purchase_delivery_challan` | `/app/reports/purchase/delivery-challan` | Placeholder |
| 13 | Inventory | `reports_purchase_inventory` | `/app/reports/purchase/inventory` | Placeholder |
| 14 | PPV | `reports_purchase_ppv` | `/app/reports/purchase/ppv` | Placeholder |
| 15 | Material Consumption | `reports_purchase_item_consumption` | `/app/reports/purchase/item-consumption` | Placeholder |
| 16 | Monthly Material Consumption | `reports_purchase_monthly_item_consumption` | `/app/reports/purchase/monthly-item-consumption` | Placeholder |
| 17 | Purchase Summary | `reports_purchase_purchase_summary` | `/app/reports/purchase/purchase-summary` | Placeholder |
| 18 | Material Master Summary | `reports_purchase_item_master_summary` | `/app/reports/purchase/item-master-summary` | Placeholder |
| 19 | Vendor Report | `reports_purchase_supplier` | `/app/reports/purchase/supplier` | Placeholder |
| 20 | Reorder Level Report | `reports_purchase_reorder_level` | `/app/reports/purchase/reorder-level` | Placeholder |

---

## 4. Implemented Reports — Detail

### 4.1 Purchase Order Register

**Route:** `/app/reports/purchase/purchase-order`  
**Menu code:** `reports_purchase_purchase_order`  
**Status:** **Live**

**Purpose:** Approved purchase order register for audit, tracking, and print.

**Columns:** PO #, PO Date, Vendor Name, Currency, Taxable Amount, GST Amount, Total PO Value, Order Reference, Action (print).

**Features:**
- Filter by date range, vendor, PO number search  
- Pagination and fixed column layout (no overlap)  
- Summary totals (taxable, GST, total PO value)  
- Open PO print in new tab  
- Shows **approved** POs only (excludes drafts and cancelled)  

**Data source:** `GET /api/purchase/reports/purchase-orders`

**Columns (June 2026):** PO #, PO Date, Vendor Name, Currency, Taxable Amount, GST Amount, Total PO Value, Order Reference, Action (print). Status and line-count columns removed to prevent table overlap.

---

### 4.2 Purchase Requisition Register

**Route:** `/app/reports/purchase/purchase-requisition`  
**Menu code:** `reports_purchase_purchase_requisition`  
**Status:** **Live**

**Purpose:** Register of purchase requisitions (indents) with status, dates, and line summary.

**Features:**
- Filter by date range, status, requisition number  
- Location-scoped data  
- Links to requisition detail where permitted  

---

### 4.3 RFQ Register

**Route:** `/app/reports/purchase/rfq-register`  
**Menu code:** `reports_purchase_rfq_register`  
**Status:** **Live**

**Purpose:** Register of RFQ documents — status, vendors invited, closing dates, and values.

**Features:**
- Filter by date range, status, RFQ number  
- Open RFQ detail or print  
- Supports awarded / expired / open lifecycle reporting  

See [RFQ_IMPLEMENTATION.md](./RFQ_IMPLEMENTATION.md).

---

### 4.4 Goods Receipt Register

**Route:** `/app/reports/purchase/goods-receipt-register`  
**Menu code:** `reports_purchase_goods_receipt_register`  
**Status:** **Live**

**Purpose:** Register of goods receipt notes posted against purchase orders.

**Features:**
- Filter by date range, PO reference, GRN number  
- Received quantities and PO linkage  

---

### 4.5 Material Wise PO Report

**Route:** `/app/reports/purchase/item-wise-po`  
**Menu code:** `reports_purchase_item_wise_po`  
**Status:** **Live**

**Purpose:** Purchase analysis grouped by material — quantities and values ordered across POs.

**Features:**
- Filter by item, date range, vendor  
- Line-level detail with PO reference  
- Export capability (where enabled)  

---

### 4.6 Service Purchase Order Register

**Route:** `/app/reports/purchase/service-purchase-order`  
**Menu code:** `reports_purchase_service_purchase_order`  
**Status:** **Live**

**Purpose:** Register of approved Service Purchase Orders.

**Features:**
- Filter by date, vendor, SPO number  
- Print individual SPO: `/app/reports/purchase/service-purchase-order/:id/print`  
- Service line detail with SAC and amounts  

---

## 5. Planned Reports — Functional Intent

### Outstanding PO Report
Open PO lines not yet fully received — supports follow-up with vendors and store planning.

### Inventory Report / Inventory
Current stock position by material and store (overlapping with Inventory module reports).

### Job Work Report
Open and closed job work orders — material issued vs returned.

### Debit Note / Debit Note Summary
Vendor debit note register and aggregated summary.

### Delivery Challan
Register of delivery challans issued for job work and transfers.

### PPV — Purchase Price Variance
Variance between standard cost and actual PO rate.

### Material Consumption / Monthly Material Consumption
Material consumption trends for planning and budgeting.

### Purchase Summary
Executive summary — total purchase value by period, category, vendor.

### Material Master Summary
Snapshot report of material master attributes and status.

### Vendor Report
Vendor-wise purchase volume, delivery performance, quality rating.

### Reorder Level Report
Materials below reorder point based on Material Inventory Levels (Item INL) configuration.

---

## 6. Stores & Quality Reports (Planned)

The Reports hub includes **Stores** and **Quality** category cards. Sub-report tiles for these modules are planned for future releases:

| Category | Expected reports |
|----------|------------------|
| **Stores** | GRN register (also under Purchase hub), stock ledger, transfer register |
| **Quality** | MRN register, rejection analysis, batch release log, inspection summary |

---

## 7. Report vs Transaction List

| Aspect | Transaction list (e.g. Generate PO) | Report (e.g. PO Register) |
|--------|-------------------------------------|---------------------------|
| **Purpose** | Day-to-day operations | Analysis and audit |
| **Data** | Drafts + in-progress | Typically approved/posted only |
| **Actions** | Create, edit, approve | Filter, export, print |
| **API** | `/purchase/purchase-orders` | `/purchase/reports/purchase-orders` |

---

## 8. Permissions

| Role | Typical access |
|------|----------------|
| Purchase Manager | All purchase reports |
| Finance | PO register, vendor report, debit note |
| Store Keeper | Inventory, reorder level (when live) |
| QC Manager | Quality reports (when live) |
| Standard user | No report access unless granted |

Grant via **Settings → Permission Management** — enable `view` and `reportGenerated` on report menu codes.

---

## 9. Export & Print

Implemented reports support:
- **Print** — browser print or dedicated print page (PO, SPO, RFQ)  
- **PDF** — via browser print-to-PDF on print layouts  
- **Excel export** — via DataTable export where configured (extend per report)  

---

## Related Documents

- [Purchase](./FUNCTIONAL_PURCHASE.md)  
- [Stores](./FUNCTIONAL_STORES.md)  
- [RFQ Implementation](./RFQ_IMPLEMENTATION.md)  
- [PO Implementation — Report section](./PURCHASE_ORDER_TRANSACTION_IMPLEMENTATION.md)  
