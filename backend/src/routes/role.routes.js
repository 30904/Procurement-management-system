import { Router } from "express";
import {
  listRoles,
  createRole,
  getRoleById,
  updateRole,
} from "../controllers/role.controller.js";

const router = Router();

router.get("/", listRoles);
router.post("/", createRole);
router.get("/:id", getRoleById);
router.put("/:id", updateRole);

export default router;
