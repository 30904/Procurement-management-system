import { MenuItem } from "../models/MenuItem.model.js";
import { MenuIcon } from "../models/MenuIcon.model.js";
import { Role } from "../models/Role.model.js";
import { AppError } from "../utils/AppError.js";
import { attachMenuPermissions } from "./rbac.service.js";
import { isAllowedMenuIconKey } from "./menuIcon.service.js";

const PROTECTED_SIDEBAR_CODES = new Set(["dashboard", "applications", "support"]);

const ROUTE_SEGMENT_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

function normalizeRouteSegment(raw) {
  return String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+/g, "/");
}

const SIDEBAR_ICON_KEYS = [
  ["leads_npd", "leads_npd_active"],
  ["planning", "planning_active"],
  ["sales", "sales_active"],
  ["purchase", "purchase_active"],
  ["stores", "stores_active"],
  ["production", "production_active"],
  ["maintenance", "maintenance_active"],
  ["quality", "quality_active"],
  ["dispatch", "dispatch_active"],
  ["hrm", "hrm_active"],
  ["accounts", "accounts_active"],
  ["finance", "finance_active"],
  ["reports", "reports_active"],
  ["settings", "settings_active"],
  ["applications", "applications_active"],
  ["menu", "menu_active"],
  ["masters", "masters_active"],
  ["support", "support_active"],
  ["dashboard", "dashboard_active"],
  ["menu", "menu_active"],
];

export async function resolveIconKeysFromPayload(companyId, payload) {
  const raw = String(payload?.iconKey ?? "").trim();
  if (!raw) {
    const iconIndex = 0;
    const [iconKey, activeIconKey] = SIDEBAR_ICON_KEYS[iconIndex % SIDEBAR_ICON_KEYS.length];
    return { iconKey, activeIconKey };
  }
  const allowed = await isAllowedMenuIconKey(companyId, raw);
  if (!allowed) {
    throw new AppError("Invalid menu icon", 400, "VALIDATION_ERROR");
  }
  return { iconKey: raw, activeIconKey: `${raw}_active` };
}

async function enrichRowsWithCustomIcons(companyId, rows) {
  const keys = [...new Set(rows.map((r) => r.iconKey).filter(Boolean))];
  if (!keys.length) return rows;

  const custom = await MenuIcon.find({
    company: companyId,
    code: { $in: keys },
  }).lean();
  const map = new Map(custom.map((c) => [c.code, c]));

  return rows.map((row) => {
    const hit = map.get(row.iconKey);
    if (!hit) return row;
    return {
      ...row,
      iconUrl: hit.iconUrl,
      activeIconUrl: hit.activeIconUrl,
    };
  });
}

function fullPermissionFlags() {
  return {
    create: true,
    edit: true,
    view: true,
    approve: true,
    cancel: true,
    delete: true,
    reportGenerated: true,
    acknowledgment: true,
    download: true,
  };
}

async function appendPermissionsForMenus(companyId, menuDocs) {
  if (!menuDocs.length) return;
  const roles = await Role.find({ company: companyId });
  await Promise.all(
    roles.map(async (role) => {
      const existing = new Set(
        (role.permissions || []).map((p) => p.businessFunction).filter(Boolean)
      );
      let changed = false;
      for (const doc of menuDocs) {
        if (existing.has(doc.code)) continue;
        role.permissions.push({
          menuItemId: doc._id,
          businessFunction: doc.code,
          ...fullPermissionFlags(),
        });
        existing.add(doc.code);
        changed = true;
      }
      if (changed) await role.save();
    })
  );
}

async function nextMenuSlot(companyId) {
  const rows = await MenuItem.find({
    company: companyId,
    code: /^menu_\d+$/,
  })
    .select("code sequence menuType")
    .lean();

  let maxNum = 0;
  for (const row of rows) {
    const match = /^menu_(\d+)$/.exec(row.code);
    if (match) maxNum = Math.max(maxNum, Number(match[1]));
  }
  const n = maxNum + 1;
  return { code: `menu_${n}`, segment: `menu-${n}` };
}

async function nextSequenceForType(companyId, menuType) {
  const last = await MenuItem.findOne({ company: companyId, menuType })
    .sort({ sequence: -1 })
    .select("sequence")
    .lean();
  return (last?.sequence ?? 0) + 10;
}

function baseMenuFilter(companyId, menuType) {
  return {
    company: companyId,
    menuType,
    isActive: true,
    isHidden: false,
  };
}

