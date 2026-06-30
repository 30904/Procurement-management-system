import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import { loadLocationScope } from "../middleware/loadLocationScope.js";
import { list, getOne, create, update, remove } from "../controllers/assetMaster.controller.js";

const router = Router();

router.use(requireAuth, loadRbac, loadLocationScope);

router.get("/", list);
router.get("/:id", getOne);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;

