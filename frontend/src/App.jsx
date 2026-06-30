import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import HubLandingPage from "./components/hub/HubLandingPage.jsx";
import DynamicMenuHubRoute from "./components/hub/DynamicMenuHubRoute.jsx";
import DynamicSegmentHubRoute from "./components/hub/DynamicSegmentHubRoute.jsx";
import RolesAccessMenu from "./pages/settings/RolesAccessMenu.jsx";
import DynamicGroupRoute from "./components/hub/DynamicGroupRoute.jsx";
import ApplicationSetupPage from "./pages/settings/ApplicationSetupPage.jsx";
import RoleDashboardMappingPage from "./pages/settings/RoleDashboardMappingPage.jsx";
import MenuSetupPage from "./pages/settings/MenuSetupPage.jsx";
import ModulesSetupPage from "./pages/settings/ModulesSetupPage.jsx";
import GroupsSetupPage from "./pages/settings/GroupsSetupPage.jsx";
import MenuIconsSetupPage from "./pages/settings/MenuIconsSetupPage.jsx";
import CompanySetupPage from "./pages/settings/CompanySetupPage.jsx";
import LocationMasterPage from "./pages/settings/LocationMasterPage.jsx";
import LocationCreatePage from "./pages/settings/LocationCreatePage.jsx";
import LocationEditPage from "./pages/settings/LocationEditPage.jsx";
import SubLocationsPage from "./pages/settings/SubLocationsPage.jsx";
import UserManagementPage from "./pages/settings/UserManagementPage.jsx";
import AccessManagementPage from "./pages/settings/AccessManagementPage.jsx";
import ModuleManagementPage from "./pages/settings/ModuleManagementPage.jsx";
import PermissionManagementPage from "./pages/settings/PermissionManagementPage.jsx";
import MasterDataPage from "./pages/settings/MasterDataPage.jsx";
import ItemDocumentTypesPage from "./pages/settings/ItemDocumentTypesPage.jsx";
import PoTypeMasterPage from "./pages/settings/PoTypeMasterPage.jsx";
import IncidentalExpensesMasterPage from "./pages/settings/IncidentalExpensesMasterPage.jsx";
import ItemAttributeDefinitionsPage from "./pages/settings/ItemAttributeDefinitionsPage.jsx";
import AutoIncrementPage from "./pages/settings/AutoIncrementPage.jsx";
import EmailSetupPage from "./pages/settings/EmailSetupPage.jsx";
import PoTermsAndConditionsPage from "./pages/settings/PoTermsAndConditionsPage.jsx";
import AuditLogsPage from "./pages/settings/AuditLogsPage.jsx";
import ActiveUsersPage from "./pages/settings/ActiveUsersPage.jsx";
import BulkImportPage from "./pages/settings/BulkImportPage.jsx";
import FileManagerPage from "./pages/settings/FileManagerPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import ModulePlaceholderPage from "./pages/ModulePlaceholderPage.jsx";
import HsnPMasterPage from "./pages/masters/HsnPMasterPage.jsx";
import SacPMasterPage from "./pages/masters/SacPMasterPage.jsx";
import SupplierMasterPage from "./pages/masters/SupplierMasterPage.jsx";
import SupplierCreatePage from "./pages/masters/SupplierCreatePage.jsx";
import SupplierEditPage from "./pages/masters/SupplierEditPage.jsx";
import ProspectSupplierMasterPage from "./pages/masters/ProspectSupplierMasterPage.jsx";
import ProspectSupplierUpsertPage from "./pages/masters/ProspectSupplierUpsertPage.jsx";
import LogisticsMasterPage from "./pages/masters/LogisticsMasterPage.jsx";
import LogisticsCreatePage from "./pages/masters/LogisticsCreatePage.jsx";
import LogisticsEditPage from "./pages/masters/LogisticsEditPage.jsx";
import ServiceMasterPage from "./pages/masters/ServiceMasterPage.jsx";
import ServiceMasterR1Page from "./pages/masters/ServiceMasterR1Page.jsx";
import ServiceMasterR1UpsertPage from "./pages/masters/ServiceMasterR1UpsertPage.jsx";
import ItemMasterPage from "./pages/masters/ItemMasterPage.jsx";
import UploadItemMasterPage from "./pages/masters/UploadItemMasterPage.jsx";
import ItemUpsertPage from "./pages/masters/ItemUpsertPage.jsx";
import AssetMasterPage from "./pages/masters/AssetMasterPage.jsx";
import AssetUpsertPage from "./pages/masters/AssetUpsertPage.jsx";
import PaymentTermsMasterPage from "./pages/masters/PaymentTermsMasterPage.jsx";
import SourceListMasterPage from "./pages/masters/SourceListMasterPage.jsx";
import SourceListUpsertPage from "./pages/masters/SourceListUpsertPage.jsx";
import VendorEvaluationMasterPage from "./pages/masters/VendorEvaluationMasterPage.jsx";
import VendorEvaluationUpsertPage from "./pages/masters/VendorEvaluationUpsertPage.jsx";
import ItemIncomingQclListPage from "./pages/quality/ItemIncomingQclListPage.jsx";
import ItemIncomingQclEditPage from "./pages/quality/ItemIncomingQclEditPage.jsx";
import StandardSpecificationPage from "./pages/quality/StandardSpecificationPage.jsx";
import InspectionChecklistPage from "./pages/quality/InspectionChecklistPage.jsx";
import RmSpecificationListPage from "./pages/quality/RmSpecificationListPage.jsx";
import RmSpecificationEditPage from "./pages/quality/RmSpecificationEditPage.jsx";
import PurchaseOrderListPage from "./pages/purchase/PurchaseOrderListPage.jsx";
import PurchaseOrderDetailPage from "./pages/purchase/PurchaseOrderDetailPage.jsx";
import PurchaseOrderCreatePage from "./pages/purchase/PurchaseOrderCreatePage.jsx";
import AmendPoListPage from "./pages/purchase/AmendPoListPage.jsx";
import AmendPoDetailPage from "./pages/purchase/AmendPoDetailPage.jsx";
import CancelPoListPage from "./pages/purchase/CancelPoListPage.jsx";
import CancelPoDetailPage from "./pages/purchase/CancelPoDetailPage.jsx";
import PurchaseOrderPrintPage from "./pages/purchase/PurchaseOrderPrintPage.jsx";
import PurchaseOrderReportPage from "./pages/reports/PurchaseOrderReportPage.jsx";
import ServicePurchaseOrderReportPage from "./pages/reports/ServicePurchaseOrderReportPage.jsx";
import ServicePurchaseOrderPrintPage from "./pages/purchase/ServicePurchaseOrderPrintPage.jsx";
import ItemWisePoReportPage from "./pages/reports/ItemWisePoReportPage.jsx";
import PurchaseIndentReportPage from "./pages/reports/PurchaseIndentReportPage.jsx";
import RfqReportPage from "./pages/reports/RfqReportPage.jsx";
import GoodsReceiptReportPage from "./pages/reports/GoodsReceiptReportPage.jsx";
import PurchaseIndentPrintPage from "./pages/purchase/PurchaseIndentPrintPage.jsx";
import GoodsReceiptListPage from "./pages/purchase/GoodsReceiptListPage.jsx";
import GoodsReceiptCreatePage from "./pages/purchase/GoodsReceiptCreatePage.jsx";
import GoodsReceiptDetailPage from "./pages/purchase/GoodsReceiptDetailPage.jsx";
import GoodsReceiptPrintPage from "./pages/purchase/GoodsReceiptPrintPage.jsx";
import PurchaseIndentListPage from "./pages/purchase/PurchaseIndentListPage.jsx";
import RfqListPage from "./pages/purchase/RfqListPage.jsx";
import RfqCreatePage from "./pages/purchase/RfqCreatePage.jsx";
import RfqDetailPage from "./pages/purchase/RfqDetailPage.jsx";
import RfqPrintPage from "./pages/purchase/RfqPrintPage.jsx";
import PurchaseIndentApprovedListPage from "./pages/purchase/PurchaseIndentApprovedListPage.jsx";
import PurchaseIndentCreatePage from "./pages/purchase/PurchaseIndentCreatePage.jsx";
import PurchaseIndentDetailPage from "./pages/purchase/PurchaseIndentDetailPage.jsx";
import MaterialPurchasePlanningPage from "./pages/purchase/MaterialPurchasePlanningPage.jsx";
import VendorEvaluationDashboardPage from "./pages/purchase/vendorEvaluation/VendorEvaluationDashboardPage.jsx";
import VendorEvaluationListPage from "./pages/purchase/vendorEvaluation/VendorEvaluationListPage.jsx";
import VendorEvaluationDetailPage from "./pages/purchase/vendorEvaluation/VendorEvaluationDetailPage.jsx";
import VendorEvaluationComparisonPage from "./pages/purchase/vendorEvaluation/VendorEvaluationComparisonPage.jsx";
import VendorEvaluationScorecardPage from "./pages/purchase/vendorEvaluation/VendorEvaluationScorecardPage.jsx";
import VendorEvaluationTrendPage from "./pages/purchase/vendorEvaluation/VendorEvaluationTrendPage.jsx";
import VendorEvaluationHistoryPage from "./pages/purchase/vendorEvaluation/VendorEvaluationHistoryPage.jsx";
import ServicePurchaseOrderListPage from "./pages/purchase/ServicePurchaseOrderListPage.jsx";
import ServicePurchaseOrderCreatePage from "./pages/purchase/ServicePurchaseOrderCreatePage.jsx";
import JobWorkOrderListPage from "./pages/purchase/JobWorkOrderListPage.jsx";
import JobWorkOrderCreatePage from "./pages/purchase/JobWorkOrderCreatePage.jsx";
import AmendSpoListPage from "./pages/purchase/AmendSpoListPage.jsx";
import AmendSpoDetailPage from "./pages/purchase/AmendSpoDetailPage.jsx";
import CancelSpoListPage from "./pages/purchase/CancelSpoListPage.jsx";
import CancelSpoDetailPage from "./pages/purchase/CancelSpoDetailPage.jsx";
import ItemInventoryLevelListPage from "./pages/planning/ItemInventoryLevelListPage.jsx";
import StockTransferListPage from "./pages/stores/StockTransferListPage.jsx";
import InventoryStoresPage from "./pages/settings/InventoryStoresPage.jsx";
import InventoryStoreCreatePage from "./pages/settings/InventoryStoreCreatePage.jsx";
import InventoryStoreEditPage from "./pages/settings/InventoryStoreEditPage.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import PermissionGuard from "./components/auth/PermissionGuard.jsx";
import AppShellLayout from "./layouts/AppShellLayout.jsx";
import { LEGACY_MENU_REDIRECTS } from "./config/genericMenus.js";

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppShellLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="menu-:menuNum" element={<DynamicMenuHubRoute />} />
          <Route path="menu-:menuNum/module-:moduleNum" element={<ModulePlaceholderPage />} />
          <Route
            path="reports"
            element={
              <PermissionGuard menuCode="reports">
                <HubLandingPage parentCode="reports" backSegment="dashboard" title="Reports" />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/purchase"
            element={
              <PermissionGuard menuCode="reports_purchase">
                <HubLandingPage parentCode="reports_purchase" backSegment="reports" title="Purchase" />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/purchase/purchase-order"
            element={
              <PermissionGuard menuCode="reports_purchase_purchase_order">
                <PurchaseOrderReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/purchase/purchase-requisition"
            element={
              <PermissionGuard menuCode="reports_purchase_purchase_requisition">
                <PurchaseIndentReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/purchase/rfq-register"
            element={
              <PermissionGuard menuCode="reports_purchase_rfq_register">
                <RfqReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/purchase/goods-receipt-register"
            element={
              <PermissionGuard menuCode="reports_purchase_goods_receipt_register">
                <GoodsReceiptReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/purchase/item-wise-po"
            element={
              <PermissionGuard menuCode="reports_purchase_item_wise_po">
                <ItemWisePoReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/purchase/service-purchase-order"
            element={
              <PermissionGuard menuCode="reports_purchase_service_purchase_order">
                <ServicePurchaseOrderReportPage />
              </PermissionGuard>
            }
          />
          <Route
            path="reports/purchase/service-purchase-order/:id/print"
            element={
              <PermissionGuard menuCode="reports_purchase_service_purchase_order">
                <ServicePurchaseOrderPrintPage />
              </PermissionGuard>
            }
          />
          <Route path="reports/purchase/:reportSlug" element={<ModulePlaceholderPage />} />
          <Route path="reports/:reportKey" element={<ModulePlaceholderPage />} />
          <Route path="reports/*" element={<Navigate to="/app/reports" replace />} />
          <Route
            path="masters"
            element={
              <PermissionGuard menuCode="masters">
                <HubLandingPage parentCode="masters" backSegment="dashboard" title="Masters" />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase"
            element={
              <PermissionGuard menuCode="masters_purchase">
                <HubLandingPage parentCode="masters_purchase" backSegment="masters" title="Purchase Masters" />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/gst-p"
            element={
              <PermissionGuard menuCode="masters_purchase_gst_p">
                <HubLandingPage
                  parentCode="masters_purchase_gst_p"
                  backSegment="masters/purchase"
                  title="GST/P"
                />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/gst-p/hsn-p-master"
            element={
              <PermissionGuard menuCode="masters_purchase_gst_p_hsn_p_master">
                <HsnPMasterPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/gst-p/sac-p-master"
            element={
              <PermissionGuard menuCode="masters_purchase_gst_p_sac_p_master">
                <SacPMasterPage />
              </PermissionGuard>
            }
          />
          <Route path="masters/purchase/gst-p/:gstPMasterKey" element={<ModulePlaceholderPage />} />
          <Route
            path="masters/purchase/supplier"
            element={
              <PermissionGuard menuCode="masters_purchase_supplier">
                <SupplierMasterPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/supplier/new"
            element={
              <PermissionGuard menuCode="masters_purchase_supplier">
                <SupplierCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/supplier/:id/edit"
            element={
              <PermissionGuard menuCode="masters_purchase_supplier">
                <SupplierEditPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/prospect-supplier"
            element={
              <PermissionGuard menuCode="masters_purchase_prospect_supplier">
                <ProspectSupplierMasterPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/prospect-supplier/new"
            element={
              <PermissionGuard menuCode="masters_purchase_prospect_supplier">
                <ProspectSupplierUpsertPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/prospect-supplier/:id/edit"
            element={
              <PermissionGuard menuCode="masters_purchase_prospect_supplier">
                <ProspectSupplierUpsertPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/service-master"
            element={
              <PermissionGuard menuCode="masters_purchase_service_master">
                <ServiceMasterPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/service-master-r1"
            element={
              <PermissionGuard menuCode="masters_purchase_service_master_r1">
                <ServiceMasterR1Page />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/service-master-r1/new"
            element={
              <PermissionGuard menuCode="masters_purchase_service_master_r1">
                <ServiceMasterR1UpsertPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/service-master-r1/:id/edit"
            element={
              <PermissionGuard menuCode="masters_purchase_service_master_r1">
                <ServiceMasterR1UpsertPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/item-master"
            element={
              <PermissionGuard menuCode="masters_purchase_item_master">
                <ItemMasterPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/upload-item-master"
            element={
              <PermissionGuard menuCode="masters_purchase_upload_item_master">
                <UploadItemMasterPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/item-master/new"
            element={
              <PermissionGuard menuCode="masters_purchase_item_master">
                <ItemUpsertPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/item-master/:id/edit"
            element={
              <PermissionGuard menuCode="masters_purchase_item_master">
                <ItemUpsertPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/asset-master-capitalised"
            element={
              <PermissionGuard menuCode="masters_purchase_asset_master_capitalised">
                <AssetMasterPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/asset-master-capitalised/new"
            element={
              <PermissionGuard menuCode="masters_purchase_asset_master_capitalised">
                <AssetUpsertPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/asset-master-capitalised/:id/edit"
            element={
              <PermissionGuard menuCode="masters_purchase_asset_master_capitalised">
                <AssetUpsertPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/payment-terms"
            element={
              <PermissionGuard menuCode="masters_purchase_payment_terms">
                <PaymentTermsMasterPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/logistics"
            element={
              <PermissionGuard menuCode="masters_purchase_logistics">
                <LogisticsMasterPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/logistics/new"
            element={
              <PermissionGuard menuCode="masters_purchase_logistics">
                <LogisticsCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/logistics/:id/edit"
            element={
              <PermissionGuard menuCode="masters_purchase_logistics">
                <LogisticsEditPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/source-list"
            element={
              <PermissionGuard menuCode="masters_purchase_source_list">
                <SourceListMasterPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/source-list/new"
            element={
              <PermissionGuard menuCode="masters_purchase_source_list">
                <SourceListUpsertPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/source-list/:id/edit"
            element={
              <PermissionGuard menuCode="masters_purchase_source_list">
                <SourceListUpsertPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/vendor-evaluation"
            element={
              <PermissionGuard menuCode="masters_purchase_vendor_evaluation">
                <VendorEvaluationMasterPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/vendor-evaluation/new"
            element={
              <PermissionGuard menuCode="masters_purchase_vendor_evaluation">
                <VendorEvaluationUpsertPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/purchase/vendor-evaluation/:id/edit"
            element={
              <PermissionGuard menuCode="masters_purchase_vendor_evaluation">
                <VendorEvaluationUpsertPage />
              </PermissionGuard>
            }
          />
          <Route path="masters/purchase/:purchaseMasterKey" element={<ModulePlaceholderPage />} />
          <Route
            path="masters/quality"
            element={
              <PermissionGuard menuCode="masters_quality">
                <HubLandingPage parentCode="masters_quality" backSegment="masters" title="Quality" />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/quality/item-qcl"
            element={
              <PermissionGuard menuCode="masters_quality">
                <ItemIncomingQclListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/quality/item-qcl/:itemId/view"
            element={
              <PermissionGuard menuCode="masters_quality">
                <ItemIncomingQclEditPage mode="view" />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/quality/item-qcl/:itemId/edit"
            element={
              <PermissionGuard menuCode="masters_quality">
                <ItemIncomingQclEditPage mode="edit" />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/quality/standard-specifications"
            element={
              <PermissionGuard menuCode="masters_quality">
                <StandardSpecificationPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/quality/inspection-checklist"
            element={
              <PermissionGuard menuCode="masters_quality">
                <InspectionChecklistPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/quality/rm-specifications"
            element={
              <PermissionGuard menuCode="masters_quality">
                <RmSpecificationListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/quality/rm-specifications/:itemId/view"
            element={
              <PermissionGuard menuCode="masters_quality">
                <RmSpecificationEditPage mode="view" />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/quality/rm-specifications/:itemId/edit"
            element={
              <PermissionGuard menuCode="masters_quality">
                <RmSpecificationEditPage mode="edit" />
              </PermissionGuard>
            }
          />
          <Route path="masters/quality/:qualityMasterKey" element={<ModulePlaceholderPage />} />
          <Route
            path="masters/stores"
            element={
              <PermissionGuard menuCode="masters_stores">
                <HubLandingPage parentCode="masters_stores" backSegment="masters" title="Inventory Masters" />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/stores/item-inl"
            element={
              <PermissionGuard menuCode="masters_stores">
                <ItemInventoryLevelListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="masters/configuration"
            element={
              <PermissionGuard menuCode="masters_configuration">
                <HubLandingPage
                  parentCode="masters_configuration"
                  backSegment="masters"
                  title="Configuration Masters"
                />
              </PermissionGuard>
            }
          />
          <Route path="masters/configuration/:configMasterKey" element={<ModulePlaceholderPage />} />
          <Route path="masters/stores/:storesMasterKey" element={<ModulePlaceholderPage />} />
          <Route path="masters/:masterKey" element={<ModulePlaceholderPage />} />
          <Route path="masters/*" element={<Navigate to="/app/masters" replace />} />
          <Route
            path="purchase"
            element={
              <PermissionGuard menuCode="purchase">
                <HubLandingPage parentCode="purchase" backSegment="dashboard" title="Purchase" />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-indent"
            element={
              <PermissionGuard menuCode="purchase_purchase_indent">
                <PurchaseIndentListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-indent/approved"
            element={
              <PermissionGuard menuCode="purchase_approved_purchase_indents">
                <PurchaseIndentApprovedListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-indent/new"
            element={
              <PermissionGuard menuCode="purchase_purchase_indent">
                <PurchaseIndentCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-indent/:id/edit"
            element={
              <PermissionGuard menuCode="purchase_purchase_indent">
                <PurchaseIndentCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-indent/:id/print"
            element={
              <PermissionGuard menuCode="purchase_purchase_indent">
                <PurchaseIndentPrintPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-indent/:id"
            element={
              <PermissionGuard menuCode="purchase_purchase_indent">
                <PurchaseIndentDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/rfq-management"
            element={
              <PermissionGuard menuCode="purchase_rfq_management">
                <RfqListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/rfq-management/new"
            element={
              <PermissionGuard menuCode="purchase_rfq_management">
                <RfqCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/rfq-management/:id/edit"
            element={
              <PermissionGuard menuCode="purchase_rfq_management">
                <RfqCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/rfq-management/:id/print"
            element={
              <PermissionGuard menuCode="purchase_rfq_management">
                <RfqPrintPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/rfq-management/:id"
            element={
              <PermissionGuard menuCode="purchase_rfq_management">
                <RfqDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/material-purchase-planning"
            element={
              <PermissionGuard menuCode="purchase_material_purchase_planning">
                <MaterialPurchasePlanningPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/vendor-evaluation"
            element={
              <PermissionGuard menuCode="purchase_vendor_evaluation">
                <VendorEvaluationDashboardPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/vendor-evaluation/list"
            element={
              <PermissionGuard menuCode="purchase_vendor_evaluation">
                <VendorEvaluationListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/vendor-evaluation/compare"
            element={
              <PermissionGuard menuCode="purchase_vendor_evaluation">
                <VendorEvaluationComparisonPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/vendor-evaluation/:vendorCode/scorecard"
            element={
              <PermissionGuard menuCode="purchase_vendor_evaluation">
                <VendorEvaluationScorecardPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/vendor-evaluation/:vendorCode/trend"
            element={
              <PermissionGuard menuCode="purchase_vendor_evaluation">
                <VendorEvaluationTrendPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/vendor-evaluation/:vendorCode/history"
            element={
              <PermissionGuard menuCode="purchase_vendor_evaluation">
                <VendorEvaluationHistoryPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/vendor-evaluation/:vendorCode"
            element={
              <PermissionGuard menuCode="purchase_vendor_evaluation">
                <VendorEvaluationDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order"
            element={
              <PermissionGuard menuCode="purchase_purchase_order">
                <HubLandingPage
                  parentCode="purchase_purchase_order"
                  backSegment="purchase"
                  title="Purchase Order"
                />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order/generate-po"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_generate_po">
                <PurchaseOrderListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order/generate-po/new"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_generate_po">
                <PurchaseOrderCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order/generate-po/:id/edit"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_generate_po">
                <PurchaseOrderCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order/generate-po/:id/print"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_generate_po">
                <PurchaseOrderPrintPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order/generate-po/:id"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_generate_po">
                <PurchaseOrderDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order/amend-po"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_amend_po">
                <AmendPoListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order/amend-po/:id/edit"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_amend_po">
                <PurchaseOrderCreatePage amendMode />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order/amend-po/:id"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_amend_po">
                <AmendPoDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order/cancel-po"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_cancel_po">
                <CancelPoListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order/cancel-po/:id"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_cancel_po">
                <CancelPoDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order/short-po-closing"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_short_po_closing">
                <ModulePlaceholderPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order/repeat-po"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_repeat_po">
                <ModulePlaceholderPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order-domestic"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_domestic">
                <PurchaseOrderListPage workspace="domestic" />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order-domestic/new"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_domestic">
                <PurchaseOrderCreatePage workspace="domestic" />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order-domestic/:id/edit"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_domestic">
                <PurchaseOrderCreatePage workspace="domestic" />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order-domestic/:id/print"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_domestic">
                <PurchaseOrderPrintPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order-domestic/:id"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_domestic">
                <PurchaseOrderDetailPage workspace="domestic" />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order-import"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_import">
                <PurchaseOrderListPage workspace="import" />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order-import/new"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_import">
                <PurchaseOrderCreatePage workspace="import" />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order-import/:id/edit"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_import">
                <PurchaseOrderCreatePage workspace="import" />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order-import/:id/print"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_import">
                <PurchaseOrderPrintPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/purchase-order-import/:id"
            element={
              <PermissionGuard menuCode="purchase_purchase_order_import">
                <PurchaseOrderDetailPage workspace="import" />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/goods-receipt"
            element={
              <PermissionGuard menuCode="stores_grn">
                <GoodsReceiptListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/goods-receipt/new"
            element={
              <PermissionGuard menuCode="stores_grn">
                <GoodsReceiptCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/goods-receipt/:id/edit"
            element={
              <PermissionGuard menuCode="stores_grn">
                <GoodsReceiptCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/goods-receipt/:id/print"
            element={
              <PermissionGuard menuCode="stores_grn">
                <GoodsReceiptPrintPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/goods-receipt/:id"
            element={
              <PermissionGuard menuCode="stores_grn">
                <GoodsReceiptDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/service-po"
            element={
              <PermissionGuard menuCode="purchase_service_po">
                <HubLandingPage
                  parentCode="purchase_service_po"
                  backSegment="purchase"
                  title="Service PO"
                />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/service-po/generate-spo"
            element={
              <PermissionGuard menuCode="purchase_service_po_generate_spo">
                <ServicePurchaseOrderListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/service-po/generate-spo/new"
            element={
              <PermissionGuard menuCode="purchase_service_po_generate_spo">
                <ServicePurchaseOrderCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/service-po/generate-spo/:id/edit"
            element={
              <PermissionGuard menuCode="purchase_service_po_generate_spo">
                <ServicePurchaseOrderCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/service-po/generate-spo/:id/print"
            element={
              <PermissionGuard menuCode="purchase_service_po_generate_spo">
                <ServicePurchaseOrderPrintPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/service-po/cancel-spo"
            element={
              <PermissionGuard menuCode="purchase_service_po_cancel_spo">
                <CancelSpoListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/service-po/cancel-spo/:id"
            element={
              <PermissionGuard menuCode="purchase_service_po_cancel_spo">
                <CancelSpoDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/service-po/amend-spo"
            element={
              <PermissionGuard menuCode="purchase_service_po_amend_spo">
                <AmendSpoListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/service-po/amend-spo/:id/edit"
            element={
              <PermissionGuard menuCode="purchase_service_po_amend_spo">
                <ServicePurchaseOrderCreatePage amendMode />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/service-po/amend-spo/:id"
            element={
              <PermissionGuard menuCode="purchase_service_po_amend_spo">
                <AmendSpoDetailPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/job-work"
            element={
              <PermissionGuard menuCode="purchase_job_work">
                <HubLandingPage parentCode="purchase_job_work" backSegment="purchase" title="Job Work" />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/job-work/generate-jwo"
            element={
              <PermissionGuard menuCode="purchase_job_work_generate_jwo">
                <JobWorkOrderListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/job-work/generate-jwo/new"
            element={
              <PermissionGuard menuCode="purchase_job_work_generate_jwo">
                <JobWorkOrderCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="purchase/job-work/generate-jwo/:id/edit"
            element={
              <PermissionGuard menuCode="purchase_job_work_generate_jwo">
                <JobWorkOrderCreatePage />
              </PermissionGuard>
            }
          />
          <Route path="purchase/:purchaseKey" element={<ModulePlaceholderPage />} />
          <Route path="purchase/*" element={<Navigate to="/app/purchase" replace />} />
          <Route
            path="stores"
            element={
              <PermissionGuard menuCode="stores">
                <HubLandingPage parentCode="stores" backSegment="dashboard" title="Inventory" />
              </PermissionGuard>
            }
          />
          <Route
            path="stores/grn"
            element={
              <PermissionGuard menuCode="stores_grn">
                <GoodsReceiptListPage />
              </PermissionGuard>
            }
          />
          <Route
            path="stores/grn/new"
            element={
              <PermissionGuard menuCode="stores_grn">
                <GoodsReceiptCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="stores/grn/:id/edit"
            element={
              <PermissionGuard menuCode="stores_grn">
                <GoodsReceiptCreatePage />
              </PermissionGuard>
            }
          />
          <Route
            path="stores/grn/:id/print"
            element={
              <PermissionGuard menuCode="stores_grn">
                <GoodsReceiptPrintPage />
              </PermissionGuard>
            }
          />
          <Route
            path="stores/grn/:id"
            element={
              <PermissionGuard menuCode="stores_grn">
                <GoodsReceiptDetailPage />
              </PermissionGuard>
            }
          />
          <Route path="stores/goods-transfer" element={<StockTransferListPage />} />
          <Route path="stores/:storesKey" element={<ModulePlaceholderPage />} />
          <Route path="stores/*" element={<Navigate to="/app/stores" replace />} />
          <Route
            path="quality"
            element={
              <PermissionGuard menuCode="quality">
                <HubLandingPage parentCode="quality" backSegment="dashboard" title="Quality" />
              </PermissionGuard>
            }
          />
          <Route path="quality/:qualityKey" element={<ModulePlaceholderPage />} />
          <Route path="quality/*" element={<Navigate to="/app/quality" replace />} />
          <Route
            path="finance"
            element={
              <PermissionGuard menuCode="finance">
                <HubLandingPage parentCode="finance" backSegment="dashboard" title="Finance" />
              </PermissionGuard>
            }
          />
          <Route path="finance/:financeKey" element={<ModulePlaceholderPage />} />
          <Route path="finance/*" element={<Navigate to="/app/finance" replace />} />
          <Route path=":hubSegment/module-:moduleNum" element={<ModulePlaceholderPage />} />
          <Route path=":hubSegment" element={<DynamicSegmentHubRoute />} />

          {Object.entries(LEGACY_MENU_REDIRECTS).map(([legacy, target]) => (
            <Route
              key={`legacy-${legacy}`}
              path={legacy}
              element={<Navigate to={target} replace />}
            />
          ))}
          <Route path="configuration" element={
            <PermissionGuard menuCode="settings">
              <HubLandingPage parentCode="settings" backSegment="dashboard" title="Settings" />
            </PermissionGuard>
          } />
          <Route path="configuration/menu-setup" element={
            <PermissionGuard menuCode="menu_setup">
              <MenuSetupPage />
            </PermissionGuard>
          } />
          <Route path="configuration/modules-setup" element={
            <PermissionGuard menuCode="modules_setup">
              <ModulesSetupPage />
            </PermissionGuard>
          } />
          <Route path="configuration/groups-setup" element={
            <PermissionGuard menuCode="groups_setup">
              <GroupsSetupPage />
            </PermissionGuard>
          } />
          <Route path="configuration/icons-setup" element={
            <PermissionGuard menuCode="icons_setup">
              <MenuIconsSetupPage />
            </PermissionGuard>
          } />
          <Route path="configuration/application-setup" element={
            <PermissionGuard menuCode="application_setup">
              <ApplicationSetupPage />
            </PermissionGuard>
          } />
          <Route path="configuration/dashboard-role-mapping" element={
            <PermissionGuard menuCode="dashboard_role_mapping">
              <RoleDashboardMappingPage />
            </PermissionGuard>
          } />
          <Route path="configuration/company" element={
            <PermissionGuard menuCode="company_setup">
              <CompanySetupPage />
            </PermissionGuard>
          } />
          <Route path="configuration/location-master" element={
            <PermissionGuard menuCode="location_master">
              <LocationMasterPage />
            </PermissionGuard>
          } />
          <Route path="configuration/location-master/new" element={
            <PermissionGuard menuCode="location_master">
              <LocationCreatePage />
            </PermissionGuard>
          } />
          <Route path="configuration/location-master/:id/edit" element={
            <PermissionGuard menuCode="location_master">
              <LocationEditPage />
            </PermissionGuard>
          } />
          <Route path="configuration/sub-locations" element={
            <PermissionGuard menuCode="sub_locations">
              <SubLocationsPage />
            </PermissionGuard>
          } />
          <Route path="configuration/inventory-stores" element={
            <PermissionGuard menuCode="inventory_stores">
              <InventoryStoresPage />
            </PermissionGuard>
          } />
          <Route path="configuration/inventory-stores/new" element={
            <PermissionGuard menuCode="inventory_stores">
              <InventoryStoreCreatePage />
            </PermissionGuard>
          } />
          <Route path="configuration/inventory-stores/:id/edit" element={
            <PermissionGuard menuCode="inventory_stores">
              <InventoryStoreEditPage />
            </PermissionGuard>
          } />
          <Route path="configuration/roles-access" element={
            <PermissionGuard menuCode="roles_access">
              <RolesAccessMenu />
            </PermissionGuard>
          } />
          <Route path="configuration/roles-access/user-management" element={
            <PermissionGuard menuCode="roles_access">
              <UserManagementPage />
            </PermissionGuard>
          } />
          <Route path="configuration/roles-access/access-management" element={
            <PermissionGuard menuCode="roles_access">
              <AccessManagementPage />
            </PermissionGuard>
          } />
          <Route path="configuration/roles-access/permission-management" element={
            <PermissionGuard menuCode="roles_access">
              <PermissionManagementPage />
            </PermissionGuard>
          } />
          <Route path="configuration/roles-access/module-management/:id" element={
            <PermissionGuard menuCode="roles_access">
              <ModuleManagementPage />
            </PermissionGuard>
          } />
          <Route path="configuration/auto-increment" element={
            <PermissionGuard menuCode="auto_increment">
              <AutoIncrementPage />
            </PermissionGuard>
          } />
          <Route path="configuration/master-data" element={
            <PermissionGuard menuCode="master_data">
              <MasterDataPage />
            </PermissionGuard>
          } />
          <Route path="configuration/po-type" element={
            <PermissionGuard menuCode="po_type">
              <PoTypeMasterPage />
            </PermissionGuard>
          } />
          <Route path="configuration/incidental-expenses" element={
            <PermissionGuard menuCode="incidental_expenses">
              <IncidentalExpensesMasterPage />
            </PermissionGuard>
          } />
          <Route path="configuration/po-terms-and-conditions" element={
            <PermissionGuard menuCode="po_terms_and_conditions">
              <PoTermsAndConditionsPage />
            </PermissionGuard>
          } />
          <Route path="configuration/item-document-types" element={
            <PermissionGuard menuCode="item_document_types">
              <ItemDocumentTypesPage />
            </PermissionGuard>
          } />
          <Route path="configuration/item-attributes" element={
            <PermissionGuard menuCode="item_attributes">
              <ItemAttributeDefinitionsPage />
            </PermissionGuard>
          } />
          <Route path="configuration/email-setup" element={
            <PermissionGuard menuCode="email_setup">
              <EmailSetupPage />
            </PermissionGuard>
          } />
          <Route path="configuration/audit-logs" element={
            <PermissionGuard menuCode="audit_logs">
              <AuditLogsPage />
            </PermissionGuard>
          } />
          <Route path="configuration/active-users" element={
            <PermissionGuard menuCode="active_users">
              <ActiveUsersPage />
            </PermissionGuard>
          } />
          <Route path="configuration/bulk-import" element={
            <PermissionGuard menuCode="bulk_import">
              <BulkImportPage />
            </PermissionGuard>
          } />
          <Route path="configuration/file-manager" element={
            <PermissionGuard menuCode="file_manager">
              <FileManagerPage />
            </PermissionGuard>
          } />
          <Route path="configuration/:groupSlug" element={
            <DynamicGroupRoute sidebarCode="settings" />
          } />
          <Route path="configuration/chart-of-accounts/*" element={<Navigate to="configuration" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}
