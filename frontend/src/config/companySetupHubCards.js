/** Canonical Company Setup hub cards (merged with API when a row is missing). */
export const COMPANY_SETUP_HUB_CARDS = [
  {
    code: "company_setup",
    label: "Company",
    description: "Company profile and organization settings",
    segment: "configuration/company",
    sequence: 10,
    iconKey: "company_setup",
  },
  {
    code: "location_master",
    label: "Location Master",
    description: "Manage business locations and GSTIN",
    segment: "configuration/location-master",
    sequence: 20,
    iconKey: "location_master",
  },
  {
    code: "sub_locations",
    label: "Sub Location Master",
    description: "Manage sub-locations under parent locations",
    segment: "configuration/sub-locations",
    sequence: 30,
    iconKey: "sub_locations",
  },
  {
    code: "inventory_stores",
    label: "Inventory Stores",
    description: "Manage stock-holding stores per location",
    segment: "configuration/inventory-stores",
    sequence: 40,
    iconKey: "stores",
  },
];

/**
 * Ensures all four Company Setup cards appear when the user may access them.
 * @param {Array} apiCards
 * @param {(code: string) => object|undefined} checkPermission
 * @param {boolean} isSuperAdmin
 */
export function mergeCompanySetupHubCards(apiCards, checkPermission, isSuperAdmin) {
  const byCode = new Map((apiCards || []).map((c) => [c.code, c]));

  for (const def of COMPANY_SETUP_HUB_CARDS) {
    if (byCode.has(def.code)) continue;
    const perm = checkPermission(def.code);
    const canShow =
      isSuperAdmin || perm?.enabled || perm?.restricted || perm?.view;
    if (!canShow) continue;
    byCode.set(def.code, {
      ...def,
      menuType: "landing_card",
      permission: perm || { enabled: isSuperAdmin, view: true, edit: isSuperAdmin },
      disabled: false,
      isHidden: false,
      requiresSuperAdmin: false,
      variant: "",
    });
  }

  return COMPANY_SETUP_HUB_CARDS.map((def) => byCode.get(def.code)).filter(Boolean);
}
