import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import {
  getCurrentCompany,
  updateCurrentCompany,
} from "../controllers/company.controller.js";

const router = Router();

router.get("/current", requireAuth, loadRbac, getCurrentCompany);
router.put("/current", requireAuth, loadRbac, updateCurrentCompany);

export default router;
