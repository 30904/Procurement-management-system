import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import { loadLocationScope } from "../middleware/loadLocationScope.js";
import {
  getSession,
  getDashboardStats,
  getDashboardLocationStatsHandler,
  getLandingByParent,
  getHubByPath,
  listMenuCatalog,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createGroup,
  assignCard,
} from "../controllers/framework.controller.js";
import {
  listMenuIcons,
  createMenuIcon,
  removeMenuIcon,
} from "../controllers/menuIcon.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/session", getSession);
router.get("/dashboard-stats", getDashboardStats);
router.get("/dashboard-location-stats", loadLocationScope, getDashboardLocationStatsHandler);
router.get("/menus/landing/:parentCode", getLandingByParent);
router.get("/menus/hub", getHubByPath);
router.get("/menus/catalog", listMenuCatalog);
router.post("/menus", createMenuItem);
router.post("/menus/groups", createGroup);
router.patch("/menus/:id", updateMenuItem);
router.patch("/menus/:id/assign", assignCard);
router.delete("/menus/:id", deleteMenuItem);

router.get("/menu-icons", listMenuIcons);
router.post(
  "/menu-icons",
  upload.fields([
    { name: "iconFile", maxCount: 1 },
    { name: "activeIconFile", maxCount: 1 },
  ]),
  createMenuIcon
);
router.delete("/menu-icons/:id", removeMenuIcon);

export default router;
