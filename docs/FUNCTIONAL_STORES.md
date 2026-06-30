# Stores Module — Functional Guide

> Part of the [Functional Documentation Index](./FUNCTIONAL_INDEX.md)  
> **Hub route:** `/app/stores`  
> **Menu code:** `stores`

---

## 1. Module Purpose

The **Stores** module manages **inventory movement and stock control** — receiving goods against purchase orders, internal transfers, returns, reconciliation, and goods issue.

### Business Flow

```
PO (Purchase) → GRN (Goods Receipt) → Stock Balance Update
    → Goods Transfer → GIN (Goods Issue) → Inventory Reconciliation
```

> **Sidebar label:** Inventory · **Menu code:** `stores` (unchanged)

---

## 2. Inventory Hub — Visible Cards (12)

| # | Card Label | Menu Code | Route | Status |
|---|------------|-----------|-------|--------|
| 1 | Goods Receipt | `stores_grn` | `/app/stores/grn` | **Live** |
| 2 | Goods Issue | `stores_goods_issue` | `/app/stores/goods-issue` | Placeholder |
| 3 | Material Transfer | `stores_goods_transfer` | `/app/stores/goods-transfer` | **Live** |
| 4 | Inventory Adjustment | `stores_inventory_adjustment` | `/app/stores/inventory-adjustment` | Placeholder |
| 5 | Gate Pass | `stores_gate_pass` | `/app/stores/gate-pass` | Placeholder |
| 6 | Physical Verification | `stores_physical_verification` | `/app/stores/physical-verification` | Placeholder |
| 7 | Stock Inquiry | `stores_stock_inquiry` | `/app/stores/stock-inquiry` | Placeholder |
| 8 | Inventory Transactions | `stores_inventory_transactions` | `/app/stores/inventory-transactions` | Placeholder |
| 9 | Bin Transfer | `stores_bin_transfer` | `/app/stores/bin-transfer` | Placeholder |
| 10 | Stock Ledger | `stores_stock_ledger` | `/app/stores/stock-ledger` | Placeholder |
| 11 | Inventory Reports | `stores_inventory_reports` | `/app/stores/inventory-reports` | Placeholder |
| 12 | Inventory Dashboard | `stores_inventory_dashboard` | `/app/stores/inventory-dashboard` | Placeholder |

### Hidden / Legacy Cards

Material Receipt (Goods Inward), Cancel GRN, manufacturing inward entries, GIN, GTE, debit note, delivery challans, and related tiles remain registered but hidden until Super Admin exposes them via Menu Setup.

---

## 3. Goods Receipt (GRN)

**Route:** `/app/stores/grn`  
**Alternate route:** `/app/purchase/goods-receipt`  
**Status:** **Live**

### Purpose
Record physical receipt of goods against an approved Purchase Order. Posting a GRN updates stock balances and PO line received quantities.

### Key Features
- List GRNs for active location  
- Create GRN linked to approved PO  
- Line-level received quantity, batch/lot (if applicable)  
- Target inventory store selection  
- **Post** action — commits stock movement  
- PO fulfillment status auto-updates (Partially Received → Closed)  

### Document Lifecycle

| Status | Meaning |
|--------|---------|
| Draft | Editable GRN |
| Posted | Stock updated; PO lines updated |
| Cancelled | Voided (via Cancel GRN when implemented) |

### Dependencies
- Approved Purchase Order  
- Inventory Stores (Settings → Company Setup)  
- Item Master (Material Master)  
- Active location selected in header  

### Typical Users
Store keepers, warehouse operators, receiving clerks.

---

## 4. Material Transfer (Goods Transfer)

**Route:** `/app/stores/goods-transfer`  
**Status:** **Live**

### Purpose
Move stock between inventory stores (within or across locations).

### Key Features
- List transfer documents  
- Create transfer with source store, destination store, items, quantities  
- Location-scoped  
- Status tracking  

### Typical Users
Store keepers, inventory controllers.

---

## 5. Placeholder Screens — Functional Intent

The following cards are registered in navigation but show a **module placeholder** screen until implemented:

### Goods Inward
General goods inward entry not tied to a specific PO workflow.

### Goods Return Acceptance
Accept returned goods from production or customers back into stores.

### Cancel GRN
Reverse or cancel a posted GRN with audit controls.

### ReWork Authorisation
Authorise rework material movement for rejected/quarantine stock.

### Purchase Requisition
Stores-initiated purchase request (distinct from Purchase module indent).

### Inventory Inward Entry
Non-PO inventory additions (opening stock, adjustments).

### Stores Inventory Reco
Physical stock count vs system balance reconciliation.

### GTE / Smart GTE (Intra)
Goods Transfer Entry — formal inter-location or intra-plant transfers.

### GIN — Goods Issue Note
Issue material from stores to production or other departments.

### Finished Goods Inward Entry
Receive finished goods from production into FG stores.

### Intra Delivery Challan / E-Way Bill
Compliance documents for inter-state stock movement.

### DRN for Goods Return
Debit/return note linkage for supplier returns.

---

## 6. Super Admin Hidden Cards

Cards marked **Super Admin hidden** in the menu catalog are not visible to standard users. Super Admin can expose them via **Menu Setup** when the feature is ready for rollout.

Hidden cards in Stores:
- Finished Goods Inward Entry  
- Intra Delivery Challan  
- Debit Note  
- Delivery Challan E-Way Bill  
- Goods Return to RM Quarantine Stores  
- GIN  
- Smart GTE (Intra)  

---

## 7. Stock & Location Model

| Concept | Configuration | Usage |
|---------|---------------|-------|
| **Location** | Location Master | Header switcher; document scope |
| **Inventory Store** | Inventory Stores | GRN destination; transfer source/dest |
| **Stock Balance** | Auto-maintained on GRN post | Available quantity per item per store |
| **Item INL** | Masters → Stores → Item INL | Min/max/reorder levels |

See [MULTI_LOCATION_IMPLEMENTATION_AND_IMPACT.md](./MULTI_LOCATION_IMPLEMENTATION_AND_IMPACT.md).

---

## 8. Integration with Purchase

| Purchase Event | Stores Impact |
|----------------|---------------|
| PO Approved | GRN can be created against PO lines |
| GRN Posted | PO line `receivedQty` increases; PO status may change |
| PO Closed | No further GRN allowed |

---

## 9. Permissions Summary

| Typical role | Suggested permissions |
|--------------|----------------------|
| Store Keeper | view, create, edit on GRN and Transfer |
| Store Manager | + approve/post, cancel |
| Purchase Officer | view on GRN (tracking PO fulfillment) |
| QC Inspector | view on GRN (for inspection trigger) |

---

## Related Documents

- [Purchase](./FUNCTIONAL_PURCHASE.md)  
- [Quality](./FUNCTIONAL_QUALITY.md)  
- [Masters — Stores](./FUNCTIONAL_MASTERS.md)  
- [Multi-Location Guide](./MULTI_LOCATION_IMPLEMENTATION_AND_IMPACT.md)  
