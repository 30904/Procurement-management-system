import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import {
  compareVendors,
  dashboard,
  getVendor,
  getVendorHistory,
  getVendorTrend,
  listOptions,
  listVendors,
} from "../controllers/vendorEvaluationShowcase.controller.js";

const router = Router();
router.use(requireAuth, loadRbac);

router.get("/dashboard", dashboard);
router.get("/options", listOptions);
router.get("/vendors", listVendors);
router.post("/compare", compareVendors);
router.get("/vendors/:code/history", getVendorHistory);
router.get("/vendors/:code/trend", getVendorTrend);
router.get("/vendors/:code", getVendor);

export default router;
