import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import {
  list,
  getOne,
  create,
  update,
  remove,
  previewRegistration,
  convertToSupplier,
} from "../controllers/prospectSupplierMaster.controller.js";

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/preview-registration", previewRegistration);
router.get("/", list);
router.post("/", create);
router.post("/:id/convert-to-supplier", convertToSupplier);
router.get("/:id", getOne);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
