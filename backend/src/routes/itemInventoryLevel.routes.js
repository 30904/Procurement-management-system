import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import { loadLocationScope } from "../middleware/loadLocationScope.js";
import {
  list,
  statusSummary,
  getOne,
  preview,
  save,
  saveDualUnit,
} from "../controllers/itemInventoryLevel.controller.js";

const router = Router();

router.use(requireAuth, loadRbac, loadLocationScope);

router.get("/status-summary", statusSummary);
router.post("/preview", preview);
router.get("/", list);
router.get("/:id", getOne);
router.put("/:id", save);
router.put("/:id/dual-unit", saveDualUnit);

export default router;
