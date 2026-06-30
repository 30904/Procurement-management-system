/** @typedef {'full' | 'view' | 'none'} AccessLevel */

/**
 * @param {{ view?: boolean, edit?: boolean } | undefined} flags
 * @returns {AccessLevel}
 */
export function flagsToAccessLevel(flags) {
  if (!flags) return "none";
  if (flags.view && flags.edit) return "full";
  if (flags.view) return "view";
  return "none";
}

/**
 * @param {AccessLevel} level
 * @returns {{ businessFunction: string, view: boolean, edit: boolean }}
 */
export function accessLevelToPermission(code, level) {
  if (level === "none") return null;
  return {
    businessFunction: code,
    view: true,
    edit: level === "full",
  };
}

/**
 * Build Role.permissions from sidebar + card access maps.
 * Preserves permissions for codes not in the managed catalog.
 *
 * @param {Record<string, AccessLevel>} sidebarAccess
 * @param {Record<string, AccessLevel>} cardAccess
 * @param {string[]} catalogCodes
 * @param {Array<{ businessFunction?: string, view?: boolean, edit?: boolean }>} existingPermissions
 */
export function buildRolePermissions(
  sidebarAccess,
  cardAccess,
  catalogCodes,
  existingPermissions = []
) {
  const managed = new Set(catalogCodes);
  const kept = (existingPermissions || []).filter((p) => {
    const code = p.businessFunction;
    return code && !managed.has(code);
  });

  const next = [...kept];

  const pushLevel = (code, level) => {
    const row = accessLevelToPermission(code, level);
    if (row) next.push(row);
  };

  for (const [code, level] of Object.entries(sidebarAccess)) {
    if (!managed.has(code)) continue;
    pushLevel(code, level);
  }

  for (const [code, level] of Object.entries(cardAccess)) {
    if (!managed.has(code)) continue;
    pushLevel(code, level);
  }

  return next;
}

/**
 * @param {Array<{ businessFunction?: string, view?: boolean, edit?: boolean }>} permissions
 * @returns {Record<string, AccessLevel>}
 */
export function permissionsToAccessMap(permissions) {
  const map = {};
  for (const p of permissions || []) {
    const code = p.businessFunction;
    if (!code) continue;
    map[code] = flagsToAccessLevel(p);
  }
  return map;
}

/**
 * If any child card has access, ensure parent sidebar has at least view.
 *
 * @param {Record<string, AccessLevel>} sidebarAccess
 * @param {Record<string, AccessLevel>} cardAccess
 * @param {Record<string, Array<{ code: string }>>} cardsByParent
 */
export function syncParentAccessFromChildren(sidebarAccess, cardAccess, cardsByParent) {
  const next = { ...sidebarAccess };
  for (const [parentCode, cards] of Object.entries(cardsByParent)) {
    const childLevels = cards.map((c) => cardAccess[c.code] || "none");
    const best = childLevels.includes("full")
      ? "full"
      : childLevels.includes("view")
        ? "view"
        : "none";
    if (best !== "none") {
      const current = next[parentCode] || "none";
      if (current === "none") next[parentCode] = best;
      else if (best === "full" && current === "view") next[parentCode] = "full";
    }
  }
  return next;
}
