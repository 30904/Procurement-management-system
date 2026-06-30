import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import { loadLocationScope } from "../middleware/loadLocationScope.js";
import {
  list,
  getOne,
  create,
  update,
  remove,
  downloadUploadTemplate,
  uploadItems,
} from "../controllers/itemMaster.controller.js";

const uploadMw = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
import {
  getApplicableConfig,
  getAttributeValues,
  saveAttributeValues,
  getCompliance,
} from "../controllers/itemExtension.controller.js";

const router = Router();

router.use(requireAuth, loadRbac, loadLocationScope);

router.get("/upload/template", downloadUploadTemplate);
router.post("/upload", uploadMw.single("file"), uploadItems);
router.get("/config/applicable", getApplicableConfig);
router.get("/:id/attribute-values", getAttributeValues);
router.put("/:id/attribute-values", saveAttributeValues);
router.get("/:id/compliance", getCompliance);
router.get("/", list);
router.get("/:id", getOne);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
