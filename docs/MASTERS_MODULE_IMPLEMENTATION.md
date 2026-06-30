# Masters Module Implementation (Listing + Create/Edit + Revision)

## Goal
This document explains how to implement a **Masters** screen following the same framework pattern you used for **HSN/P Master**:
- Summary listing table (search + sort + filters + actions)
- Create/Edit using a themed modal
- Revision workflow:
  - **ALT+F1** dev-fill for create modal
  - On edit-save: show **Revision Info** modal to capture *who/when/why* and field-wise changes
  - **Revision History** screen from the action menu
  - Eye icon opens **Revision Info/Changes** detail screen
- UX basics:
  - draggable modals (mouse)
  - responsive layout
  - table header tooltips for truncated labels

Use this as a blueprint for every next Masters table.

---

## 1) What “Masters module” means in this codebase
Each Masters module usually has 4 UI parts:

1. **Summary/List page** (`<Resource>MasterPage.jsx`)
2. **Create/Edit modal** (`<Resource>MasterModal.jsx`)
3. **Revision Info modal** (capture reason + proposed/approved by)
4. **Revision History modal** (paginated list + eye view)

And the backend typically has:
1. Mongoose model with `company` scoping (+ `revisionHistory` for audit/versions)
2. Service functions: `list/create/update/delete`
3. Controller endpoints: `GET /api/<resource>`, `POST`, `PUT`, `DELETE`

---

## 2) Frontend components & hooks used by the pattern

### 2.1 Table (Listing/Summary)
- **`frontend/src/components/common/DataTable.jsx`**
- Provides:
  - Search input (client-side)
  - Sorting on `columns[*].sortable`
  - Column filters when `columns[*].filterable` is `true`
  - Action dropdown when you pass `actions`
  - Header tooltips (custom styled tooltip on hover)

**Column definition shape**:
```js
{
  key: "hsnCode",
  label: "HSN Code",
  width: "9%",
  align: "center",
  sortable: true,
  filterable: true,
  render: (value, row) => ...
}
```

### 2.2 Action dropdown
- **`frontend/src/components/common/ActionDropdown.jsx`**
- Renders the kebab menu and optional lucide icons.
- Supports `disabled` per option (in this codebase we also use `disabled: (row)=>...`).

### 2.3 Draggable modal
- **`frontend/src/hooks/useModalDrag.js`**
- Every modal should:
  - Use `useModalDrag()`
  - Bind `onMouseDown={handleHeaderMouseDown}` on the modal header
  - Render with `sc-modal sc-modal-overlay`

### 2.4 ALT+F1 dev-fill (Create modal only)
- **`frontend/src/hooks/useCreateModalDevFill.js`**
- Used only when it’s a create modal (`enabled: !initialData`)
- Hook fills sample values into the create form.

---

## 3) Backend design for Revision History (how to store changes)

### 3.1 Model requirement
For a revision-aware Masters module, add:
- `revNumber` (integer, `min: 0`)
- `revisionHistory` array with structured entries, typically:
  - `revisionNo` (1..N, increments on update)
  - `revisionDate`
  - `reason`
  - `proposedBy`
  - `approvedBy`
  - `changedBy` (who updated; user info)
  - `changedAt`
  - `changes[]` (field-wise diff)

### 3.2 Field-wise diff (“changes” array)
When updating:
1. Build the new `next` values (based on form payload)
2. Compare with current doc values
3. For each changed field, push:
```js
{
  field: "gstRate",
  from: 18,
  to: 12
}
```

### 3.3 Actor (“who changed”)
In this repo, authenticated actor info is available in controller as:
- `req.appUser` (user document)
- `req.rbac` (RBAC resolution)

Pass actor into service so `changedBy` gets stored.

---

## 4) Endpoints (API contract pattern)

Use a consistent REST shape:

| Operation | Method | Endpoint |
|---|---|---|
| List | GET | `/api/<resource>` |
| Create | POST | `/api/<resource>` |
| Update | PUT | `/api/<resource>/:id` |
| Delete | DELETE | `/api/<resource>/:id` |

### Update payload for revision-aware modules
When edit-save happens, your update request should include `revisionInfo`:
```json
{
  "hsnCode": "....",
  "description": "....",
  "gstRate": 18,
  "status": "Active",
  "revisionInfo": {
    "revisionDate": "2026-05-27",
    "reason": "....",
    "proposedBy": "User Name",
    "approvedBy": "Approver Name"
  }
}
```

If `revisionInfo` is missing, service should reject or defer and force UI to collect it.

