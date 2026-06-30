import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import { list, listBySupplier, create, update, remove } from "../controllers/itemSupplierLink.controller.js";

const router = Router();

router.use(requireAuth, loadRbac);
router.get("/by-supplier/:supplierId/items", listBySupplier);
router.get("/:itemId/suppliers", list);
router.post("/:itemId/suppliers", create);
router.put("/:itemId/suppliers/:linkId", update);
router.delete("/:itemId/suppliers/:linkId", remove);

export default router;
