import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import {
  listSubLocations,
  getSubLocationById,
  getSubLocationSummary,
  getSubLocationStatusSummary,
  createSubLocation,
  updateSubLocation,
  deleteSubLocation,
} from "../controllers/subLocation.controller.js";

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/", listSubLocations);
router.get("/summary", getSubLocationSummary);
router.get("/status-summary", getSubLocationStatusSummary);
router.get("/:id", getSubLocationById);
router.post("/", createSubLocation);
router.put("/:id", updateSubLocation);
router.delete("/:id", deleteSubLocation);

export default router;
