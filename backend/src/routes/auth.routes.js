import { Router } from "express";
import { authStatus, login } from "../controllers/auth.controller.js";

const router = Router();

router.get("/status", authStatus);
router.post("/login", login);

export default router;