function toNavItem(doc) {
  return {
    _id: doc._id,
    code: doc.code,
    label: doc.label,
    description: doc.description || "",
    segment: doc.segment || "",
    parentCode: doc.parentCode || null,
    menuType: doc.menuType,
    sequence: doc.sequence ?? 0,
    iconKey: doc.iconKey || "",
    activeIconKey: doc.activeIconKey || "",
    iconUrl: doc.iconUrl || null,
    activeIconUrl: doc.activeIconUrl || null,
    isEssential: !!doc.isEssential,
    isHidden: !!doc.isHidden,
    requiresSuperAdmin: !!doc.requiresSuperAdmin,
    variant: doc.variant || "",
    disabled: !!doc.disabled,
    disabledHint: doc.disabledHint || "",
    permission: doc.permission,
  };
}

/**
 * Sidebar navigation filtered by RBAC and visibility flags.
 */
export async function getSidebarNavigation(companyId, rbac) {
  const [mainRows, bottomRows] = await Promise.all([
    MenuItem.find(baseMenuFilter(companyId, "sidebar_main")).sort({ sequence: 1 }).lean(),
    MenuItem.find(baseMenuFilter(companyId, "sidebar_bottom")).sort({ sequence: 1 }).lean(),
  ]);

  const [mainEnriched, bottomEnriched] = await Promise.all([
    enrichRowsWithCustomIcons(companyId, mainRows),
    enrichRowsWithCustomIcons(companyId, bottomRows),
  ]);

  const main = attachMenuPermissions(mainEnriched, rbac)
    .filter((r) => r.permission.enabled || r.permission.restricted || r.isEssential)
    .map(toNavItem);

  const bottom = attachMenuPermissions(bottomEnriched, rbac)
    .filter((r) => r.permission.enabled || r.permission.restricted || r.isEssential)
    .map(toNavItem);

  const flyoutRows = await MenuItem.find({
    ...baseMenuFilter(companyId, "flyout_item"),
    parentCode: "applications",
  })
    .sort({ sequence: 1 })
    .lean();

  const flyoutEnriched = await enrichRowsWithCustomIcons(companyId, flyoutRows);
  const applicationsFlyout = attachMenuPermissions(flyoutEnriched, rbac)
    .filter((r) => r.permission.enabled || r.permission.restricted || r.isEssential)
    .map(toNavItem);

  return { main, bottom, applicationsFlyout };
}

/**
 * Landing hub cards for a parent menu code (e.g. masters, configuration).
 */
export async function getLandingCards(companyId, parentCode, rbac) {
  const isSA = !!rbac?.isSuperAdmin;

  const filter = {
    company: companyId,
    menuType: { $in: ["landing_card", "card_group"] },
    parentCode,
    isActive: true,
    isHidden: false,
  };

  const rows = await MenuItem.find(filter)
    .sort({ sequence: 1, label: 1 })
    .lean();

  return attachMenuPermissions(rows, rbac)
    .filter((r) => {
      if (isSA) return true;
      if (r.requiresSuperAdmin) return false;
      return r.permission.enabled || r.permission.restricted || r.isEssential;
    })
    .map(toNavItem);
}

/**
 * Hub metadata for a segment path (landing page header).
 */
export async function getHubBySegment(companyId, segment, rbac) {
  const hub = await MenuItem.findOne({
    company: companyId,
    segment,
    menuType: { $in: ["sidebar_main", "sidebar_bottom", "page"] },
    isActive: true,
  }).lean();

  if (!hub) return null;

  const [enriched] = attachMenuPermissions([hub], rbac);
  const children = await getLandingCards(companyId, hub.code, rbac);
  return { hub: toNavItem(enriched), children };
}

async function pruneRolePermissionsForCodes(companyId, deletedCodes) {
  if (!deletedCodes.length) return;
  const codeSet = new Set(deletedCodes);
  const roles = await Role.find({ company: companyId });
  await Promise.all(
    roles.map(async (role) => {
      const next = (role.permissions || []).filter(
        (p) => !codeSet.has(p.businessFunction)
      );
      if (next.length !== (role.permissions || []).length) {
        role.permissions = next;
        await role.save();
      }
    })
  );
}

/**
 * Creates a sidebar menu with optional default module landing cards.
 */
