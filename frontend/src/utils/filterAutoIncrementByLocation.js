/**
 * When a working location is selected in the header, show company-wide (CENTRAL)
 * series plus location-specific rows for that site only.
 */
export function filterAutoIncrementRowsForLocation(rows, activeLocationId) {
  if (!activeLocationId) return rows;
  const active = String(activeLocationId);
  return rows.filter((row) => {
    const scope = row.allocationScope || (row.locationId ? "LOCATION" : "CENTRAL");
    if (scope === "CENTRAL" || !row.locationId) return true;
    return String(row.locationId || "") === active;
  });
}
