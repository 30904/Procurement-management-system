import { Building2, CreditCard, FileBadge, MapPin, Phone, User } from "lucide-react";
import { primarySupplierState, resolveSupplyType } from "../../utils/poGstCalculation.js";
import {
  formatSupplierAddressLine,
  primarySupplierContact,
} from "../../utils/domesticSupplier.js";
import styles from "./DomesticSupplierInsightPanel.module.css";

function InfoCell({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className={styles.cell}>
      <Icon size={15} className={styles.cellIcon} aria-hidden />
      <div>
        <span className={styles.cellLabel}>{label}</span>
        <span className={styles.cellValue}>{value}</span>
      </div>
    </div>
  );
}

export default function DomesticSupplierInsightPanel({
  supplier,
  buyerGstin = "",
  buyerState = "",
  poValue,
}) {
  if (!supplier) return null;

  const contact = primarySupplierContact(supplier);
  const address = formatSupplierAddressLine(supplier);
  const supplyType = resolveSupplyType({
    buyerGstin,
    supplierGstin: supplier.gstin,
    buyerState,
    supplierState: primarySupplierState(supplier),
  });
  const supplyLabel = supplyType === "inter" ? "Inter-state (IGST)" : "Intra-state (CGST + SGST)";
  const totalPo = Number(poValue?.totalPoValue ?? 0);

  return (
    <section className={styles.panel} aria-label="Domestic supplier details">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Domestic supplier</p>
          <h2 className={styles.title}>{supplier.supplierName}</h2>
          <p className={styles.meta}>
            {supplier.supplierCode}
            {supplier.supplierVendorCode ? ` · Vendor ${supplier.supplierVendorCode}` : ""}
          </p>
        </div>
        <div className={styles.badges}>
          <span className={styles.badge}>{supplyLabel}</span>
          <span className={styles.badgeMuted}>{supplier.supplierCurrency || "INR"}</span>
        </div>
      </header>

      <div className={styles.grid}>
        <InfoCell icon={FileBadge} label="GSTIN" value={supplier.gstin || "Unregistered / URD"} />
        <InfoCell
          icon={Building2}
          label="GST classification"
          value={supplier.gstClassification || "—"}
        />
        <InfoCell icon={CreditCard} label="Payment terms" value={supplier.supplierPaymentTerms} />
        <InfoCell icon={FileBadge} label="MSME" value={supplier.supplierMSMENo} />
        <InfoCell icon={MapPin} label="Billing address" value={address} />
        {contact ? (
          <InfoCell
            icon={User}
            label="Contact"
            value={[contact.name, contact.designation].filter(Boolean).join(" · ")}
          />
        ) : null}
        {contact?.mobile || contact?.email ? (
          <InfoCell
            icon={Phone}
            label="Reach"
            value={[contact.mobile, contact.email].filter(Boolean).join(" · ")}
          />
        ) : null}
      </div>

      {totalPo > 0 ? (
        <footer className={styles.footer}>
          <span>Estimated PO value (incl. tax on print)</span>
          <strong>
            {totalPo.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{" "}
            {supplier.supplierCurrency || "INR"}
          </strong>
        </footer>
      ) : null}
    </section>
  );
}
