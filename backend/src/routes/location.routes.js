import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import {
  listLocations,
  getLocationById,
  getLocationSummary,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../controllers/location.controller.js";

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/", listLocations);
router.get("/summary", getLocationSummary);
router.get("/:id", getLocationById);
router.post("/", createLocation);
router.put("/:id", updateLocation);
router.delete("/:id", deleteLocation);

export default router;
