import { Globe2, Landmark, MapPin, Ship } from "lucide-react";
import { formatSupplierAddressLine, primarySupplierContact } from "../../utils/domesticSupplier.js";
import styles from "./ImportSupplierInsightPanel.module.css";

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

export default function ImportSupplierInsightPanel({ supplier, landedCostSummary }) {
  if (!supplier) return null;

  const contact = primarySupplierContact(supplier);
  const address = formatSupplierAddressLine(supplier);
  const currency = supplier.supplierCurrency || "USD";
  const incoterm = supplier.supplierINCOTerms || "—";

  return (
    <section className={styles.panel} aria-label="Import supplier details">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Import supplier</p>
          <h2 className={styles.title}>{supplier.supplierName}</h2>
          <p className={styles.meta}>
            {supplier.supplierCode}
            {supplier.countryOfOrigin ? ` · Origin: ${supplier.countryOfOrigin}` : ""}
          </p>
        </div>
        <div className={styles.badges}>
          <span className={styles.badge}>{incoterm}</span>
          <span className={styles.badgeMuted}>{currency}</span>
        </div>
      </header>

      <div className={styles.grid}>
        <InfoCell icon={Ship} label="INCOTerms" value={incoterm !== "—" ? incoterm : ""} />
        <InfoCell icon={Globe2} label="Supplier currency" value={currency} />
        <InfoCell
          icon={Landmark}
          label="Bank / SWIFT"
          value={
            supplier.supplierBankDetails?.[0]?.bankSwiftCode ||
            supplier.supplierBankDetails?.[0]?.bankName ||
            ""
          }
        />
        <InfoCell icon={MapPin} label="Billing address" value={address} />
        {contact ? (
          <InfoCell
            icon={Globe2}
            label="Contact"
            value={[contact.name, contact.email, contact.mobile].filter(Boolean).join(" · ")}
          />
        ) : null}
      </div>

      {landedCostSummary ? (
        <footer className={styles.footer}>
          <span>Est. landed cost (INR)</span>
          <strong>
            ₹{" "}
            {Number(landedCostSummary.totalLandedCostInr || 0).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </strong>
        </footer>
      ) : null}
    </section>
  );
}
