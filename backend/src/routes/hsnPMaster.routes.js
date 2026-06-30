import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import { list, create, update, remove } from "../controllers/hsnPMaster.controller.js";

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/", list);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
