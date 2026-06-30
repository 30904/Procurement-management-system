import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { loadRbac } from "../middleware/loadRbac.js";
import { loadLocationScope } from "../middleware/loadLocationScope.js";
import * as ctrl from "../controllers/purchaseTransaction.controller.js";
import * as indentCtrl from "../controllers/purchaseIndent.controller.js";
import * as mppCtrl from "../controllers/materialPurchasePlanning.controller.js";
import * as poTermsCtrl from "../controllers/poTermsConfig.controller.js";
import * as spoCtrl from "../controllers/servicePurchaseOrder.controller.js";
import * as jwoCtrl from "../controllers/jobWorkOrder.controller.js";
import * as rfqCtrl from "../controllers/rfq.controller.js";

const router = Router();

router.use(requireAuth, loadRbac, loadLocationScope);

router.get("/po-terms-config", poTermsCtrl.getConfig);
router.put("/po-terms-config", poTermsCtrl.saveConfig);

router.get("/purchase-indents/preview-number", indentCtrl.previewIndentNo);
router.get("/purchase-indents/approved", indentCtrl.listApprovedIndents);
router.get("/purchase-indents", indentCtrl.listIndents);
router.get("/purchase-indents/:id", indentCtrl.getIndent);
router.post("/purchase-indents", indentCtrl.createIndent);
router.put("/purchase-indents/:id", indentCtrl.updateIndent);
router.delete("/purchase-indents/:id", indentCtrl.deleteIndent);
router.post("/purchase-indents/:id/approve", indentCtrl.approveIndent);
router.post("/purchase-indents/:id/cancel", indentCtrl.cancelIndent);

router.get("/rfqs/preview-number", rfqCtrl.previewRfqNo);
router.get("/rfqs", rfqCtrl.listRfqs);
router.get("/rfqs/:id", rfqCtrl.getRfq);
router.post("/rfqs", rfqCtrl.createRfq);
router.put("/rfqs/:id", rfqCtrl.updateRfq);
router.delete("/rfqs/:id", rfqCtrl.deleteRfq);
router.post("/rfqs/:id/submit", rfqCtrl.submitRfq);
router.post("/rfqs/:id/open", rfqCtrl.openRfq);
router.post("/rfqs/:id/close", rfqCtrl.closeRfq);
router.post("/rfqs/:id/award", rfqCtrl.awardRfq);
router.post("/rfqs/:id/cancel", rfqCtrl.cancelRfq);
router.post("/rfqs/:id/expire", rfqCtrl.expireRfq);

router.get("/material-purchase-planning/requirements", mppCtrl.listRequirements);

router.get("/purchase-orders/preview-number", ctrl.previewPONo);
router.get("/purchase-orders/amend-eligible", ctrl.listAmendablePO);
router.get("/purchase-orders/cancel-eligible", ctrl.listCancellablePO);
router.get("/reports/purchase-orders", ctrl.listPOReport);
router.get("/reports/service-purchase-orders", spoCtrl.listSpoReport);
router.get("/reports/item-wise-po", ctrl.listItemWisePOReport);
router.get("/purchase-orders", ctrl.listPO);
router.get("/purchase-orders/:id/amendment-history", ctrl.getPOAmendmentHistory);
router.post("/purchase-orders/:id/amendment", ctrl.submitPOAmendment);
router.put("/purchase-orders/:id/amendment", ctrl.updatePOAmendment);
router.post("/purchase-orders/:id/amendment/approve", ctrl.approvePOAmendment);
router.post("/purchase-orders/:id/cancel-approved", ctrl.cancelApprovedPO);
router.get("/purchase-orders/:id", ctrl.getPO);
router.post("/purchase-orders", ctrl.createPO);
router.post("/purchase-orders/:id/approve", ctrl.approvePO);
router.post("/purchase-orders/:id/cancel", ctrl.cancelPO);
router.put("/purchase-orders/:id", ctrl.updatePO);
router.delete("/purchase-orders/:id", ctrl.deletePO);

router.get("/service-purchase-orders/preview-number", spoCtrl.previewSpoNo);
router.get("/service-purchase-orders/services", spoCtrl.listServicesForSpo);
router.get("/service-purchase-orders/amend-eligible", spoCtrl.listAmendableSpo);
router.get("/service-purchase-orders/cancel-eligible", spoCtrl.listCancellableSpo);
router.get("/service-purchase-orders", spoCtrl.listSpo);
router.get("/service-purchase-orders/:id/amendment-history", spoCtrl.getSpoAmendmentHistory);
router.post("/service-purchase-orders/:id/amendment", spoCtrl.submitSpoAmendment);
router.put("/service-purchase-orders/:id/amendment", spoCtrl.updateSpoAmendment);
router.post("/service-purchase-orders/:id/amendment/approve", spoCtrl.approveSpoAmendment);
router.post("/service-purchase-orders/:id/cancel-approved", spoCtrl.cancelApprovedSpo);
router.get("/service-purchase-orders/:id", spoCtrl.getSpo);
router.post("/service-purchase-orders", spoCtrl.createSpo);
router.post("/service-purchase-orders/:id/approve", spoCtrl.approveSpo);
router.put("/service-purchase-orders/:id", spoCtrl.updateSpo);
router.delete("/service-purchase-orders/:id", spoCtrl.deleteSpo);

router.get("/job-work-orders/preview-number", jwoCtrl.previewJwoNo);
router.get("/job-work-orders", jwoCtrl.listJwo);
router.get("/job-work-orders/:id", jwoCtrl.getJwo);
router.post("/job-work-orders", jwoCtrl.createJwo);
router.post("/job-work-orders/:id/approve", jwoCtrl.approveJwo);
router.put("/job-work-orders/:id", jwoCtrl.updateJwo);
router.delete("/job-work-orders/:id", jwoCtrl.deleteJwo);

router.get("/goods-receipts", ctrl.listGRN);
router.get("/goods-receipts/:id", ctrl.getGRN);
router.post("/goods-receipts", ctrl.createGRN);
router.put("/goods-receipts/:id", ctrl.updateGRN);
router.post("/goods-receipts/:id/post", ctrl.postGRN);
router.delete("/goods-receipts/:id", ctrl.deleteGRN);

router.get("/purchase-invoices", ctrl.listPI);
router.get("/purchase-invoices/:id", ctrl.getPI);
router.post("/purchase-invoices", ctrl.createPI);
router.put("/purchase-invoices/:id", ctrl.updatePI);
router.delete("/purchase-invoices/:id", ctrl.deletePI);

export default router;
