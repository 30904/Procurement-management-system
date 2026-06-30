# Masters Module — Functional Guide

> Part of the [Functional Documentation Index](./FUNCTIONAL_INDEX.md)  
> **Hub route:** `/app/masters`  
> **Menu code:** `masters`

---

## 1. Module Purpose

**Masters** holds **reference data** used across Purchase, Stores, and Quality transactions. Master records are typically long-lived configuration entities — suppliers, items, tax codes, specifications — as opposed to transactional documents like POs or GRNs.

### Design Pattern

Most implemented master screens follow a consistent pattern:
- **List page** — searchable DataTable with filters, sort, pagination  
- **Create / Edit page** — form with validation  
- **Revision workflow** — some masters support approved revisions (see MASTERS_MODULE_IMPLEMENTATION.md)  
- **Status** — Active / Inactive  

---

## 2. Masters Hub

| Card | Menu Code | Route |
|------|-----------|-------|
| Purchase | `masters_purchase` | `/app/masters/purchase` |
| Inventory Masters | `masters_stores` | `/app/masters/stores` |
| Quality | `masters_quality` | `/app/masters/quality` |

---

## 3. Masters → Purchase

**Hub route:** `/app/masters/purchase`

| # | Master | Menu Code | Route | Status |
|---|--------|-----------|-------|--------|
| 1 | Material Master | `masters_purchase_item_master` | `/app/masters/purchase/item-master` | **Live** |
| 2 | Service Master | `masters_purchase_service_master` | `/app/masters/purchase/service-master` | **Live** |
| 3 | Vendor Master | `masters_purchase_supplier` | `/app/masters/purchase/supplier` | **Live** |
| 4 | Source List | `masters_purchase_source_list` | `/app/masters/purchase/source-list` | **Live** |
| 5 | Asset Master | `masters_purchase_asset_master_capitalised` | `/app/masters/purchase/asset-master-capitalised` | **Live** |
| 6 | Payment Terms | `masters_purchase_payment_terms` | `/app/masters/purchase/payment-terms` | **Live** |
| 7 | Logistics | `masters_purchase_logistics` | `/app/masters/purchase/logistics` | **Live** |
| 8 | Tax Masters | `masters_purchase_gst_p` | `/app/masters/purchase/gst-p` | Sub-hub |
| 9 | Bulk Material Import | `masters_purchase_upload_item_master` | `/app/masters/purchase/upload-item-master` | **Live** |

**Hidden from hub (Super Admin can expose):** Prospect Vendor, Service Master R1, Vendor Evaluation master, duplicate HSN/SAC tiles under Tax Masters group.

### 3.1 Tax Masters Sub-Hub

| Master | Route | Status |
|--------|-------|--------|
| HSN/P Master | `/app/masters/purchase/gst-p/hsn-p-master` | **Live** |
| SAC/P Master | `/app/masters/purchase/gst-p/sac-p-master` | **Live** |

#### HSN/P Master
**Purpose:** Harmonised System of Nomenclature codes for **purchase (goods)** with GST rates.

**Key fields:** HSN code, description, GST rate (%), cess, status.

#### SAC/P Master
**Purpose:** Service Accounting Codes for **purchase services** with GST rates.

**Key fields:** SAC code, description, GST rate (%), status.

---

### 3.2 Vendor Master

**Routes:**
- List: `/app/masters/purchase/supplier`
- Create: `/app/masters/purchase/supplier/new`
- Edit: `/app/masters/purchase/supplier/:id/edit`

**Purpose:** Approved vendors for purchase orders and GRN.

**Key sections:**
- Basic info — code, name, type, status  
- Tax — GSTIN, PAN, MSME  
- Address and contacts  
- Bank details  
- Payment terms default  
- Item supply links (items this supplier provides)  

**Used by:** Generate PO, Service PO, Job Work Order, RFQ, GRN, reports.

---

### 3.3 Source List — **Live**

**Routes:**
- List: `/app/masters/purchase/source-list`
- Create/Edit: `/app/masters/purchase/source-list/new`, `/:id/edit`

**Purpose:** Define approved vendor–material combinations (preferred source) used during RFQ vendor selection and procurement planning.

**Key fields:** Material, vendor, plant/location, validity dates, status.

**Also accessible from:** Purchase hub shortcut (`purchase_source_list`).

---

### 3.4 Prospect Vendor Master

**Routes:** List, create, edit under `/app/masters/purchase/prospect-supplier`

