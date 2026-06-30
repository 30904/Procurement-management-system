import { asyncHandler } from "../middleware/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { resolveUserRbac } from "../services/rbac.service.js";
import {
  getSidebarNavigation,
  getLandingCards,
  getHubBySegment,
  createSidebarMenuWithModules,
  deleteSidebarMenuWithModules,
  deleteLandingCard,
  resolveIconKeysFromPayload,
  createCardGroup,
  assignCardToGroup,
} from "../services/menu.service.js";
import { MenuItem } from "../models/MenuItem.model.js";
import { Company } from "../models/Company.model.js";
import { User } from "../models/User.model.js";
import { Role } from "../models/Role.model.js";
import { resolveDashboardForUser } from "../services/dashboard.service.js";
import { resolveLocationScope } from "../services/locationScope.service.js";
import { getDashboardLocationStats } from "../services/dashboardLocationStats.service.js";

export const getSession = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }

  const rbac = req.rbac || (await resolveUserRbac(userId));
  const companyId = rbac.companyId;
  if (!companyId) {
    throw new AppError("User is not linked to a company", 400, "NO_COMPANY");
  }

  const activeHeader =
    req.headers["x-active-location-id"] || req.headers["x-location-id"] || null;

  const [company, navigation, dashboardResolved, locationScope] = await Promise.all([
    Company.findById(companyId).lean(),
    getSidebarNavigation(companyId, rbac),
    resolveDashboardForUser(userId),
    resolveLocationScope(userId, { activeLocationHeader: activeHeader }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      company,
      locationScope: {
        mode: locationScope.mode,
        defaultLocationId: locationScope.defaultLocationId,
        activeLocationId: locationScope.activeLocationId,
        locations: locationScope.locations,
      },
      rbac: {
        isSuperAdmin: rbac.isSuperAdmin,
        roles: rbac.roles,
        permissionsByCode: rbac.permissionsByCode,
      },
      dashboard: {
        key: dashboardResolved.dashboardKey,
        label: dashboardResolved.dashboard?.label,
        description: dashboardResolved.dashboard?.description,
      },
      navigation: {
        main: navigation.main,
        bottom: navigation.bottom,
        applicationsFlyout: navigation.applicationsFlyout || [],
      },
    },
  });
});

export const getLandingByParent = asyncHandler(async (req, res) => {
  const { parentCode } = req.params;
  const rbac = req.rbac;
  const companyId = rbac?.companyId;
  if (!companyId) {
    throw new AppError("Company not found for user", 400, "NO_COMPANY");
  }

  const cards = await getLandingCards(companyId, parentCode, rbac);
  const parent = await MenuItem.findOne({
    company: companyId,
    code: parentCode,
  }).lean();

  res.status(200).json({
    success: true,
    data: {
      parent: parent
        ? {
            code: parent.code,
            label: parent.label,
            description: parent.description,
            segment: parent.segment,
            variant: parent.variant,
          }
        : null,
      cards,
    },
  });
});

export const getHubByPath = asyncHandler(async (req, res) => {
  const segment = String(req.query.segment || "").replace(/^\/+/, "");
  const rbac = req.rbac;
  const companyId = rbac?.companyId;
  if (!companyId) {
    throw new AppError("Company not found for user", 400, "NO_COMPANY");
  }

  const hubData = await getHubBySegment(companyId, segment, rbac);
  if (!hubData) {
    throw new AppError("Hub not found", 404, "NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    data: hubData,
  });
});

export const listMenuCatalog = asyncHandler(async (req, res) => {
  if (!req.rbac?.isSuperAdmin) {
    throw new AppError("Super Admin access required", 403, "FORBIDDEN");
  }

  const companyId = req.rbac.companyId;
  const rows = await MenuItem.find({ company: companyId })
    .sort({ menuType: 1, sequence: 1 })
    .lean();

  res.status(200).json({ success: true, data: rows });
});

