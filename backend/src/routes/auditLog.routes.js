import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { list, modelNames, remove, bulkDelete, clearAll } from "../controllers/auditLog.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", list);
router.get("/model-names", modelNames);
router.delete("/clear-all", clearAll);
router.post("/bulk-delete", bulkDelete);
router.delete("/:id", remove);

export default router;
