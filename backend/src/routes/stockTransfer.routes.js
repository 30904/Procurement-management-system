import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import { loadLocationScope } from "../middleware/loadLocationScope.js";
import * as ctrl from "../controllers/stockTransfer.controller.js";

const router = Router();

router.use(requireAuth, loadRbac, loadLocationScope);

router.get("/balances", ctrl.listBalances);
router.get("/", ctrl.list);
router.get("/:id", ctrl.getOne);
router.post("/", ctrl.create);
router.post("/:id/complete", ctrl.complete);
router.delete("/:id", ctrl.remove);

export default router;
