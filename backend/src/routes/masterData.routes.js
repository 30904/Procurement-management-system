import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import {
  getCategories,
  getNextSequenceForCategory,
  getByCategory,
  getAll,
  create,
  update,
  remove,
} from "../controllers/masterData.controller.js";

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/categories", getCategories);
router.get("/next-sequence/:category", getNextSequenceForCategory);
router.get("/by-category/:category", getByCategory);
router.get("/", getAll);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;
