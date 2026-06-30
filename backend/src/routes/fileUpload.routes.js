import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { getCategories, upload, uploadMultiple, list, getOne, remove } from "../controllers/fileUpload.controller.js";

const uploadMw = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const router = Router();
router.use(requireAuth);

router.get("/categories", getCategories);
router.get("/", list);
router.get("/:id", getOne);
router.post("/upload", uploadMw.single("file"), upload);
router.post("/upload-multiple", uploadMw.array("files", 10), uploadMultiple);
router.delete("/:id", remove);

export default router;
