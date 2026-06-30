import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import { listForEntity } from "../controllers/locationAudit.controller.js";

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/", listForEntity);

export default router;
