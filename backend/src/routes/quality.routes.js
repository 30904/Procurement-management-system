import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import * as itemIncomingQclCtrl from "../controllers/itemIncomingQcl.controller.js";
import * as standardSpecificationCtrl from "../controllers/standardSpecification.controller.js";
import * as inspectionChecklistCtrl from "../controllers/inspectionChecklist.controller.js";
import * as rmSpecificationCtrl from "../controllers/rmSpecification.controller.js";

const router = Router();

router.use(requireAuth, loadRbac);

router.get("/item-incoming-qcl", itemIncomingQclCtrl.list);
router.get("/item-incoming-qcl/:itemId", itemIncomingQclCtrl.getOne);
router.put("/item-incoming-qcl/:itemId", itemIncomingQclCtrl.save);

router.get("/standard-specifications/preview-spec-id", standardSpecificationCtrl.previewSpecId);
router.get("/standard-specifications", standardSpecificationCtrl.list);
router.get("/standard-specifications/:id", standardSpecificationCtrl.getOne);
router.post("/standard-specifications", standardSpecificationCtrl.create);
router.put("/standard-specifications/:id", standardSpecificationCtrl.update);
router.delete("/standard-specifications/:id", standardSpecificationCtrl.remove);

router.get("/inspection-checklists/preview-checklist-id", inspectionChecklistCtrl.previewChecklistId);
router.get("/inspection-checklists", inspectionChecklistCtrl.list);
router.get("/inspection-checklists/:id", inspectionChecklistCtrl.getOne);
router.post("/inspection-checklists", inspectionChecklistCtrl.create);
router.put("/inspection-checklists/:id", inspectionChecklistCtrl.update);
router.delete("/inspection-checklists/:id", inspectionChecklistCtrl.remove);

router.get("/rm-specifications/status-summary", rmSpecificationCtrl.statusSummary);
router.get("/rm-specifications", rmSpecificationCtrl.list);
router.get("/rm-specifications/:itemId", rmSpecificationCtrl.getOne);
router.put("/rm-specifications/:itemId", rmSpecificationCtrl.save);
router.post("/rm-specifications/:itemId/apply-copy", rmSpecificationCtrl.applyCopy);
router.delete("/rm-specifications/:itemId", rmSpecificationCtrl.clear);

export default router;
