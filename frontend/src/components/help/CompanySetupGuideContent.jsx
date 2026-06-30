import { appPath } from "../../config/navigation.js";
import styles from "./CompanySetupGuideContent.module.css";

/**
 * @param {{ onNavigate?: (segment: string) => void, hideHeroTitle?: boolean }} props
 */
export default function CompanySetupGuideContent({ onNavigate, hideHeroTitle = false }) {
  const link = (segment, label) => {
    if (onNavigate) {
      return (
        <button type="button" className={styles.inlineLink} onClick={() => onNavigate(segment)}>
          {label}
        </button>
      );
    }
    return <a href={appPath(segment)}>{label}</a>;
  };

  return (
    <article className={styles.article}>
      <header className={styles.hero}>
        {!hideHeroTitle ? (
          <h1 className={styles.heroTitle}>Company Setup — Foundation Guide</h1>
        ) : null}
        <p>
          How to configure your organization in the Procurement Management System: company profile, locations,
          sub-locations, inventory stores, and how single-site vs multi-location deployments differ.
        </p>
      </header>

      <section className={styles.section} id="overview">
        <h2>1. Why Company Setup matters</h2>
        <p>
          Everything in the ERP — purchase, stores, sales, production, and reporting — hangs off a
          clear <strong>company → location → store</strong> foundation. Getting this right once avoids
          GST mismatches, stock in the wrong plant, and users seeing data they should not.
        </p>
        <div className={styles.hierarchy}>
          <div className={`${styles.hierBox} ${styles.hierCompany}`}>
            <strong>Company</strong>
            <span>Legal entity, PAN, GST classification, branding</span>
          </div>
          <div className={styles.hierArrow} aria-hidden>
            ↓
          </div>
          <div className={`${styles.hierBox} ${styles.hierLocation}`}>
            <strong>Location</strong>
            <span>Branch, plant, warehouse, or head office — own address &amp; GSTIN</span>
          </div>
          <div className={styles.hierArrow} aria-hidden>
            ↓
          </div>
          <div className={`${styles.hierBox} ${styles.hierChild}`}>
            <strong>Sub-location</strong>
            <span>Optional zones inside a plant (Production, QC, Stores…)</span>
          </div>
          <div className={styles.hierArrow} aria-hidden>
            ↓
          </div>
          <div className={`${styles.hierBox} ${styles.hierChild}`}>
            <strong>Inventory store</strong>
            <span>Physical/logical stock buckets (RM, FG, Scrap…)</span>
          </div>
        </div>
      </section>

      <section className={styles.section} id="modules">
        <h2>2. The four setup modules</h2>
        <div className={styles.moduleGrid}>
          <div className={styles.moduleCard}>
            <h3>Company</h3>
            <p>
              Registration details, constitution, PAN, GST classification, and company-level settings.
              One record per tenant. Location-specific GSTIN is configured under Location Master.
            </p>
          </div>
          <div className={styles.moduleCard}>
            <h3>Location Master</h3>
            <p>
              Operating sites: factory, depot, HO. Each has address, optional GSTIN, module flags
              (purchase, sales, production…), and default RM/FG/Scrap stores after stores exist.
            </p>
          </div>
          <div className={styles.moduleCard}>
            <h3>Sub Location Master</h3>
            <p>
              Finer areas inside one location — e.g. Assembly Line 1, QC Lab. Shares parent GSTIN;
              used on transactions and future shop-floor modules.
            </p>
          </div>
          <div className={styles.moduleCard}>
            <h3>Inventory Stores</h3>
            <p>
              Stock-holding units per location (RM-MAIN, FG-MAIN, etc.). GRN, issues, and transfers
              post quantities to a store. Mark one default store per type where needed.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.section} id="order">
        <h2>3. Recommended setup order</h2>
        <div className={styles.flowRow}>
          <div className={styles.flowStep}>
            <span className={styles.flowStepNum}>1</span>
            <span className={styles.flowStepTitle}>Company</span>
          </div>
          <span className={styles.flowArrow} aria-hidden>
            →
          </span>
          <div className={styles.flowStep}>
            <span className={styles.flowStepNum}>2</span>
            <span className={styles.flowStepTitle}>Locations</span>
          </div>
          <span className={styles.flowArrow} aria-hidden>
            →
          </span>
          <div className={styles.flowStep}>
            <span className={styles.flowStepNum}>3</span>
            <span className={styles.flowStepTitle}>Stores</span>
          </div>
          <span className={styles.flowArrow} aria-hidden>
            →
          </span>
          <div className={styles.flowStep}>
            <span className={styles.flowStepNum}>4</span>
            <span className={styles.flowStepTitle}>Sub-locations</span>
          </div>
          <span className={styles.flowArrow} aria-hidden>
            →
          </span>
          <div className={styles.flowStep}>
            <span className={styles.flowStepNum}>5</span>
            <span className={styles.flowStepTitle}>Users &amp; access</span>
          </div>
        </div>
        <p>
          Create <strong>inventory stores</strong> before assigning default stores on the location edit
          screen. Sub-locations can be added anytime but are easier once the parent location exists.
        </p>
      </section>

      <section className={styles.section} id="single-vs-multi">
        <h2>4. Single location vs multi-location</h2>
        <div className={styles.compareGrid}>
          <div className={styles.compareCard}>
            <h3>Single location</h3>
            <ul>
              <li>One factory or office — e.g. only &quot;Factory&quot; or &quot;HO&quot;</li>
              <li>Mark one location as <strong>Head office / central</strong></li>
              <li>All PO, GRN, SO, stock use that location</li>
              <li>Header location switcher shows one site (or hidden)</li>
              <li>Simplest GST and stock reporting</li>
            </ul>
          </div>
          <div className={styles.compareCard}>
            <h3>Multi-location</h3>
            <ul>
              <li>HO + plants, or multiple factories in different states</li>
              <li>Each location may have its own <strong>GSTIN</strong></li>
              <li>Stock and documents are scoped per location</li>
              <li>Users get <strong>allowed locations</strong>; header switcher picks working site</li>
              <li>Transfers move stock between locations</li>
            </ul>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Topic</th>
                <th>Single location</th>
                <th>Multi-location</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Locations to create</td>
                <td>1 (mark as HO/central)</td>
                <td>2 or more</td>
              </tr>
              <tr>
                <td>GSTIN</td>
                <td>On location or use company-level GST</td>
                <td>Per location where registered</td>
              </tr>
              <tr>
                <td>Inventory stores</td>
                <td>RM / FG / Scrap under that site</td>
                <td>Repeat store set per plant</td>
              </tr>
              <tr>
                <td>Document numbers</td>
                <td>May include location prefix (e.g. PUN-PO-000001)</td>
                <td>Unique series per location</td>
              </tr>
              <tr>
                <td>User access</td>
                <td>All users on one site</td>
                <td>Restrict by allowed locations</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section} id="example-single">
        <h2>5. Example — single manufacturing site</h2>
        <div className={styles.example}>
          <p className={styles.exampleTitle}>Acme Tools Pvt Ltd — one plant in Bengaluru</p>
          <ol>
            <li>
              <strong>Company:</strong> Legal name, PAN, GST classification (B2B Regular).
            </li>
            <li>
              <strong>Location:</strong> ID = Factory, type Factory, GSTIN for Karnataka, mark as
              central/HO if it is the only site.
            </li>
            <li>
              <strong>Stores at Factory:</strong> RM-MAIN, CON-MAIN, FG-MAIN, SCR-MAIN — set defaults on
              location edit.
            </li>
            <li>
              <strong>Sub-locations (optional):</strong> Production Floor, Quality, Dispatch Bay.
            </li>
            <li>Purchase GRN and sales issues post stock to RM-MAIN / FG-MAIN automatically.</li>
          </ol>
        </div>
        <div className={styles.diagramBox}>
          {`Company: Acme Tools Pvt Ltd
└── Location: Factory (HO, GSTIN 29AAAAA0000A1Z5)
      ├── Sub: Production Floor
      ├── Sub: Quality Lab
      └── Stores: RM-MAIN | CON-MAIN | FG-MAIN | SCR-MAIN`}
        </div>
      </section>

      <section className={styles.section} id="example-multi">
        <h2>6. Example — multi-location group</h2>
        <div className={styles.example}>
          <p className={styles.exampleTitle}>Acme Tools — HO in Mumbai + plants in Pune and Bengaluru</p>
          <ol>
            <li>
              <strong>Company:</strong> Group legal entity and GST classification at company level.
            </li>
            <li>
              <strong>Location HO:</strong> Corporate office, uses company GST or separate HO GSTIN,
              central flag = Yes, purchase/sales flags as needed for HO transactions.
            </li>
            <li>
              <strong>Location Pune Plant / Bengaluru Plant:</strong> Each with state, address, own
              GSTIN, own store set.
            </li>
            <li>
              <strong>Users:</strong> Plant buyers see only their plant; group admin sees all locations.
            </li>
            <li>Stock transfer moves material Pune → Bengaluru with location-scoped documents.</li>
          </ol>
        </div>
        <div className={styles.diagramBox}>
          {`Company: Acme Tools Pvt Ltd
├── Location: HO (Mumbai) — central
│     └── Stores: GEN-01, FG-MAIN
├── Location: Pune Plant (GSTIN …)
│     ├── Sub: Shop Floor A
│     └── Stores: RM-MAIN, FG-MAIN, SCR-MAIN
└── Location: Bengaluru Plant (GSTIN …)
      └── Stores: RM-MAIN, FG-MAIN, SCR-MAIN`}
        </div>
      </section>

      <section className={styles.section} id="transactions">
        <h2>7. How locations affect daily transactions</h2>
        <p>
          Masters such as <strong>Vendor</strong> and <strong>Customer</strong> are company-wide.
          Operational documents are location-scoped:
        </p>
        <ul>
          <li>
            <strong>Purchase:</strong> PO → GRN → PINV carry <code>locationId</code>; GRN increases stock
            in the chosen store at that location.
          </li>
          <li>
            <strong>Sales:</strong> SO → Delivery → SINV; delivery reduces FG store at the shipping
            location.
          </li>
          <li>
            <strong>Stores:</strong> Stock balance and transfers are always per location + store.
          </li>
        </ul>
        <div className={styles.diagramBox}>
          {`User selects working location (header)
        │
        ▼
Create PO / GRN / SO  ──►  locationId + storeId saved
        │
        ▼
Reports & lists filter to allowed locations only`}
        </div>
      </section>

      <section className={styles.section} id="users">
        <h2>8. Users, roles, and the location switcher</h2>
        <p>
          Menu access is controlled by <strong>roles</strong> (Settings → Roles &amp; Access). Data
          visibility is controlled by <strong>allowed locations</strong> on each user.
        </p>
        <ul>
          <li>
            <strong>Super Admin</strong> — all locations, all setup screens.
          </li>
          <li>
            <strong>Admin / functional users</strong> — assigned locations only; switcher changes
            working location for new documents and lists.
          </li>
        </ul>
        <p className={styles.tip}>
          Tip: After adding a new plant, update user allowed locations and create stores before users
          post GRNs at that site.
        </p>
      </section>

      <section className={styles.section} id="checklist">
        <h2>9. Go-live checklist</h2>
        <ul className={styles.checklist}>
          <li>Company registration and GST classification saved</li>
          <li>Every operating site created in Location Master with correct GSTIN</li>
          <li>Exactly one head office / central location marked (if applicable)</li>
          <li>Inventory stores created per location; defaults set on location edit</li>
          <li>Sub-locations added where shop-floor tracking is needed</li>
          <li>Users assigned roles and allowed locations</li>
          <li>Test PO + GRN at each plant and verify stock in the right store</li>
        </ul>
      </section>

      <section className={styles.section} id="links">
        <h2>10. Open setup screens</h2>
        <p>Use these paths from Settings → Company Setup (requires appropriate permissions):</p>
        <ul className={styles.setupLinks}>
          <li>{link("configuration/company", "Company profile")}</li>
          <li>{link("configuration/location-master", "Location Master")}</li>
          <li>{link("configuration/sub-locations", "Sub Location Master")}</li>
          <li>{link("configuration/inventory-stores", "Inventory Stores")}</li>
        </ul>
      </section>
    </article>
  );
}
