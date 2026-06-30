import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import {
  getCatalog,
  getPurchaseDashboardStatsHandler,
  listMappings,
  resolveForCurrentUser,
  updateMapping,
} from "../controllers/dashboard.controller.js";

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/catalog", getCatalog);
router.get("/purchase-stats", getPurchaseDashboardStatsHandler);
router.get("/resolve", resolveForCurrentUser);
router.get("/role-mappings", listMappings);
router.put("/role-mappings/:roleId", updateMapping);

export default router;