export async function createSidebarMenuWithModules(companyId, payload) {
  const label = String(payload?.label ?? "").trim();
  if (!label) {
    throw new AppError("Menu label is required", 400, "VALIDATION_ERROR");
  }

  const menuType =
    payload?.menuType === "sidebar_bottom" ? "sidebar_bottom" : "sidebar_main";

  const moduleCount = Math.min(
    12,
    Math.max(0, Number(payload?.moduleCount ?? 4) || 0)
  );

  const { code, segment: defaultSegment } = await nextMenuSlot(companyId);
  const duplicateCode = await MenuItem.findOne({ company: companyId, code });
  if (duplicateCode) {
    throw new AppError("Menu code already exists", 409, "DUPLICATE_CODE");
  }

  const segment = normalizeRouteSegment(payload?.segment ?? defaultSegment);
  if (!segment) {
    throw new AppError("Route is required", 400, "VALIDATION_ERROR");
  }
  if (!ROUTE_SEGMENT_PATTERN.test(segment)) {
    throw new AppError(
      "Route may only contain lowercase letters, numbers, and hyphens",
      400,
      "VALIDATION_ERROR"
    );
  }

  const duplicateSegment = await MenuItem.findOne({ company: companyId, segment });
  if (duplicateSegment) {
    throw new AppError("A menu with this route already exists", 409, "DUPLICATE_SEGMENT");
  }

  const iconIndex =
    (await MenuItem.countDocuments({
      company: companyId,
      menuType: "sidebar_main",
      code: /^menu_\d+$/,
    })) % SIDEBAR_ICON_KEYS.length;
  const fallbackIcons = SIDEBAR_ICON_KEYS[iconIndex % SIDEBAR_ICON_KEYS.length];
  const { iconKey, activeIconKey } = payload?.iconKey
    ? await resolveIconKeysFromPayload(companyId, payload)
    : { iconKey: fallbackIcons[0], activeIconKey: fallbackIcons[1] };

  const sequence =
    payload?.sequence !== undefined && payload?.sequence !== null && payload?.sequence !== ""
      ? Number(payload.sequence)
      : await nextSequenceForType(companyId, menuType);
  if (!Number.isFinite(sequence) || sequence < 0) {
    throw new AppError("Sequence must be a non-negative number", 400, "VALIDATION_ERROR");
  }

  const menu = await MenuItem.create({
    company: companyId,
    code,
    label,
    description: String(payload?.description ?? "").trim(),
    segment,
    menuType,
    sequence,
    isActive: true,
    isHidden: false,
    iconKey,
    activeIconKey,
    isEssential: false,
  });

  const modules = [];
  for (let m = 1; m <= moduleCount; m += 1) {
    const moduleDoc = await MenuItem.create({
      company: companyId,
      code: `${code}_module_${m}`,
      label: `Module ${m}`,
      description: `Sub-module ${m} for ${label}`,
      segment: `${segment}/module-${m}`,
      parentCode: code,
      menuType: "landing_card",
      sequence: m * 10,
      isActive: true,
      isHidden: false,
    });
    modules.push(moduleDoc);
  }

  await appendPermissionsForMenus(companyId, [menu, ...modules]);

  return {
    menu: menu.toObject(),
    modulesCreated: modules.length,
    modules: modules.map((d) => d.toObject()),
  };
}

/**
 * Deletes a sidebar menu and all landing_card rows whose parentCode matches.
 */
export async function deleteSidebarMenuWithModules(companyId, menuId) {
  const menu = await MenuItem.findOne({ _id: menuId, company: companyId });
  if (!menu) {
    throw new AppError("Menu item not found", 404, "NOT_FOUND");
  }

  if (!["sidebar_main", "sidebar_bottom"].includes(menu.menuType)) {
    throw new AppError("Only sidebar menus can be deleted from Menu Setup", 400, "INVALID_MENU_TYPE");
  }

  if (menu.isEssential || PROTECTED_SIDEBAR_CODES.has(menu.code)) {
    throw new AppError("This menu is protected and cannot be deleted", 400, "MENU_PROTECTED");
  }

  const childRows = await MenuItem.find({
    company: companyId,
    parentCode: menu.code,
  })
    .select("code menuType")
    .lean();

  const deletedCodes = [menu.code, ...childRows.map((c) => c.code)];

  const deleteResult = await MenuItem.deleteMany({
    company: companyId,
    $or: [{ _id: menu._id }, { parentCode: menu.code }],
  });

  await pruneRolePermissionsForCodes(companyId, deletedCodes);

  return {
    deletedMenu: {
      id: menu._id,
      code: menu.code,
      label: menu.label,
    },
    modulesRemoved: childRows.length,
    totalRemoved: deleteResult.deletedCount ?? 0,
    deletedCodes,
  };
}

