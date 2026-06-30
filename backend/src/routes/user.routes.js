import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listUsers, createUser, getNextUserCode, updateUser, deleteUser, getProfile, updateProfile, changePassword, listUserSessions } from "../controllers/user.controller.js";

const router = Router();

router.get("/", listUsers);
router.get("/sessions", requireAuth, listUserSessions);
router.post("/", createUser);
router.get("/next-code", getNextUserCode);
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.post("/change-password", requireAuth, changePassword);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
