import { Router } from "express";
import { getPublicApplicationBranding } from "../controllers/applicationSettings.controller.js";

const router = Router();

router.get("/application-branding", getPublicApplicationBranding);

export default router;
