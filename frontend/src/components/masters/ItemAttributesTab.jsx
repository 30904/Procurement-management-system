import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import ItemAttributeFieldsGrid from "./ItemAttributeFieldsGrid.jsx";
import { isDimensionAttributeCode } from "../../config/itemDimensionAttributes.js";
import styles from "../../pages/masters/ItemUpsertPage.module.css";
import {
  getItemApplicableConfigRequest,
  getItemAttributeValuesRequest,
  getItemComplianceRequest,
  saveItemAttributeValuesRequest,
} from "../../services/api.js";
import { useToast } from "../../hooks/useToast.js";

export default function ItemAttributesTab({
  itemId,
  itemCategory,
  disabled,
  attributeValues,
  onAttributeValuesChange,
  hideDimensionAttributes = true,
}) {
  const toast = useToast();
  const [definitions, setDefinitions] = useState([]);
  const [localValues, setLocalValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [compliance, setCompliance] = useState(null);

  const values = attributeValues !== undefined ? attributeValues : localValues;
  const setValues = onAttributeValuesChange || setLocalValues;

  const visibleDefinitions = useMemo(() => {
    const list = definitions.filter((d) => d.status !== "Inactive");
    if (!hideDimensionAttributes) return list;
    return list.filter((d) => !isDimensionAttributeCode(d.code));
  }, [definitions, hideDimensionAttributes]);

  const loadConfig = useCallback(async () => {
    try {
      const res = await getItemApplicableConfigRequest(itemCategory || "");
      setDefinitions(Array.isArray(res?.data?.attributeDefinitions) ? res.data.attributeDefinitions : []);
    } catch {
      setDefinitions([]);
    }
  }, [itemCategory]);

  const loadValues = useCallback(async () => {
    if (!itemId || attributeValues !== undefined) return;
    try {
      const res = await getItemAttributeValuesRequest(itemId);
      setLocalValues(res?.data?.values || {});
    } catch {
      setLocalValues({});
    }
  }, [itemId, attributeValues]);

  const loadCompliance = useCallback(async () => {
    if (!itemId) {
      setCompliance(null);
      return;
    }
    try {
      const res = await getItemComplianceRequest(itemId);
      setCompliance(res?.data || null);
    } catch {
      setCompliance(null);
    }
  }, [itemId]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    loadValues();
    loadCompliance();
  }, [loadValues, loadCompliance]);

  const setValue = (code, val) => {
    setValues((prev) => ({ ...prev, [code]: val }));
  };

  const handleSave = async () => {
    if (!itemId) return;
    setSaving(true);
    try {
      const res = await saveItemAttributeValuesRequest(itemId, values);
      const next = res?.data?.values || values;
      if (onAttributeValuesChange) onAttributeValuesChange(next);
      else setLocalValues(next);
      toast.success("Attributes saved");
      loadCompliance();
    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed to save attributes");
    } finally {
      setSaving(false);
    }
  };

  if (disabled) {
    return <p className={styles.sectionHint}>Save material details first to enter attribute values.</p>;
  }

  return (
    <div>
      <h2 className={styles.sectionTitle}>Material Attributes</h2>
      <p className={styles.sectionHint}>
        Additional fields for this material category. Dimension fields (Width, Length, etc.) are on the Material Details tab.
        {compliance && !compliance.valid && compliance.missingAttributes?.length ? (
          <span className={styles.complianceWarn} style={{ display: "inline-flex", marginLeft: "0.5vw" }}>
            <AlertCircle size={14} /> Missing required values
          </span>
        ) : compliance?.valid ? (
          <span className={styles.complianceOk} style={{ marginLeft: "0.5vw" }}> — complete</span>
        ) : null}
      </p>
      {visibleDefinitions.length === 0 ? (
        <p className={styles.sectionHint}>No additional attributes apply to this material category.</p>
      ) : (
        <ItemAttributeFieldsGrid definitions={visibleDefinitions} values={values} onChange={setValue} />
      )}
      {visibleDefinitions.length > 0 ? (
        <div className={styles.inlineFooter}>
          <button type="button" className={styles.btnSave} onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Attributes"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