export const updateMenuItem = asyncHandler(async (req, res) => {
  if (!req.rbac?.isSuperAdmin) {
    throw new AppError("Super Admin access required", 403, "FORBIDDEN");
  }

  const { id } = req.params;
  const body = req.body ?? {};
  const doc = await MenuItem.findOne({
    _id: id,
    company: req.rbac.companyId,
  });

  if (!doc) {
    throw new AppError("Menu item not found", 404, "NOT_FOUND");
  }

  const allowed = [
    "label",
    "description",
    "sequence",
    "isActive",
    "isHidden",
    "disabled",
    "disabledHint",
    "parentCode",
    "segment",
  ];
  for (const key of allowed) {
    if (body[key] !== undefined) doc[key] = body[key];
  }

  if (body.iconKey !== undefined) {
    const { iconKey, activeIconKey } = await resolveIconKeysFromPayload(
      req.rbac.companyId,
      { iconKey: body.iconKey }
    );
    doc.iconKey = iconKey;
    doc.activeIconKey = activeIconKey;
  }

  await doc.save();

  res.status(200).json({
    success: true,
    data: doc.toObject(),
  });
});

export const createMenuItem = asyncHandler(async (req, res) => {
  if (!req.rbac?.isSuperAdmin) {
    throw new AppError("Super Admin access required", 403, "FORBIDDEN");
  }

  const companyId = req.rbac.companyId;
  const data = await createSidebarMenuWithModules(companyId, req.body ?? {});

  res.status(201).json({ success: true, data });
});

export const deleteMenuItem = asyncHandler(async (req, res) => {
  if (!req.rbac?.isSuperAdmin) {
    throw new AppError("Super Admin access required", 403, "FORBIDDEN");
  }

  const companyId = req.rbac.companyId;
  const { id } = req.params;
  const scope = String(req.query.scope || "sidebar").toLowerCase();

  const data =
    scope === "module"
      ? await deleteLandingCard(companyId, id)
      : await deleteSidebarMenuWithModules(companyId, id);

  res.status(200).json({ success: true, data });
});

export const createGroup = asyncHandler(async (req, res) => {
  if (!req.rbac?.isSuperAdmin) {
    throw new AppError("Super Admin access required", 403, "FORBIDDEN");
  }
  const companyId = req.rbac.companyId;
  const data = await createCardGroup(companyId, req.body ?? {});
  res.status(201).json({ success: true, data });
});

export const assignCard = asyncHandler(async (req, res) => {
  if (!req.rbac?.isSuperAdmin) {
    throw new AppError("Super Admin access required", 403, "FORBIDDEN");
  }
  const companyId = req.rbac.companyId;
  const { id } = req.params;
  const { groupCode } = req.body ?? {};
  const data = await assignCardToGroup(companyId, id, groupCode);
  res.status(200).json({ success: true, data });
});

export const getDashboardLocationStatsHandler = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) throw new AppError("Company not found for user", 400, "NO_COMPANY");

  const locationId =
    req.query.locationId ||
    req.headers["x-active-location-id"] ||
    req.locationScope?.activeLocationId;

  const data = await getDashboardLocationStats(companyId, locationId);
  res.status(200).json({ success: true, data });
});

export const getDashboardStats = asyncHandler(async (req, res) => {
  const companyId = req.rbac?.companyId;
  if (!companyId) {
    throw new AppError("Company not found for user", 400, "NO_COMPANY");
  }

  const [totalUsers, totalRoles, menuItems] = await Promise.all([
    User.countDocuments({}),
    Role.countDocuments({ company: companyId }),
    MenuItem.find({ company: companyId })
      .select({ menuType: 1, code: 1, isActive: 1 })
      .lean(),
  ]);

  const sidebarMenus = menuItems.filter(
    (m) => m.menuType === "sidebar_main" || m.menuType === "sidebar_bottom"
  ).length;
  const moduleCards = menuItems.filter(
    (m) => m.menuType === "landing_card" || m.menuType === "card_group"
  ).length;

  const activeUsers = await User.countDocuments({ isActive: true });

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      totalRoles,
      sidebarMenus,
      moduleCards,
      totalMenuItems: menuItems.length,
    },
  });
});
