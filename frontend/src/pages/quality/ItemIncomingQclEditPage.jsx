import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import MasterFormBreadcrumbToolbar from "../../components/masters/MasterFormBreadcrumbToolbar.jsx";
import InputField from "../../components/subcomponents/InputField.jsx";
import SelectField from "../../components/subcomponents/SelectField.jsx";
import { MASTER_DATA_CATEGORY } from "../../config/masterDataCategories.js";
import { DEFAULT_ITEM_INCOMING_QCL_OPTIONS } from "../../config/itemIncomingQclDefaults.js";
import { useToast } from "../../hooks/useToast.js";
import { useMasterDataOptions } from "../../hooks/useMasterDataOptions.js";
import {
  getItemIncomingQclRequest,
  saveItemIncomingQclRequest,
} from "../../services/api.js";
import toolbarStyles from "../../styles/page-toolbar.module.css";
import styles from "./ItemIncomingQclEditPage.module.css";
import "../../styles/theme.css";
import "../../styles/global.css";
import "../../styles/subcomponents.css";
import "../../styles/erp-layout.css";

const STATUS_OPTIONS = [
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

export default function ItemIncomingQclEditPage({ mode: modeProp }) {
  const { itemId } = useParams();
  const toast = useToast();
  const readOnly = modeProp === "view";
  const { options: qclOptions, loading: qclLoading } = useMasterDataOptions(
    MASTER_DATA_CATEGORY.ITEM_INCOMING_QCL
  );
  const qclSelectOptions = useMemo(
    () => (qclOptions.length ? qclOptions : DEFAULT_ITEM_INCOMING_QCL_OPTIONS),
    [qclOptions]
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qclLevel, setQclLevel] = useState("");
  const [shelfLifeMonths, setShelfLifeMonths] = useState("");
  const [item, setItem] = useState(null);

  const loadRecord = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    try {
      const res = await getItemIncomingQclRequest(itemId);
      const data = res?.data ?? {};
      setItem(data);
      const iq = data.incomingQcl ?? {};
      const storedQcl = String(iq.qclLevel || "").trim();
      setQclLevel(storedQcl);
      setShelfLifeMonths(
        iq.shelfLifeMonths != null && iq.shelfLifeMonths !== "" ? String(iq.shelfLifeMonths) : ""
      );
    } catch (err) {
      toast.error(err?.message || "Failed to load item QCL");
      setItem(null);
    } finally {
      setLoading(false);
    }
  }, [itemId, toast]);

  useEffect(() => {
    loadRecord();
  }, [loadRecord]);

  const resolveQclLabel = (selected) => {
    const key = String(selected || "").trim();
    if (!key) return "";
    const match = qclSelectOptions.find((o) => o.value === key || o.label === key);
    return match?.label || key;
  };

  const handleSave = async () => {
    if (readOnly || !itemId) return;
    const qclLabel = resolveQclLabel(qclLevel);
    if (!qclLabel) {
      toast.error("Please select an incoming QCL level.");
      return;
    }
    setSaving(true);
    try {
      await saveItemIncomingQclRequest(itemId, {
        qclLevel: qclLabel,
        shelfLifeMonths: shelfLifeMonths === "" ? undefined : shelfLifeMonths,
      });
      toast.success("Incoming QCL saved.");
      await loadRecord();
    } catch (err) {
      toast.error(err?.message || "Failed to save incoming QCL");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <MasterFormBreadcrumbToolbar
          defaultHubReturn="masters/quality"
          listSegment="masters/quality/item-qcl"
          listTitle="Material Incoming QCL"
          formTitle="Material - Incoming QCL"
        />
        <p className={styles.loadingText}>Loading…</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className={`erp-page ${toolbarStyles.page}`}>
        <MasterFormBreadcrumbToolbar
          defaultHubReturn="masters/quality"
          listSegment="masters/quality/item-qcl"
          listTitle="Material Incoming QCL"
          formTitle="Material - Incoming QCL"
        />
        <p className={styles.loadingText}>Material not found.</p>
      </div>
    );
  }

  return (
    <div className={`erp-page ${toolbarStyles.page} ${styles.pageWrap}`}>
      <MasterFormBreadcrumbToolbar
        defaultHubReturn="masters/quality"
        listSegment="masters/quality/item-qcl"
        listTitle="Material Incoming QCL"
        formTitle="Material - Incoming QCL"
      />

      <div className={styles.formShell}>
        <div className={styles.formHeader}>Material - Incoming QCL</div>

        <div className={styles.qclBand}>
          <div className={styles.qclField}>
            <SelectField
              label="Incoming QCL"
              required
              options={qclSelectOptions}
              value={qclLevel}
              onChange={setQclLevel}
              locked={readOnly}
              disabled={readOnly || qclLoading}
            />
          </div>
          <div className={styles.shelfField}>
            <InputField
              label="Shelf life"
              value={shelfLifeMonths}
              onChange={setShelfLifeMonths}
              locked={readOnly}
              disabled={readOnly}
              placeholder="0"
            />
            <span className={styles.monthsLabel}>months</span>
          </div>
        </div>

        <div className={styles.itemSection}>
          <div className={styles.itemGrid}>
            <SelectField
              label="Material Category"
              required
              options={[{ value: item.itemCategory, label: item.itemCategory }]}
              value={item.itemCategory}
              locked
            />
            <InputField label="Material Code" required value={item.itemNo} locked />
            <InputField label="Material Name" required value={item.itemName} locked />
            <InputField label="Material Description" required value={item.itemDescription} locked />
          </div>
          <div className={styles.itemGrid}>
            <SelectField
              label="UoM"
              required
              options={[{ value: item.uom, label: item.uom }]}
              value={item.uom}
              locked
            />
            <SelectField
              label="HSN Code"
              required
              options={[{ value: item.hsnCode, label: item.hsnCode }]}
              value={item.hsnCode}
              locked
            />
            <InputField label="Inventory Store" required value={item.inventoryStore} locked />
            <SelectField
              label="Status"
              required
              options={STATUS_OPTIONS}
              value={item.status || "Active"}
              locked
            />
          </div>
        </div>

        <footer className={styles.formFooter}>
          {!readOnly && (
            <button
              type="button"
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