---

## 5) Frontend implementation checklist (do this for every next Masters screen)

### Step A — Create the List page: `<Resource>MasterPage.jsx`
1. Fetch data using your list API in `useEffect`
2. Normalize rows for `DataTable` (ensure:
   - `row._id` / `row.id` is present
   - numeric values become numbers or stable strings
   - `status` becomes `"Active" | "Inactive"`)
3. Define `columns` for `DataTable`:
   - Keep widths balanced (avoid header clipping)
   - Set `sortable`/`filterable` on important columns
   - For rate fields show compact labels (e.g. `GST %`)
4. Define `actions` for `ActionDropdown`:
   - Edit
   - Delete (with modal confirmation)
   - Revision Log (optional; see revision rules below)
5. Use `DataTable.useRecordCount(rows, setFooterContent)` for footer count

#### Revision Log click rules
- If `revNumber === 0`:
  - disable the action option (`disabled: (row) => row.revNumber === 0`)
  - show not-allowed cursor via `ActionDropdown` disabled styling
- If `revNumber > 0`:
  - open `RevisionHistoryModal`

### Step B — Create/Edit modal: `<Resource>MasterModal.jsx`
1. Use `useState(() => createInitialForm(initialData))`
2. Validate required inputs before calling create/update
3. Implement `handleSave()` to call:
   - create: `POST /api/<resource>`
   - update: `PUT /api/<resource>/:id`
4. **On edit-save only**:
   - open **Revision Info modal** first (do not call update immediately)
   - after Revision Info submit, send the update payload with `revisionInfo`

### Step C — Revision Info modal: `<Resource>RevisionModal.jsx`
1. Draggable (`useModalDrag`)
2. Compact styling (smaller width + centered)
3. Fields (match theme):
   - Revision No (locked, shows `currentRev + 1`)
   - Revision Date (date input)
   - Reason for Revision (textarea)
   - Revision Proposed by (prefill from logged in user)
   - Revision Approved by
4. On save, call `onSave(revisionInfo)`

### Step D — Revision History modal: `<Resource>RevisionHistoryModal.jsx`
1. Draggable
2. Renders a table with:
   - key fields snapshot at each revision
   - `Rev #`
   - an **eye icon** column (`Rev Info`) to open detail modal
3. Include internal pagination (Revision History is separate from DataTable pagination)
4. Eye icon opens `Revision Info detail` screen:
   - Reason + actor fields
   - table listing field changes (field/from/to)

---

## 6) How this was done in HSN/P Master (reference)

### Files in the HSN/P implementation
- `frontend/src/pages/masters/HsnPMasterPage.jsx`
- `frontend/src/components/modals/HsnPMasterModal.jsx`
- `frontend/src/components/modals/HsnPRevisionModal.jsx` (Revision Info capture)
- `frontend/src/components/modals/HsnPRevisionHistoryModal.jsx` (Revision History + eye detail)

### Listing actions
- Edit
- Delete (uses `ConfirmDialog`)
- Revision Log (disabled when `revNumber === 0`)

### ALT+F1
- implemented only in **create mode** in `HsnPMasterModal.jsx`

---

## 7) UX notes & best practices

### 7.1 Table header visibility
- Always keep `width` set per column
- Use shorter labels like `GST %` instead of `GST Rate %`
- Tooltip on hover should show full label if it truncates

### 7.2 Pagination
- `DataTable` currently supports **filtering/sorting/search**, but does not slice results into pages for the main list.
- Revision History modal uses its own internal pagination.

If you want true pagination on the main DataTable:
- implement a `pageSize` + `currentPage` state at page-level and pass `rows={pagedRows}`.

### 7.3 Always refresh after CUD
- After create/update/delete:
  - refetch list from DB
  - close modal
  - reset pending payload state

---

## 8) Quick “Copy Template” summary for the next Masters screen

When building the next Masters resource:
1. Create backend model + service + controller with `revisionHistory` support
2. Create list page:
   - DataTable columns + filterable keys + action dropdown
3. Create modal:
   - ALT+F1 dev fill only in create mode
4. For edit-save:
   - show Revision Info modal, then send update request with `revisionInfo`
5. Add Revision History + eye detail modals (if you need revision UI)

---

## Appendix: Common state variables on the List page
- `rows`, `loading`
- `modalOpen`, `editRow`
- `pendingEditPayload` (store edit form payload until revision info is saved)
- `revisionModalOpen`
- `revisionLogRow` (source row to build revision history)
- `confirmTarget`, `deleting`

