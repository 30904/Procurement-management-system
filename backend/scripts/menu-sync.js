/**
 * Sync MongoDB MenuItem collection to the framework catalog in menu-catalog.js.
 * Removes legacy/orphan rows and resets active/hidden flags for catalog entries.
 */
import { MenuItem } from "../src/models/MenuItem.model.js";
import { Role } from "../src/models/Role.model.js";
import {
  buildMenuCatalog,
  LEGACY_ACCOUNTS_MENU_CODES,
  buildRolePermissions,
} from "./menu-catalog.js";

export async function syncMenuCatalogForCompany(companyId) {
  const catalog = buildMenuCatalog(companyId);
  const catalogCodes = catalog.map((row) => row.code);

  const menuDocs = [];
  for (const row of catalog) {
    const payload = {
      ...row,
      isActive: row.isActive !== undefined ? row.isActive : true,
      isHidden: row.isHidden !== undefined ? row.isHidden : false,
      disabled: row.disabled !== undefined ? row.disabled : false,
    };
    const doc = await MenuItem.findOneAndUpdate(
      { company: companyId, code: row.code },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    menuDocs.push(doc);
  }

  const removed = await MenuItem.deleteMany({
    company: companyId,
    code: { $nin: catalogCodes },
  });

  const superPerms = buildRolePermissions(menuDocs, "super");
  const adminPerms = buildRolePermissions(menuDocs, "admin");
  await Role.updateOne(
    { company: companyId, roleName: "SUPER_ADMIN" },
    { $set: { permissions: superPerms } }
  );
  await Role.updateOne(
    { company: companyId, roleName: "ADMIN" },
    { $set: { permissions: adminPerms } }
  );

  return {
    menuCount: menuDocs.length,
    removedCount: removed.deletedCount ?? 0,
    legacyCodes: LEGACY_ACCOUNTS_MENU_CODES,
  };
}
