import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Download a tabular report as landscape A4 PDF (direct file save, no print dialog).
 */
export function downloadReportPdf({
  title,
  fileName,
  columns,
  rows,
  getCellValue,
  subtitle = "",
}) {
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  doc.setFontSize(14);
  doc.setTextColor(25, 125, 250);
  doc.text(title, 14, 14);

  if (subtitle) {
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitle, 14, 20);
  }

  const head = [columns.map((c) => c.label)];
  const body = rows.map((row) =>
    columns.map((col) => {
      const v = getCellValue(row, col);
      return v === null || v === undefined ? "" : String(v);
    })
  );

  const colStyles = {};
  columns.forEach((col, index) => {
    if (col.align === "right") colStyles[index] = { halign: "right" };
    if (col.align === "center") colStyles[index] = { halign: "center" };
  });

  autoTable(doc, {
    head,
    body,
    startY: subtitle ? 24 : 20,
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: [25, 125, 250],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: colStyles,
    margin: { left: 10, right: 10, bottom: 12 },
    tableWidth: "auto",
  });

  const safeName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  doc.save(safeName);
}
