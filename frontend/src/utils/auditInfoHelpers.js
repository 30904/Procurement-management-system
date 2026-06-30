function formatAuditDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function displayUser(value) {
  if (!value) return "—";
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "object") {
    return value.name || value.userName || value.fullName || value.email || "—";
  }
  return String(value);
}

/**
 * Build read-only audit rows from a procurement document.
 * @param {Record<string, unknown>} doc
 * @param {{ documentType?: "indent" | "po" | "grn" }} [options]
 */
export function buildAuditInformationRows(doc, options = {}) {
  if (!doc) return [];

  const tracking = doc.approvalTracking || {};
  const receiving = doc.receivingAuthority || {};
  const documentType = options.documentType || "po";
  const status = String(doc.status || "").toLowerCase();

  if (documentType === "rfq") {
    return [
      { label: "Created By", value: displayUser(doc.createdByName || doc.createdBy || doc.buyer) },
      { label: "Created Date", value: formatAuditDate(doc.createdAt) },
      { label: "Modified By", value: displayUser(doc.updatedByName || doc.updatedBy) },
      { label: "Modified Date", value: formatAuditDate(doc.updatedAt) },
      { label: "Status", value: doc.displayStatus || doc.status || "—" },
    ];
  }

  const rows = [
    { label: "Created By", value: displayUser(doc.createdByName || doc.createdBy) },
    { label: "Created Date", value: formatAuditDate(doc.createdAt) },
    { label: "Modified By", value: displayUser(doc.updatedByName || doc.updatedBy) },
    { label: "Modified Date", value: formatAuditDate(doc.updatedAt) },
  ];

  if (documentType === "grn") {
    rows.push(
      {
        label: "Posted By",
        value:
          status === "posted"
            ? displayUser(receiving.receivedByName || doc.updatedByName || doc.updatedBy)
            : "—",
      },
      {
        label: "Posted Date",
        value: status === "posted" ? formatAuditDate(doc.updatedAt) : "—",
      }
    );
  } else {
    rows.push(
      {
        label: "Posted By",
        value: status === "posted" ? displayUser(doc.postedByName || doc.postedBy) : "—",
      },
      {
        label: "Posted Date",
        value: formatAuditDate(doc.postedAt),
      }
    );
  }

  rows.push(
    {
      label: "Approval Status",
      value: tracking.approvalStatus || (status === "approved" ? "Approved" : doc.status || "—"),
    },
    {
      label: "Approval Date",
      value: formatAuditDate(tracking.approvalDate),
    }
  );

  if (tracking.approvedBy || tracking.approvalAuthority) {
    rows.splice(rows.length - 1, 0, {
      label: "Approved By",
      value: displayUser(tracking.approvedBy || tracking.approvalAuthority),
    });
  }

  return rows;
}
