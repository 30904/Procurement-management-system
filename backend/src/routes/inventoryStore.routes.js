import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import { loadLocationScope } from "../middleware/loadLocationScope.js";
import * as ctrl from "../controllers/inventoryStore.controller.js";

const router = Router();

router.use(requireAuth, loadRbac, loadLocationScope);

router.get("/", ctrl.list);
router.get("/by-location/:locationId", ctrl.listByLocation);
router.get("/:id", ctrl.getById);
router.post("/", ctrl.create);
router.put("/:id", ctrl.update);
router.delete("/:id", ctrl.remove);

export default router;
