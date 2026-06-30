import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import {
  list,
  create,
  update,
  remove,
  preview,
  previewScoped,
  revisions,
  previewSupplierCode,
  previewLogisticsCode,
  previewServiceCode,
  previewItemCode,
  previewAssetCode,
  previewServiceR1Code,
} from "../controllers/autoIncrement.controller.js";

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/", list);
router.get("/preview/supplier-code", previewSupplierCode);
router.get("/preview/logistics-code", previewLogisticsCode);
router.get("/preview/service-code", previewServiceCode);
router.get("/preview/item-code", previewItemCode);
router.get("/preview/asset-code", previewAssetCode);
router.get("/preview/service-r1-code", previewServiceR1Code);
router.get("/preview/:module", preview);
router.get("/preview/:module/scoped", previewScoped);
router.get("/:id/revisions", revisions);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
