import { getToken } from "../utils/authStorage.js";
import { getActiveLocationId } from "../utils/activeLocationStorage.js";

export function getApiRoot() {
  const raw = String(import.meta.env.VITE_API_BASE_URL ?? "")
    .trim()
    .replace(/\/+$/, "");
  if (!raw) return "/api";
  if (raw === "/api" || /\/api$/i.test(raw)) return raw;
  return `${raw}/api`;
}

export async function apiFetch(path, options = {}) {
  const { skipAuth, headers: optionHeaders, ...rest } = options;
  const root = getApiRoot();
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${root}${p}`;

  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...optionHeaders,
  };
  if (token && !skipAuth) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (!skipAuth) {
    const activeLoc = getActiveLocationId();
    if (activeLoc) headers["X-Active-Location-Id"] = activeLoc;
  }

  const res = await fetch(url, { ...rest, headers });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "Request failed");
    err.status = res.status;
    err.code = data?.code;
    err.data = data;
    throw err;
  }
  return data;
}

export function getHealth() {
  return apiFetch("/health");
}

export function loginRequest(identifier, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
    skipAuth: true,
  });
}

export function getCurrentCompanyRequest() {
  return apiFetch("/company/current");
}

export function updateCurrentCompanyRequest(payload) {
  return apiFetch("/company/current", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getPublicApplicationBrandingRequest() {
  return apiFetch("/public/application-branding", { skipAuth: true });
}

export function getApplicationSettingsRequest() {
  return apiFetch("/company/application");
}

export function updateApplicationSettingsRequest(payload) {
  return apiFetch("/company/application", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function uploadApplicationAssetRequest(file, assetType) {
  const root = getApiRoot();
  const formData = new FormData();
  formData.append("file", file);
  formData.append("assetType", assetType);

  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${root}/company/application/upload`, {
    method: "POST",
    headers,
    body: formData,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "Upload failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function listLocationsRequest(q = "") {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  const qs = params.toString();
  return apiFetch(`/locations${qs ? `?${qs}` : ""}`);
}

export function getLocationSummaryRequest() {
  return apiFetch("/locations/summary");
}

export function getLocationByIdRequest(id) {
  return apiFetch(`/locations/${id}`);
}

export function createLocationRequest(payload) {
  return apiFetch("/locations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateLocationRequest(id, payload) {
  return apiFetch(`/locations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteLocationRequest(id) {
  return apiFetch(`/locations/${id}`, { method: "DELETE" });
}

export function listSubLocationsRequest(q = "", parentLocation = "") {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (parentLocation) params.set("parentLocation", parentLocation);
  const qs = params.toString();
  return apiFetch(`/sub-locations${qs ? `?${qs}` : ""}`);
}

export function getSubLocationSummaryRequest() {
  return apiFetch("/sub-locations/summary");
}

export function getSubLocationStatusSummaryRequest() {
  return apiFetch("/sub-locations/status-summary");
}

export function createSubLocationRequest(payload) {
  return apiFetch("/sub-locations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSubLocationRequest(id, payload) {
  return apiFetch(`/sub-locations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteSubLocationRequest(id) {
  return apiFetch(`/sub-locations/${id}`, { method: "DELETE" });
}

export function listUsersRequest() {
  return apiFetch("/users");
}

export function getProfileRequest() {
  return apiFetch("/users/profile");
}

export function updateProfileRequest(payload) {
  return apiFetch("/users/profile", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function changePasswordRequest(payload) {
  return apiFetch("/users/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createUserRequest(payload) {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUserRequest(id, payload) {
  return apiFetch(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteUserRequest(id) {
  return apiFetch(`/users/${id}`, { method: "DELETE" });
}

export function listUserSessionsRequest() {
  return apiFetch("/users/sessions");
}

export function listRolesRequest() {
  return apiFetch("/roles");
}

export function createRoleRequest(payload) {
  return apiFetch("/roles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getRoleRequest(id) {
  return apiFetch(`/roles/${id}`);
}

export function updateRoleRequest(id, payload) {
  return apiFetch(`/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getFrameworkSessionRequest() {
  return apiFetch("/framework/session");
}

export function getDashboardStatsRequest() {
  return apiFetch("/framework/dashboard-stats");
}

export function getDashboardCatalogRequest() {
  return apiFetch("/dashboard/catalog");
}

export function resolveDashboardRequest() {
  return apiFetch("/dashboard/resolve");
}

export function getPurchaseDashboardStatsRequest(locationId) {
  const qs = locationId ? `?locationId=${encodeURIComponent(locationId)}` : "";
  return apiFetch(`/dashboard/purchase-stats${qs}`);
}

export function listRoleDashboardMappingsRequest() {
  return apiFetch("/dashboard/role-mappings");
}

export function updateRoleDashboardMappingRequest(roleId, payload) {
  return apiFetch(`/dashboard/role-mappings/${roleId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getFrameworkLandingRequest(parentCode) {
  return apiFetch(`/framework/menus/landing/${encodeURIComponent(parentCode)}`);
}

export function listFrameworkMenuCatalogRequest() {
  return apiFetch("/framework/menus/catalog");
}

export function updateFrameworkMenuItemRequest(id, payload) {
  return apiFetch(`/framework/menus/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/** @param {"sidebar" | "module"} scope */
export function deleteFrameworkMenuItemRequest(id, scope = "sidebar") {
  const qs = scope === "module" ? "?scope=module" : "";
  return apiFetch(`/framework/menus/${id}${qs}`, {
    method: "DELETE",
  });
}

export function createFrameworkSidebarMenuRequest(payload) {
  return apiFetch("/framework/menus", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createFrameworkGroupRequest(payload) {
  return apiFetch("/framework/menus/groups", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function assignCardToGroupRequest(cardId, groupCode) {
  return apiFetch(`/framework/menus/${cardId}/assign`, {
    method: "PATCH",
    body: JSON.stringify({ groupCode }),
  });
}

export function listFrameworkMenuIconsRequest() {
  return apiFetch("/framework/menu-icons");
}

export async function uploadFrameworkMenuIconRequest({ label, code, iconFile, activeIconFile }) {
  const root = getApiRoot();
  const formData = new FormData();
  formData.append("label", label);
  if (code) formData.append("code", code);
  formData.append("iconFile", iconFile);
  if (activeIconFile) formData.append("activeIconFile", activeIconFile);

  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${root}/framework/menu-icons`, {
    method: "POST",
    headers,
    body: formData,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(data?.message || res.statusText || "Upload failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function deleteFrameworkMenuIconRequest(id) {
  return apiFetch(`/framework/menu-icons/${id}`, { method: "DELETE" });
}

// ── Master Data ──────────────────────────────────────────────

export function listMasterDataCategoriesRequest() {
  return apiFetch("/master-data/categories");
}

export function listMasterDataRequest(category) {
  const qs = category ? `?category=${encodeURIComponent(category)}` : "";
  return apiFetch(`/master-data${qs}`);
}

export function listMasterDataByCategoryRequest(category) {
  return apiFetch(`/master-data/by-category/${encodeURIComponent(category)}`);
}

export function getMasterDataNextSequenceRequest(category) {
  return apiFetch(`/master-data/next-sequence/${encodeURIComponent(category)}`);
}

export function createMasterDataRequest(payload) {
  return apiFetch("/master-data", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateMasterDataRequest(id, payload) {
  return apiFetch(`/master-data/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteMasterDataRequest(id) {
  return apiFetch(`/master-data/${id}`, { method: "DELETE" });
}

// ── Auto Increment ───────────────────────────────────────────

export function listAutoIncrementRequest() {
  return apiFetch("/auto-increment");
}

export function createAutoIncrementRequest(payload) {
  return apiFetch("/auto-increment", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAutoIncrementRequest(id, payload) {
  return apiFetch(`/auto-increment/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAutoIncrementRequest(id) {
  return apiFetch(`/auto-increment/${id}`, { method: "DELETE" });
}

export function listAutoIncrementRevisionsRequest(id, limit = 50) {
  return apiFetch(`/auto-increment/${id}/revisions?limit=${encodeURIComponent(limit)}`);
}

export function previewSupplierCodeRequest(categoryType) {
  const qs = `?categoryType=${encodeURIComponent(categoryType)}`;
  return apiFetch(`/auto-increment/preview/supplier-code${qs}`);
}

// ── HSN/P Master ─────────────────────────────────────────────

export function listHsnPMasterRequest() {
  return apiFetch("/hsn-p-master");
}

export function createHsnPMasterRequest(payload) {
  return apiFetch("/hsn-p-master", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateHsnPMasterRequest(id, payload) {
  return apiFetch(`/hsn-p-master/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteHsnPMasterRequest(id) {
  return apiFetch(`/hsn-p-master/${id}`, { method: "DELETE" });
}

export function listPaymentTermsMasterRequest() {
  return apiFetch("/payment-terms-master");
}

export function getNextPaymentTermsCodeRequest() {
  return apiFetch("/payment-terms-master/next-code");
}

export function createPaymentTermsMasterRequest(payload) {
  return apiFetch("/payment-terms-master", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePaymentTermsMasterRequest(id, payload) {
  return apiFetch(`/payment-terms-master/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deletePaymentTermsMasterRequest(id) {
  return apiFetch(`/payment-terms-master/${id}`, { method: "DELETE" });
}

// ── SAC/P Master ─────────────────────────────────────────────

export function listSacPMasterRequest() {
  return apiFetch("/sac-p-master");
}

export function createSacPMasterRequest(payload) {
  return apiFetch("/sac-p-master", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSacPMasterRequest(id, payload) {
  return apiFetch(`/sac-p-master/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteSacPMasterRequest(id) {
  return apiFetch(`/sac-p-master/${id}`, { method: "DELETE" });
}

// ── Supplier Master ──────────────────────────────────────────

export function listSupplierMasterRequest() {
  return apiFetch("/supplier-master");
}

export function getSupplierMasterRequest(id) {
  return apiFetch(`/supplier-master/${id}`);
}

export function createSupplierMasterRequest(payload) {
  return apiFetch("/supplier-master", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSupplierMasterRequest(id, payload) {
  return apiFetch(`/supplier-master/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteSupplierMasterRequest(id) {
  return apiFetch(`/supplier-master/${id}`, { method: "DELETE" });
}

// ── Prospect Supplier Master ─────────────────────────────────

export function listProspectSupplierMasterRequest() {
  return apiFetch("/prospect-supplier-master");
}

export function getProspectSupplierMasterRequest(id) {
  return apiFetch(`/prospect-supplier-master/${id}`);
}

export function previewProspectRegistrationNoRequest() {
  return apiFetch("/prospect-supplier-master/preview-registration");
}

export function createProspectSupplierMasterRequest(payload) {
  return apiFetch("/prospect-supplier-master", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateProspectSupplierMasterRequest(id, payload) {
  return apiFetch(`/prospect-supplier-master/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteProspectSupplierMasterRequest(id) {
  return apiFetch(`/prospect-supplier-master/${id}`, { method: "DELETE" });
}

export function convertProspectToSupplierRequest(id) {
  return apiFetch(`/prospect-supplier-master/${id}/convert-to-supplier`, {
    method: "POST",
  });
}

// ── Source List Master ───────────────────────────────────────

export function listSourceListMasterRequest() {
  return apiFetch("/source-list-master");
}

export function getSourceListMasterRequest(id) {
  return apiFetch(`/source-list-master/${id}`);
}

export function getNextSourceListCodeRequest() {
  return apiFetch("/source-list-master/next-code");
}

export function createSourceListMasterRequest(payload) {
  return apiFetch("/source-list-master", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSourceListMasterRequest(id, payload) {
  return apiFetch(`/source-list-master/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteSourceListMasterRequest(id) {
  return apiFetch(`/source-list-master/${id}`, { method: "DELETE" });
}

// ── Vendor Evaluation Master ─────────────────────────────────

export function listVendorEvaluationMasterRequest() {
  return apiFetch("/vendor-evaluation-master");
}

export function getVendorEvaluationMasterRequest(id) {
  return apiFetch(`/vendor-evaluation-master/${id}`);
}

export function getNextVendorEvaluationCodeRequest() {
  return apiFetch("/vendor-evaluation-master/next-code");
}

export function createVendorEvaluationMasterRequest(payload) {
  return apiFetch("/vendor-evaluation-master", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateVendorEvaluationMasterRequest(id, payload) {
  return apiFetch(`/vendor-evaluation-master/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteVendorEvaluationMasterRequest(id) {
  return apiFetch(`/vendor-evaluation-master/${id}`, { method: "DELETE" });
}

export function previewLogisticsCodeRequest(categoryType) {
  const qs = categoryType ? `?categoryType=${encodeURIComponent(categoryType)}` : "";
  return apiFetch(`/auto-increment/preview/logistics-code${qs}`);
}

export function previewServiceCodeRequest(categoryType) {
  const qs = categoryType ? `?categoryType=${encodeURIComponent(categoryType)}` : "";
  return apiFetch(`/auto-increment/preview/service-code${qs}`);
}

export function previewItemCodeRequest(categoryType) {
  const qs = categoryType ? `?categoryType=${encodeURIComponent(categoryType)}` : "";
  return apiFetch(`/auto-increment/preview/item-code${qs}`);
}

export function previewAssetCodeRequest(categoryType) {
  const qs = categoryType ? `?categoryType=${encodeURIComponent(categoryType)}` : "";
  return apiFetch(`/auto-increment/preview/asset-code${qs}`);
}

// ── Logistics Master ─────────────────────────────────────────

export function listLogisticsMasterRequest() {
  return apiFetch("/logistics-master");
}

export function getLogisticsMasterRequest(id) {
  return apiFetch(`/logistics-master/${id}`);
}

export function createLogisticsMasterRequest(payload) {
  return apiFetch("/logistics-master", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateLogisticsMasterRequest(id, payload) {
  return apiFetch(`/logistics-master/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteLogisticsMasterRequest(id) {
  return apiFetch(`/logistics-master/${id}`, { method: "DELETE" });
}

// ── Service Master ───────────────────────────────────────────

export function listServiceMasterRequest() {
  return apiFetch("/service-master");
}

export function getServiceMasterRequest(id) {
  return apiFetch(`/service-master/${id}`);
}

export function createServiceMasterRequest(payload) {
  return apiFetch("/service-master", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateServiceMasterRequest(id, payload) {
  return apiFetch(`/service-master/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteServiceMasterRequest(id) {
  return apiFetch(`/service-master/${id}`, { method: "DELETE" });
}

export function previewServiceR1CodeRequest(categoryType) {
  const qs = categoryType ? `?categoryType=${encodeURIComponent(categoryType)}` : "";
  return apiFetch(`/auto-increment/preview/service-r1-code${qs}`);
}

// ── Service Master R1 ────────────────────────────────────────

export function listServiceMasterR1Request() {
  return apiFetch("/service-master-r1");
}

export function getServiceMasterR1Request(id) {
  return apiFetch(`/service-master-r1/${id}`);
}

export function createServiceMasterR1Request(payload) {
  return apiFetch("/service-master-r1", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateServiceMasterR1Request(id, payload) {
  return apiFetch(`/service-master-r1/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteServiceMasterR1Request(id) {
  return apiFetch(`/service-master-r1/${id}`, { method: "DELETE" });
}

// ── Item Master ──────────────────────────────────────────────

export function listItemMasterRequest() {
  return apiFetch("/item-master");
}

export function getItemMasterRequest(id) {
  return apiFetch(`/item-master/${id}`);
}

export function createItemMasterRequest(payload) {
  return apiFetch("/item-master", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateItemMasterRequest(id, payload) {
  return apiFetch(`/item-master/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteItemMasterRequest(id) {
  return apiFetch(`/item-master/${id}`, { method: "DELETE" });
}

// ── Item Inventory Levels (Planning INL) ─────────────────────

export function listItemInventoryLevelsRequest(querySuffix = "") {
  return apiFetch(`/item-inventory-levels${querySuffix}`);
}

export function getItemInventoryLevelStatusSummaryRequest() {
  return apiFetch("/item-inventory-levels/status-summary");
}

export function getItemInventoryLevelRequest(id) {
  return apiFetch(`/item-inventory-levels/${id}`);
}

export function previewItemInventoryLevelsRequest(payload) {
  return apiFetch("/item-inventory-levels/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function saveItemInventoryLevelsRequest(id, payload) {
  return apiFetch(`/item-inventory-levels/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function saveItemInventoryLevelDualUnitRequest(id, payload) {
  return apiFetch(`/item-inventory-levels/${id}/dual-unit`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function downloadItemMasterUploadTemplateRequest() {
  const token = getToken();
  const root = getApiRoot();
  const res = await fetch(`${root}/item-master/upload/template`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = { message: text };
    }
    const err = new Error(data?.message || "Download failed");
    err.data = data;
    throw err;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Material_Master_Upload_Template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function uploadItemMasterFileRequest(file) {
  const formData = new FormData();
  formData.append("file", file);

  const token = getToken();
  const root = getApiRoot();
  const res = await fetch(`${root}/item-master/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const err = new Error(data?.message || "Upload failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function getItemApplicableConfigRequest(itemCategory) {
  const qs = itemCategory ? `?itemCategory=${encodeURIComponent(itemCategory)}` : "";
  return apiFetch(`/item-master/config/applicable${qs}`);
}

export function getItemAttributeValuesRequest(itemId) {
  return apiFetch(`/item-master/${itemId}/attribute-values`);
}

export function saveItemAttributeValuesRequest(itemId, values) {
  return apiFetch(`/item-master/${itemId}/attribute-values`, {
    method: "PUT",
    body: JSON.stringify({ values }),
  });
}

export function getItemComplianceRequest(itemId) {
  return apiFetch(`/item-master/${itemId}/compliance`);
}

// ── Item Document Types ──────────────────────────────────────

export function listItemDocumentTypesRequest() {
  return apiFetch("/item-document-types");
}

export function createItemDocumentTypeRequest(payload) {
  return apiFetch("/item-document-types", { method: "POST", body: JSON.stringify(payload) });
}

export function updateItemDocumentTypeRequest(id, payload) {
  return apiFetch(`/item-document-types/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteItemDocumentTypeRequest(id) {
  return apiFetch(`/item-document-types/${id}`, { method: "DELETE" });
}

// ── Item Attribute Definitions ───────────────────────────────

export function listItemAttributeDefinitionsRequest() {
  return apiFetch("/item-attribute-definitions");
}

export function createItemAttributeDefinitionRequest(payload) {
  return apiFetch("/item-attribute-definitions", { method: "POST", body: JSON.stringify(payload) });
}

export function updateItemAttributeDefinitionRequest(id, payload) {
  return apiFetch(`/item-attribute-definitions/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteItemAttributeDefinitionRequest(id) {
  return apiFetch(`/item-attribute-definitions/${id}`, { method: "DELETE" });
}

// ── Asset Master ─────────────────────────────────────────────

export function listAssetMasterRequest() {
  return apiFetch("/asset-master");
}

export function getAssetMasterRequest(id) {
  return apiFetch(`/asset-master/${id}`);
}

export function createAssetMasterRequest(payload) {
  return apiFetch("/asset-master", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAssetMasterRequest(id, payload) {
  return apiFetch(`/asset-master/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAssetMasterRequest(id) {
  return apiFetch(`/asset-master/${id}`, { method: "DELETE" });
}

export function listItemSupplierLinksRequest(itemId) {
  return apiFetch(`/item-master/${itemId}/suppliers`);
}

export function listSupplierLinkedItemsRequest(supplierId) {
  return apiFetch(`/item-master/by-supplier/${encodeURIComponent(supplierId)}/items`);
}

/** Items linked to a supplier (job work / PO line pickers). */
export function listItemMasterBySupplierRequest(supplierId) {
  return listSupplierLinkedItemsRequest(supplierId);
}

export function createItemSupplierLinkRequest(itemId, payload) {
  return apiFetch(`/item-master/${itemId}/suppliers`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateItemSupplierLinkRequest(itemId, linkId, payload) {
  return apiFetch(`/item-master/${itemId}/suppliers/${linkId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteItemSupplierLinkRequest(itemId, linkId) {
  return apiFetch(`/item-master/${itemId}/suppliers/${linkId}`, { method: "DELETE" });
}

// ── Notifications ────────────────────────────────────────────

export function listNotificationsRequest({ limit, offset, unreadOnly } = {}) {
  const params = new URLSearchParams();
  if (limit) params.set("limit", limit);
  if (offset) params.set("offset", offset);
  if (unreadOnly) params.set("unreadOnly", "true");
  const qs = params.toString();
  return apiFetch(`/notifications${qs ? `?${qs}` : ""}`);
}

export function getUnreadCountRequest() {
  return apiFetch("/notifications/unread-count");
}

export function markNotificationReadRequest(id) {
  return apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
}

export function markAllNotificationsReadRequest() {
  return apiFetch("/notifications/read-all", { method: "PATCH" });
}

export function createNotificationRequest(payload) {
  return apiFetch("/notifications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function broadcastNotificationRequest(payload) {
  return apiFetch("/notifications/broadcast", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteNotificationRequest(id) {
  return apiFetch(`/notifications/${id}`, { method: "DELETE" });
}

export function clearAllNotificationsRequest() {
  return apiFetch("/notifications/clear-all", { method: "DELETE" });
}

// ── Email Config ─────────────────────────────────────────────

export function getEmailConfigRequest() {
  return apiFetch("/email/config");
}

export function saveEmailConfigRequest(payload) {
  return apiFetch("/email/config", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function sendTestEmailRequest(payload) {
  return apiFetch("/email/test", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listEmailTemplatesRequest() {
  return apiFetch("/email/templates");
}

export function sendTemplatedEmailRequest(payload) {
  return apiFetch("/email/send-template", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/* ── Audit Logs ── */

export function listAuditLogsRequest(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  }
  const q = qs.toString();
  return apiFetch(`/audit-logs${q ? `?${q}` : ""}`);
}

export function getAuditModelNamesRequest() {
  return apiFetch("/audit-logs/model-names");
}

export function deleteAuditLogRequest(id) {
  return apiFetch(`/audit-logs/${id}`, { method: "DELETE" });
}

export function bulkDeleteAuditLogsRequest(payload) {
  return apiFetch("/audit-logs/bulk-delete", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function clearAllAuditLogsRequest() {
  return apiFetch("/audit-logs/clear-all", { method: "DELETE" });
}

/* ── CSV Import ── */

export function listCsvProfilesRequest() {
  return apiFetch("/csv-import/profiles");
}

export function getCsvTemplateUrl(profileKey) {
  return `${getApiRoot()}/csv-import/template/${profileKey}`;
}

export async function parseCsvUploadRequest(file, profileKey) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("profile", profileKey);

  const token = (await import("../utils/authStorage.js")).getToken();
  const root = getApiRoot();
  const res = await fetch(`${root}/csv-import/parse`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error(data?.message || "Parse failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function executeCsvImportRequest(profileKey, rows) {
  return apiFetch("/csv-import/import", {
    method: "POST",
    body: JSON.stringify({ profile: profileKey, rows }),
  });
}

/* ── File Upload ── */

export function listFileCategoriesRequest() {
  return apiFetch("/files/categories");
}

export function listFilesRequest(params = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  }
  const q = qs.toString();
  return apiFetch(`/files${q ? `?${q}` : ""}`);
}

export function getFileRequest(id) {
  return apiFetch(`/files/${id}`);
}

export async function uploadFileRequest(file, meta = {}) {
  const formData = new FormData();
  formData.append("file", file);
  if (meta.category) formData.append("category", meta.category);
  if (meta.description) formData.append("description", meta.description);
  if (meta.entityType) formData.append("entityType", meta.entityType);
  if (meta.entityId) formData.append("entityId", meta.entityId);
  if (meta.documentTypeCode) formData.append("documentTypeCode", meta.documentTypeCode);

  const token = (await import("../utils/authStorage.js")).getToken();
  const root = getApiRoot();
  const res = await fetch(`${root}/files/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error(data?.message || "Upload failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export async function uploadMultipleFilesRequest(files, meta = {}) {
  const formData = new FormData();
  for (const f of files) formData.append("files", f);
  if (meta.category) formData.append("category", meta.category);
  if (meta.description) formData.append("description", meta.description);
  if (meta.entityType) formData.append("entityType", meta.entityType);
  if (meta.entityId) formData.append("entityId", meta.entityId);
  if (meta.documentTypeCode) formData.append("documentTypeCode", meta.documentTypeCode);

  const token = (await import("../utils/authStorage.js")).getToken();
  const root = getApiRoot();
  const res = await fetch(`${root}/files/upload-multiple`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!res.ok) {
    const err = new Error(data?.message || "Upload failed");
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export function deleteFileRequest(id) {
  return apiFetch(`/files/${id}`, { method: "DELETE" });
}

// —— Location scope ——

export function getMyLocationsRequest() {
  return apiFetch("/location-session/mine");
}

export function setActiveLocationRequest(locationId) {
  return apiFetch("/location-session/active-location", {
    method: "PUT",
    body: JSON.stringify({ locationId }),
  });
}

export function listInventoryStoresRequest(locationId) {
  const qs = locationId ? `?locationId=${encodeURIComponent(locationId)}` : "";
  return apiFetch(`/inventory-stores${qs}`);
}

export function listStoresByLocationRequest(locationId) {
  return apiFetch(`/inventory-stores/by-location/${locationId}`);
}

export function getInventoryStoreByIdRequest(id) {
  return apiFetch(`/inventory-stores/${id}`);
}

export function createInventoryStoreRequest(payload) {
  return apiFetch("/inventory-stores", { method: "POST", body: JSON.stringify(payload) });
}

export function updateInventoryStoreRequest(id, payload) {
  return apiFetch(`/inventory-stores/${id}`, { method: "PUT", body: JSON.stringify(payload) });
}

export function deleteInventoryStoreRequest(id) {
  return apiFetch(`/inventory-stores/${id}`, { method: "DELETE" });
}

// —— Purchase transactions ——

// —— Purchase indents ——

export function listPurchaseIndentsRequest() {
  return apiFetch("/purchase/purchase-indents");
}

export function listApprovedPurchaseIndentsRequest() {
  return apiFetch("/purchase/purchase-indents/approved");
}

export function previewPurchaseIndentNoRequest() {
  return apiFetch("/purchase/purchase-indents/preview-number");
}

export function getPurchaseIndentRequest(id) {
  return apiFetch(`/purchase/purchase-indents/${id}`);
}

export function createPurchaseIndentRequest(payload) {
  return apiFetch("/purchase/purchase-indents", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePurchaseIndentRequest(id, payload) {
  return apiFetch(`/purchase/purchase-indents/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deletePurchaseIndentRequest(id) {
  return apiFetch(`/purchase/purchase-indents/${id}`, { method: "DELETE" });
}

export function approvePurchaseIndentRequest(id) {
  return apiFetch(`/purchase/purchase-indents/${id}/approve`, { method: "POST" });
}

export function cancelPurchaseIndentRequest(id) {
  return apiFetch(`/purchase/purchase-indents/${id}/cancel`, { method: "POST" });
}

// —— RFQ ——

export function listRfqsRequest() {
  return apiFetch("/purchase/rfqs");
}

export function previewRfqNoRequest() {
  return apiFetch("/purchase/rfqs/preview-number");
}

export function getRfqRequest(id) {
  return apiFetch(`/purchase/rfqs/${id}`);
}

export function createRfqRequest(payload) {
  return apiFetch("/purchase/rfqs", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRfqRequest(id, payload) {
  return apiFetch(`/purchase/rfqs/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteRfqRequest(id) {
  return apiFetch(`/purchase/rfqs/${id}`, { method: "DELETE" });
}

export function submitRfqRequest(id) {
  return apiFetch(`/purchase/rfqs/${id}/submit`, { method: "POST" });
}

export function openRfqRequest(id) {
  return apiFetch(`/purchase/rfqs/${id}/open`, { method: "POST" });
}

export function closeRfqRequest(id) {
  return apiFetch(`/purchase/rfqs/${id}/close`, { method: "POST" });
}

export function awardRfqRequest(id) {
  return apiFetch(`/purchase/rfqs/${id}/award`, { method: "POST" });
}

export function cancelRfqRequest(id) {
  return apiFetch(`/purchase/rfqs/${id}/cancel`, { method: "POST" });
}

export function expireRfqRequest(id) {
  return apiFetch(`/purchase/rfqs/${id}/expire`, { method: "POST" });
}

export function listMaterialPurchaseRequirementsRequest() {
  return apiFetch("/purchase/material-purchase-planning/requirements");
}

export function listPurchaseOrdersRequest(params = {}) {
  const q = new URLSearchParams();
  if (params.poChannel) q.set("poChannel", params.poChannel);
  const qs = q.toString();
  return apiFetch(`/purchase/purchase-orders${qs ? `?${qs}` : ""}`);
}

export function listServicePurchaseOrderReportRequest(params = {}) {
  const q = new URLSearchParams();
  if (params.fromDate) q.set("fromDate", params.fromDate);
  if (params.toDate) q.set("toDate", params.toDate);
  if (params.serviceProviderId) q.set("serviceProviderId", params.serviceProviderId);
  if (params.search) q.set("search", params.search);
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  const qs = q.toString();
  return apiFetch(`/purchase/reports/service-purchase-orders${qs ? `?${qs}` : ""}`);
}

export function listPurchaseOrderReportRequest(params = {}) {
  const q = new URLSearchParams();
  if (params.fromDate) q.set("fromDate", params.fromDate);
  if (params.toDate) q.set("toDate", params.toDate);
  if (params.supplierId) q.set("supplierId", params.supplierId);
  if (params.search) q.set("search", params.search);
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  const qs = q.toString();
  return apiFetch(`/purchase/reports/purchase-orders${qs ? `?${qs}` : ""}`);
}

export function listItemWisePoReportRequest(params = {}) {
  const q = new URLSearchParams();
  if (params.fromDate) q.set("fromDate", params.fromDate);
  if (params.toDate) q.set("toDate", params.toDate);
  if (params.itemId) q.set("itemId", params.itemId);
  if (params.search) q.set("search", params.search);
  if (params.page != null) q.set("page", String(params.page));
  if (params.pageSize != null) q.set("pageSize", String(params.pageSize));
  if (params.export) q.set("export", "1");
  const qs = q.toString();
  return apiFetch(`/purchase/reports/item-wise-po${qs ? `?${qs}` : ""}`);
}

export function getPurchaseOrderRequest(id) {
  return apiFetch(`/purchase/purchase-orders/${id}`);
}

export function updatePurchaseOrderRequest(id, payload) {
  return apiFetch(`/purchase/purchase-orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function approvePurchaseOrderRequest(id) {
  return apiFetch(`/purchase/purchase-orders/${id}/approve`, { method: "POST" });
}

export function cancelPurchaseOrderRequest(id) {
  return apiFetch(`/purchase/purchase-orders/${id}/cancel`, { method: "POST" });
}

export function listAmendablePurchaseOrdersRequest(params = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  const qs = q.toString();
  return apiFetch(`/purchase/purchase-orders/amend-eligible${qs ? `?${qs}` : ""}`);
}

export function getPurchaseOrderAmendmentHistoryRequest(id) {
  return apiFetch(`/purchase/purchase-orders/${id}/amendment-history`);
}

export function submitPurchaseOrderAmendmentRequest(id, payload) {
  return apiFetch(`/purchase/purchase-orders/${id}/amendment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePurchaseOrderAmendmentRequest(id, payload) {
  return apiFetch(`/purchase/purchase-orders/${id}/amendment`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function approvePurchaseOrderAmendmentRequest(id) {
  return apiFetch(`/purchase/purchase-orders/${id}/amendment/approve`, { method: "POST" });
}

export function listCancellablePurchaseOrdersRequest(params = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  const qs = q.toString();
  return apiFetch(`/purchase/purchase-orders/cancel-eligible${qs ? `?${qs}` : ""}`);
}

export function cancelApprovedPurchaseOrderRequest(id, payload) {
  return apiFetch(`/purchase/purchase-orders/${id}/cancel-approved`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getPoTermsConfigRequest() {
  return apiFetch("/purchase/po-terms-config");
}

export function savePoTermsConfigRequest(payload) {
  return apiFetch("/purchase/po-terms-config", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function previewPurchaseOrderNoRequest() {
  return apiFetch("/purchase/purchase-orders/preview-number");
}

export function createPurchaseOrderRequest(payload) {
  return apiFetch("/purchase/purchase-orders", { method: "POST", body: JSON.stringify(payload) });
}

export function deletePurchaseOrderRequest(id) {
  return apiFetch(`/purchase/purchase-orders/${id}`, { method: "DELETE" });
}

export function listServicePurchaseOrdersRequest(params = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  const qs = q.toString();
  return apiFetch(`/purchase/service-purchase-orders${qs ? `?${qs}` : ""}`);
}

export function previewServicePurchaseOrderNoRequest(params = {}) {
  const q = new URLSearchParams();
  if (params.serviceCategory) q.set("serviceCategory", params.serviceCategory);
  const qs = q.toString();
  return apiFetch(`/purchase/service-purchase-orders/preview-number${qs ? `?${qs}` : ""}`);
}

export function listServicePurchaseOrderServicesRequest() {
  return apiFetch("/purchase/service-purchase-orders/services");
}

export function getServicePurchaseOrderRequest(id) {
  return apiFetch(`/purchase/service-purchase-orders/${id}`);
}

export function createServicePurchaseOrderRequest(payload) {
  return apiFetch("/purchase/service-purchase-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateServicePurchaseOrderRequest(id, payload) {
  return apiFetch(`/purchase/service-purchase-orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteServicePurchaseOrderRequest(id) {
  return apiFetch(`/purchase/service-purchase-orders/${id}`, { method: "DELETE" });
}

export function approveServicePurchaseOrderRequest(id) {
  return apiFetch(`/purchase/service-purchase-orders/${id}/approve`, { method: "POST" });
}

export function listAmendableServicePurchaseOrdersRequest(params = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  const qs = q.toString();
  return apiFetch(`/purchase/service-purchase-orders/amend-eligible${qs ? `?${qs}` : ""}`);
}

export function getServicePurchaseOrderAmendmentHistoryRequest(id) {
  return apiFetch(`/purchase/service-purchase-orders/${id}/amendment-history`);
}

export function submitServicePurchaseOrderAmendmentRequest(id, payload) {
  return apiFetch(`/purchase/service-purchase-orders/${id}/amendment`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateServicePurchaseOrderAmendmentRequest(id, payload) {
  return apiFetch(`/purchase/service-purchase-orders/${id}/amendment`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function approveServicePurchaseOrderAmendmentRequest(id) {
  return apiFetch(`/purchase/service-purchase-orders/${id}/amendment/approve`, {
    method: "POST",
  });
}

export function listCancellableServicePurchaseOrdersRequest(params = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  const qs = q.toString();
  return apiFetch(`/purchase/service-purchase-orders/cancel-eligible${qs ? `?${qs}` : ""}`);
}

export function cancelApprovedServicePurchaseOrderRequest(id, payload) {
  return apiFetch(`/purchase/service-purchase-orders/${id}/cancel-approved`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listJobWorkOrdersRequest(params = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  const qs = q.toString();
  return apiFetch(`/purchase/job-work-orders${qs ? `?${qs}` : ""}`);
}

export function previewJobWorkOrderNoRequest() {
  return apiFetch("/purchase/job-work-orders/preview-number");
}

export function getJobWorkOrderRequest(id) {
  return apiFetch(`/purchase/job-work-orders/${id}`);
}

export function createJobWorkOrderRequest(payload) {
  return apiFetch("/purchase/job-work-orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateJobWorkOrderRequest(id, payload) {
  return apiFetch(`/purchase/job-work-orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteJobWorkOrderRequest(id) {
  return apiFetch(`/purchase/job-work-orders/${id}`, { method: "DELETE" });
}

export function approveJobWorkOrderRequest(id) {
  return apiFetch(`/purchase/job-work-orders/${id}/approve`, { method: "POST" });
}

export function listGoodsReceiptsRequest() {
  return apiFetch("/purchase/goods-receipts");
}

export function getGoodsReceiptRequest(id) {
  return apiFetch(`/purchase/goods-receipts/${id}`);
}

export function createGoodsReceiptRequest(payload) {
  return apiFetch("/purchase/goods-receipts", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateGoodsReceiptRequest(id, payload) {
  return apiFetch(`/purchase/goods-receipts/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function postGoodsReceiptRequest(id) {
  return apiFetch(`/purchase/goods-receipts/${id}/post`, { method: "POST" });
}

export function deleteGoodsReceiptRequest(id) {
  return apiFetch(`/purchase/goods-receipts/${id}`, { method: "DELETE" });
}

export function listPurchaseInvoicesRequest() {
  return apiFetch("/purchase/purchase-invoices");
}

// —— Quality (Item Incoming QCL) ——

export function listItemIncomingQclRequest() {
  return apiFetch("/quality/item-incoming-qcl");
}

export function getItemIncomingQclRequest(itemId) {
  return apiFetch(`/quality/item-incoming-qcl/${itemId}`);
}

export function saveItemIncomingQclRequest(itemId, payload) {
  return apiFetch(`/quality/item-incoming-qcl/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// —— Quality (Standard Specifications) ——

export function listStandardSpecificationsRequest() {
  return apiFetch("/quality/standard-specifications");
}

export function previewStandardSpecIdRequest() {
  return apiFetch("/quality/standard-specifications/preview-spec-id");
}

export function getStandardSpecificationRequest(id) {
  return apiFetch(`/quality/standard-specifications/${id}`);
}

export function createStandardSpecificationRequest(payload) {
  return apiFetch("/quality/standard-specifications", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateStandardSpecificationRequest(id, payload) {
  return apiFetch(`/quality/standard-specifications/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteStandardSpecificationRequest(id) {
  return apiFetch(`/quality/standard-specifications/${id}`, { method: "DELETE" });
}

// —— Quality (Inspection Checklist) ——

export function listInspectionChecklistsRequest() {
  return apiFetch("/quality/inspection-checklists");
}

export function previewInspectionChecklistIdRequest() {
  return apiFetch("/quality/inspection-checklists/preview-checklist-id");
}

export function getInspectionChecklistRequest(id) {
  return apiFetch(`/quality/inspection-checklists/${id}`);
}

export function createInspectionChecklistRequest(payload) {
  return apiFetch("/quality/inspection-checklists", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateInspectionChecklistRequest(id, payload) {
  return apiFetch(`/quality/inspection-checklists/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteInspectionChecklistRequest(id) {
  return apiFetch(`/quality/inspection-checklists/${id}`, { method: "DELETE" });
}

// —— Quality (RM Specifications) ——

export function listRmSpecificationsRequest(querySuffix = "") {
  return apiFetch(`/quality/rm-specifications${querySuffix}`);
}

export function getRmSpecificationStatusSummaryRequest() {
  return apiFetch("/quality/rm-specifications/status-summary");
}

export function getRmSpecificationRequest(itemId) {
  return apiFetch(`/quality/rm-specifications/${itemId}`);
}

export function saveRmSpecificationRequest(itemId, payload) {
  return apiFetch(`/quality/rm-specifications/${itemId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** Deletes RM specification lines only; the item master record is not removed. */
export function deleteRmSpecificationRequest(itemId) {
  return apiFetch(`/quality/rm-specifications/${itemId}`, { method: "DELETE" });
}

/** @deprecated Use deleteRmSpecificationRequest */
export function clearRmSpecificationRequest(itemId) {
  return deleteRmSpecificationRequest(itemId);
}

export function applyRmSpecificationCopyRequest(sourceItemId, payload) {
  return apiFetch(`/quality/rm-specifications/${sourceItemId}/apply-copy`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// —— Stock ——

export function listStockTransfersRequest() {
  return apiFetch("/stock-transfers");
}

export function completeStockTransferRequest(id) {
  return apiFetch(`/stock-transfers/${id}/complete`, { method: "POST" });
}

export function getDashboardLocationStatsRequest(locationId) {
  const qs = locationId ? `?locationId=${encodeURIComponent(locationId)}` : "";
  return apiFetch(`/framework/dashboard-location-stats${qs}`);
}

export function listLocationAuditRequest(entityType, entityId) {
  const qs = new URLSearchParams({ entityType, entityId }).toString();
  return apiFetch(`/location-audit?${qs}`);
}

export function getSubLocationByIdRequest(id) {
  return apiFetch(`/sub-locations/${id}`);
}

export function listStockBalancesRequest(params = {}) {
  const qs = new URLSearchParams();
  if (params.inventoryStoreId) qs.set("inventoryStoreId", params.inventoryStoreId);
  if (params.itemId) qs.set("itemId", params.itemId);
  const q = qs.toString();
  return apiFetch(`/stock-transfers/balances${q ? `?${q}` : ""}`);
}

/** Vendor Evaluation showcase (dummy data — replaceable) */
export function getVendorEvaluationDashboardRequest() {
  return apiFetch("/vendor-evaluation-showcase/dashboard");
}

export function getVendorEvaluationOptionsRequest() {
  return apiFetch("/vendor-evaluation-showcase/options");
}

export function listVendorEvaluationShowcaseRequest(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && String(v).trim() !== "") qs.set(k, String(v));
  });
  const q = qs.toString();
  return apiFetch(`/vendor-evaluation-showcase/vendors${q ? `?${q}` : ""}`);
}

export function getVendorEvaluationShowcaseRequest(code) {
  return apiFetch(`/vendor-evaluation-showcase/vendors/${encodeURIComponent(code)}`);
}

export function getVendorEvaluationHistoryRequest(code) {
  return apiFetch(`/vendor-evaluation-showcase/vendors/${encodeURIComponent(code)}/history`);
}

export function getVendorEvaluationTrendRequest(code) {
  return apiFetch(`/vendor-evaluation-showcase/vendors/${encodeURIComponent(code)}/trend`);
}

export function compareVendorEvaluationShowcaseRequest(vendorCodes) {
  return apiFetch("/vendor-evaluation-showcase/compare", {
    method: "POST",
    body: JSON.stringify({ vendorCodes }),
  });
}
