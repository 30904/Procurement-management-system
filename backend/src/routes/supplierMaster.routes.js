import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import { list, getOne, create, update, remove } from "../controllers/supplierMaster.controller.js";

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/", list);
router.get("/:id", getOne);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
