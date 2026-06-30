import { isAdminOrSuperAdmin } from "../utils/adminAccess.js";

/** Menu codes always super-admin-only (even if DB/role grants view). */
export const FORCE_SUPER_ADMIN_CARD_CODES = new Set([
  "maintenance_purchase_requisition",
  "maintenance_goods_transfer_request_intra",
]);

function isSuperAdminOnlyCard(card) {
  if (card?.requiresAdmin) return false;
  return FORCE_SUPER_ADMIN_CARD_CODES.has(card.code) || !!card.requiresSuperAdmin;
}

/**
 * Hub landing cards — hidden catalog entries never appear on landing grids.
 * Super Admin manages visibility via Menu Setup; routes and permissions stay intact.
 *
 * @param {Array} cards
 * @param {{ isSuperAdmin: boolean, roles?: Array }} access
 */
export function applyHubLandingCardPolicy(cards, access) {
  const isSuperAdmin = !!access?.isSuperAdmin;
  const adminOk = isAdminOrSuperAdmin({
    isSuperAdmin,
    roles: access?.roles || [],
  });

  return (cards || [])
    .filter((card) => {
      if (card.isHidden) return false;
      if (card.requiresAdmin && !adminOk) return false;
      if (isSuperAdminOnlyCard(card) && !isSuperAdmin) return false;
      return true;
    })
    .map((card) => {
      if (card.requiresAdmin) {
        return { ...card, requiresSuperAdmin: false, isHidden: false, variant: "" };
      }
      if (!isSuperAdminOnlyCard(card)) {
        return { ...card, isHidden: false, variant: "" };
      }
      return { ...card, variant: "" };
    });
}

/** Whether tile should use super-admin hidden chrome (red dotted border). */
export function shouldShowSuperAdminHiddenChrome(card, isSuperAdmin) {
  if (!isSuperAdmin || !card || card.requiresAdmin) return false;
  return isSuperAdminOnlyCard(card);
}