**Purpose:** Pre-qualification register for potential suppliers before approval to Supplier Master.

**Workflow:** Prospect → evaluation → promote to Vendor (manual process).

**Note:** Hidden from Masters hub by default; route remains available when exposed via Menu Setup.

---

### 3.5 Material Master

**Routes:**
- List: `/app/masters/purchase/item-master`
- Create/Edit: `/app/masters/purchase/item-master/new`, `/:id/edit`

**Purpose:** Central register of all purchasable and storable items.

**Key sections:**
- Item code, name, description, category  
- UOM (from Master Data)  
- HSN code link  
- Reorder level, lead time  
- Item attributes (dynamic fields from Settings → Item Attributes)  
- Attached documents (from Settings → Item Document Types)  
- Supplier links (preferred suppliers, rates)  

**Used by:** Purchase Requisition, RFQ, PO, GRN, stock, reports.

---

### 3.6 Bulk Material Import

**Route:** `/app/masters/purchase/upload-item-master`

**Purpose:** Bulk upload items via Excel/CSV template instead of one-by-one entry.

---

### 3.7 Service Master

**Routes:** List + upsert under `/app/masters/purchase/service-master`

**Purpose:** Service catalog for Service Purchase Orders (non-inventory purchases).

**Key fields:** Service code, name, SAC code, default rate, status.

---

### 3.8 Service Master R1

**Routes:** List + upsert under `/app/masters/purchase/service-master-r1`

**Purpose:** Extended/alternate service master variant (R1 register) for specific service categorisation.

---

**Note:** Hidden from hub by default.

---

### 3.9 Vendor Evaluation Master

**Routes:** List + upsert under `/app/masters/purchase/vendor-evaluation`

**Purpose:** Evaluation criteria and scoring templates for vendor performance (used by Purchase → Vendor Evaluation showcase).

**Note:** Hidden from Masters hub; Purchase hub exposes the showcase workspace at `/app/purchase/vendor-evaluation`.

---

### 3.10 Logistics Master

**Routes:**
- List: `/app/masters/purchase/logistics`
- Create: `/app/masters/purchase/logistics/new`
- Edit: `/app/masters/purchase/logistics/:id/edit`

**Purpose:** Transporters, freight forwarders, and logistics partners.

**Key fields:** Code, name, contact, GSTIN, service type, status.

---

### 3.11 Asset Master (Capitalised)

**Routes:**
- List: `/app/masters/purchase/asset-master-capitalised`
- Create/Edit: `/app/masters/purchase/asset-master-capitalised/new`, `/:id/edit`

**Purpose:** Fixed asset register for capital purchases (machinery, equipment).

**Key fields:** Asset code, name, category, capitalisation date, value, location, status.

---

### 3.12 Payment Terms Master

**Route:** `/app/masters/purchase/payment-terms`

**Purpose:** Standard payment terms attached to PO (Net 30, Advance 50%, etc.).

**Key fields:** Term code, description, credit days, advance percentage, status.

---

## 4. Masters → Inventory (Stores)

**Hub route:** `/app/masters/stores`  
**Hub label:** Inventory Masters

| # | Master | Menu Code | Route | Status |
|---|--------|-----------|-------|--------|
| 1 | Warehouse | `masters_stores_warehouse` | `/app/masters/stores/warehouse` | **Live** |
| 2 | Location | `masters_stores_location` | `/app/configuration/location-master` | **Live** (shortcut) |
| 3 | Rack | `masters_stores_rack` | `/app/masters/stores/rack` | **Live** |
| 4 | Bin | `masters_stores_bin` | `/app/masters/stores/bin` | **Live** |
| 5 | Material Inventory Levels | `masters_stores_stock_levels_item_inl` | `/app/masters/stores/item-inl` | **Live** |
| 6 | Bulk Material Import | `masters_stores_upload_item_master` | `/app/masters/stores/upload-item-master` | **Live** |

**Hidden:** Material Master duplicate tile (`masters_stores_item_master`) — primary Material Master is under Masters → Purchase.

### Material Inventory Levels (Item INL)

**Route:** `/app/masters/stores/item-inl`

**Purpose:** Define **min, max, and reorder levels** per material per store/location for inventory planning.

**Key fields:** Material, store/location, minimum qty, maximum qty, reorder point, reorder qty.

**Used by:** Reorder level reports, MRP/planning (when implemented).

> **Note:** Primary Material Master is under Masters → Purchase. The Inventory Masters hub focuses on warehouse structure and stock levels.

