import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { getProfiles, downloadTemplate, parseUpload, executeImport } from "../controllers/csvImport.controller.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = Router();
router.use(requireAuth);

router.get("/profiles", getProfiles);
router.get("/template/:profile", downloadTemplate);
router.post("/parse", upload.single("file"), parseUpload);
router.post("/import", executeImport);

export default router;
