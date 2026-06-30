import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import { list, nextCode, create, update, remove } from "../controllers/paymentTermsMaster.controller.js";

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/", list);
router.get("/next-code", nextCode);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