---

## 5. Masters → Quality

**Hub route:** `/app/masters/quality`

| # | Master | Menu Code | Route | Status |
|---|--------|-----------|-------|--------|
| 1 | Item QCL | `masters_quality_item_qcl` | `/app/masters/quality/item-qcl` | **Live** |
| 2 | Standard Specifications | `masters_quality_standard_specifications` | `/app/masters/quality/standard-specifications` | **Live** |
| 3 | Inspection Checklist | `masters_quality_inspection_checklist` | `/app/masters/quality/inspection-checklist` | **Live** |
| 4 | RM Specifications | `masters_quality_rm_specifications` | `/app/masters/quality/rm-specifications` | **Live** |
| 5 | SKU Specifications | `masters_quality_sku_specifications` | `/app/masters/quality/sku-specifications` | Placeholder |
| 6 | JW Specifications | `masters_quality_jw_specifications` | `/app/masters/quality/jw-specifications` | Placeholder |
| 7 | Production Item Specification | `masters_quality_production_item_specification` | `/app/masters/quality/production-item-specification` | Placeholder |
| 8 | JW Item QCL | `masters_quality_jw_item_qcl` | `/app/masters/quality/jw-item-qcl` | Placeholder (Super Admin hidden) |
| 9 | Item QCL (alt) | `masters_quality_item_qcl_master` | `/app/masters/quality/item-qcl-master` | Placeholder (Super Admin hidden) |
| 10 | Defect List Configuration | `masters_quality_defect_list_configuration` | `/app/masters/quality/defect-list-configuration` | Placeholder |
| 11 | Drawing Master | `masters_quality_drawing_master` | `/app/masters/quality/drawing-master` | Placeholder (Super Admin hidden) |
| 12 | SKU Master | `masters_quality_sku_master` | `/app/masters/quality/sku-master` | Placeholder (Super Admin hidden) |
| 13 | Item Master | `masters_quality_item_master` | `/app/masters/quality/item-master` | Placeholder (Super Admin hidden) |
| 14 | Supplier Evaluation Master | `masters_quality_supplier_evaluation_master` | `/app/masters/quality/supplier-evaluation-master` | Placeholder (Super Admin hidden) |
| 15 | Product Category Specifications | `masters_quality_product_category_specifications` | `/app/masters/quality/product-category-specifications` | Placeholder (Super Admin hidden) |
| 16 | Item Category Specifications | `masters_quality_item_category_specifications` | `/app/masters/quality/item-category-specifications` | Placeholder (Super Admin hidden) |

See [FUNCTIONAL_QUALITY.md](./FUNCTIONAL_QUALITY.md) for quality master functional descriptions.

---

## 6. Master Data vs Masters Module

| Concept | Location | Purpose |
|---------|----------|---------|
| **Master Data** | Settings → Data Management → Master Data | Generic key-value lookups (UOM, department, city) |
| **Masters Module** | Sidebar → Masters | Structured business entities (supplier, item, HSN) |

Both are "master" data in a broad sense but serve different levels of complexity.

---

## 7. Recommended Master Setup Order

| Step | Master | Why |
|------|--------|-----|
| 1 | Master Data (UOM) | Required for items |
| 2 | HSN/P, SAC/P | Tax codes for items and services |
| 3 | Payment Terms | PO defaults |
| 4 | Vendor Master | Required for PO, RFQ, and Source List supplier selection |
| 5 | Material Master | All transactions |
| 6 | Source List | RFQ vendor selection, planning |
| 7 | Material Inventory Levels | Reorder planning |
| 7 | Item QCL, Inspection Checklist | Quality when GRN/MRN live |
| 8 | Service Master | Service PO |

---

## 8. Permissions Summary

| Typical role | Access |
|--------------|--------|
| Master Data Admin | Full CRUD on all masters |
| Purchase Officer | view on masters; create/edit on indents (not masters) |
| Store Keeper | view on Item Master, Item INL |
| QC Admin | Full CRUD on quality masters |

Master changes are captured in the **Audit Log** (Settings → System).

---

## Related Documents

- [Settings — Data Management](./FUNCTIONAL_SETTINGS.md)  
- [Purchase](./FUNCTIONAL_PURCHASE.md)  
- [Quality](./FUNCTIONAL_QUALITY.md)  
- [Masters Implementation Guide](./MASTERS_MODULE_IMPLEMENTATION.md)  
