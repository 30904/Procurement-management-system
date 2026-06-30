import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import {
  list,
  unreadCount,
  read,
  readAll,
  create,
  broadcast,
  remove,
  clearAll,
} from "../controllers/notification.controller.js";

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/", list);
router.get("/unread-count", unreadCount);
router.patch("/read-all", readAll);
router.patch("/:id/read", read);
router.post("/", create);
router.post("/broadcast", broadcast);
router.delete("/clear-all", clearAll);
router.delete("/:id", remove);

export default router;
