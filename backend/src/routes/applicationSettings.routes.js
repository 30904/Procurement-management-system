import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import {
  getApplicationSettings,
  updateApplicationSettings,
  uploadApplicationAsset,
} from "../controllers/applicationSettings.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/", getApplicationSettings);
router.put("/", updateApplicationSettings);
router.post("/upload", upload.single("file"), uploadApplicationAsset);

export default router;
