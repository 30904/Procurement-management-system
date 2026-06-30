import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import {
  getConfig,
  saveConfig,
  testEmail,
  getTemplates,
  sendTemplate,
} from "../controllers/emailConfig.controller.js";

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/config", getConfig);
router.put("/config", saveConfig);
router.post("/test", testEmail);
router.get("/templates", getTemplates);
router.post("/send-template", sendTemplate);

export default router;
