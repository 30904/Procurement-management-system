# Quality Module — Functional Guide

> Part of the [Functional Documentation Index](./FUNCTIONAL_INDEX.md)  
> **Hub route:** `/app/quality`  
> **Menu code:** `quality`

---

## 1. Module Purpose

The **Quality** module supports **incoming inspection, in-process quality control, and material validation** workflows in a manufacturing procurement environment.

Quality operates alongside **Stores** (GRN triggers inspection) and **Purchase** (supplier quality feedback).

### Business Flow

```
GRN / Material Receipt → MRN → Inspection (PDIR) → Accept / Reject → GTR (transfer to stock or quarantine)
```

---

## 2. Quality Hub — Visible Cards (11)

Quality hub follows **setup → execution → outcomes** (legacy MRN/PDIR cards hidden from normal users):

| # | Card | Menu Code | Route | Status |
|---|------|-----------|-------|--------|
| 1 | Inspection Parameters | `quality_inspection_parameters` | `/app/masters/quality/standard-specifications` | **Live** (master shortcut) |
| 2 | Inspection Plan | `quality_inspection_plan` | `/app/quality/inspection-plan` | Placeholder |
| 3 | Inspection Checklist | `quality_inspection_checklist` | `/app/masters/quality/inspection-checklist` | **Live** (master shortcut) |
| 4 | Inspection Schedule | `quality_inspection_schedule` | `/app/quality/inspection-schedule` | Placeholder |
| 5 | Incoming Inspection | `quality_incoming_inspection` | `/app/quality/incoming-inspection` | Placeholder |
| 6 | Quality Inspection | `quality_quality_inspection` | `/app/quality/quality-inspection` | Placeholder |
| 7 | Inspection Results | `quality_inspection_results` | `/app/quality/inspection-results` | Placeholder |
| 8 | Quality Decisions | `quality_quality_decisions` | `/app/quality/quality-decisions` | Placeholder |
| 9 | Rejected Materials | `quality_rejected_materials` | `/app/quality/rejected-materials` | Placeholder |
| 10 | Quality Reports | `quality_quality_reports` | `/app/quality/quality-reports` | Placeholder |
| 11 | Quality Dashboard | `quality_quality_dashboard` | `/app/quality/quality-dashboard` | Placeholder |

### Hidden / Legacy Cards (Super Admin)

MRN, WO Execution, PDIR Entry, Job Card Entry, Rejection Summary, GTR, JC Entry, Material Re-Validation, QC Batch Release, Batch Card Execution — registered but `isHidden: true` until exposed via Menu Setup.

---

## 3. Transaction Screens — Planned Functionality

### MRN — Material Receipt Note
**Purpose:** Register incoming material for quality inspection after physical receipt.

**Expected features:**
- Link to GRN or direct receipt  
- Sample quantity, batch/lot tracking  
- Trigger inspection checklist  

### WO Execution
**Purpose:** Execute quality checks during work order / production operations.

### PDIR Entry — Pre-Dispatch Inspection Report
**Purpose:** Final quality check before dispatch to customer.

### GTR — Goods Transfer Request
**Purpose:** QC-authorised transfer of accepted material to usable stock or quarantine.

### Rejection Summary
**Purpose:** Consolidated view of rejected lots, reasons, and supplier feedback.

### Material Re-Validation
**Purpose:** Re-test material approaching expiry or after storage conditions change.

### QC Batch Release Entry
**Purpose:** Formal batch release for pharmaceutical/FMCG regulated industries.

### Batch Card Execution
**Purpose:** Execute batch-wise quality checks per batch card specification.

---

## 4. Quality Masters (Implemented)

Quality reference data is maintained under **Masters → Quality** (`/app/masters/quality`):

| # | Master | Route | Status |
|---|--------|-------|--------|
| 1 | Item QCL | `/app/masters/quality/item-qcl` | **Live** |
| 2 | Standard Specifications | `/app/masters/quality/standard-specifications` | **Live** |
| 3 | Inspection Checklist | `/app/masters/quality/inspection-checklist` | **Live** |
| 4 | RM Specifications | `/app/masters/quality/rm-specifications` | **Live** |
| 5 | SKU Specifications | `/app/masters/quality/sku-specifications` | Placeholder |
| 6 | JW Specifications | `/app/masters/quality/jw-specifications` | Placeholder |
| 7 | Production Item Specification | `/app/masters/quality/production-item-specification` | Placeholder |
| 8 | Defect List Configuration | `/app/masters/quality/defect-list-configuration` | Placeholder |
| 9+ | Advanced masters (JW Item QCL, Drawing Master, SKU Master, etc.) | Various | Placeholder / Super Admin hidden |

See [FUNCTIONAL_MASTERS.md](./FUNCTIONAL_MASTERS.md) for master screen details.

---

## 5. Implemented Master — Functional Descriptions

### Item QCL (Incoming Quality Control Level)
**Route:** `/app/masters/quality/item-qcl`

**Purpose:** Define inspection rules per item — sample size, acceptance criteria, linked checklist.

**Features:** List, create, edit items with QCL parameters.

### Standard Specifications
**Route:** `/app/masters/quality/standard-specifications`

**Purpose:** Company-wide standard specification templates referenced during inspection.

### Inspection Checklist
**Route:** `/app/masters/quality/inspection-checklist`

**Purpose:** Configurable checklist items (parameters, min/max, method) used during MRN/PDIR.

### RM Specifications
**Route:** `/app/masters/quality/rm-specifications`

**Purpose:** Raw material specification definitions — chemical, physical, dimensional parameters.

---

## 6. Super Admin Hidden Cards

These quality transaction and master cards are hidden from normal users until Super Admin exposes them:

- Job Card Entry  
- Rejection Summary  
- JC Entry  
- Material Re-Validation  
- QC Batch Release Entry  
- Batch Card Execution  
- JW Item QCL, Drawing Master, SKU Master, Item Master (quality), Supplier Evaluation Master, Product/Item Category Specifications  

---

## 7. Integration Points

| Module | Integration |
|--------|-------------|
| **Stores → GRN** | GRN posting may trigger MRN creation |
| **Purchase → PO** | Supplier quality rating from rejection data |
| **Masters → Item** | Item links to QCL and RM specifications |
| **Masters → Supplier** | Supplier evaluation master (planned) |

---

## 8. Permissions Summary

| Typical role | Suggested permissions |
|--------------|----------------------|
| QC Inspector | view, create, edit on MRN, PDIR (when live) |
| QC Manager | + approve batch release, view rejection summary |
| QC Admin | view, edit on quality masters |
| Store Keeper | view on MRN status (hold/release stock) |

---

## Related Documents

- [Masters — Quality section](./FUNCTIONAL_MASTERS.md)  
- [Stores](./FUNCTIONAL_STORES.md)  
- [Masters Implementation Guide](./MASTERS_MODULE_IMPLEMENTATION.md)  
