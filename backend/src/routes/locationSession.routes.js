import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import { loadLocationScope } from "../middleware/loadLocationScope.js";
import { getMyLocations, setActiveLocation } from "../controllers/locationSession.controller.js";

const router = Router();

router.use(requireAuth, loadRbac, loadLocationScope);

router.get("/mine", getMyLocations);
router.put("/active-location", setActiveLocation);

export default router;