/**
 * Deletes a single landing card (module) from Modules Setup.
 */
export async function deleteLandingCard(companyId, menuId) {
  const card = await MenuItem.findOne({ _id: menuId, company: companyId });
  if (!card) {
    throw new AppError("Menu item not found", 404, "NOT_FOUND");
  }
  if (!["landing_card", "card_group"].includes(card.menuType)) {
    throw new AppError("Only module cards or groups can be deleted from Modules Setup", 400, "INVALID_MENU_TYPE");
  }
  if (card.isEssential) {
    throw new AppError("This module is protected and cannot be deleted", 400, "MENU_PROTECTED");
  }

  const deletedCodes = [card.code];

  if (card.menuType === "card_group") {
    const children = await MenuItem.find({
      company: companyId,
      parentCode: card.code,
    }).select("code").lean();
    deletedCodes.push(...children.map((c) => c.code));
    await MenuItem.deleteMany({ company: companyId, parentCode: card.code });
  }

  await MenuItem.deleteOne({ _id: card._id });
  await pruneRolePermissionsForCodes(companyId, deletedCodes);

  return {
    deletedModule: {
      id: card._id,
      code: card.code,
      label: card.label,
      parentCode: card.parentCode,
    },
    childrenRemoved: deletedCodes.length - 1,
  };
}

/**
 * Creates a card_group under a sidebar parent and optionally creates child cards.
 */
export async function createCardGroup(companyId, payload) {
  const label = String(payload?.label ?? "").trim();
  if (!label) {
    throw new AppError("Group label is required", 400, "VALIDATION_ERROR");
  }

  const parentCode = String(payload?.parentCode ?? "").trim();
  if (!parentCode) {
    throw new AppError("Parent menu code is required", 400, "VALIDATION_ERROR");
  }

  const parent = await MenuItem.findOne({
    company: companyId,
    code: parentCode,
    menuType: { $in: ["sidebar_main", "sidebar_bottom"] },
  });
  if (!parent) {
    throw new AppError("Parent sidebar menu not found", 404, "NOT_FOUND");
  }

  const code = String(payload?.code ?? "").trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
  if (!code) {
    throw new AppError("Group code is required", 400, "VALIDATION_ERROR");
  }

  const existing = await MenuItem.findOne({ company: companyId, code });
  if (existing) {
    throw new AppError(`Code "${code}" already exists`, 409, "DUPLICATE_CODE");
  }

  const segment = normalizeRouteSegment(
    payload?.segment ?? `${parent.segment}/${code.replace(/_/g, "-")}`
  );
  if (!segment) {
    throw new AppError("Route segment is required", 400, "VALIDATION_ERROR");
  }

  const duplicateSegment = await MenuItem.findOne({ company: companyId, segment });
  if (duplicateSegment) {
    throw new AppError("A menu with this route already exists", 409, "DUPLICATE_SEGMENT");
  }

  const sequence = payload?.sequence !== undefined
    ? Number(payload.sequence)
    : await nextSequenceForType(companyId, "card_group");

  const group = await MenuItem.create({
    company: companyId,
    code,
    label,
    description: String(payload?.description ?? "").trim(),
    segment,
    parentCode,
    menuType: "card_group",
    sequence,
    isActive: true,
    isHidden: false,
  });

  await appendPermissionsForMenus(companyId, [group]);

  return { group: group.toObject() };
}

/**
 * Moves a landing_card into (or out of) a card_group by updating its parentCode.
 */
export async function assignCardToGroup(companyId, cardId, groupCode) {
  const card = await MenuItem.findOne({ _id: cardId, company: companyId });
  if (!card) {
    throw new AppError("Card not found", 404, "NOT_FOUND");
  }
  if (card.menuType !== "landing_card") {
    throw new AppError("Only landing cards can be assigned to groups", 400, "INVALID_MENU_TYPE");
  }

  if (groupCode) {
    const group = await MenuItem.findOne({
      company: companyId,
      code: groupCode,
      menuType: { $in: ["card_group", "sidebar_main", "sidebar_bottom"] },
    });
    if (!group) {
      throw new AppError("Target group not found", 404, "NOT_FOUND");
    }
  }

  card.parentCode = groupCode || card.parentCode;
  await card.save();

  return { card: card.toObject() };
}
