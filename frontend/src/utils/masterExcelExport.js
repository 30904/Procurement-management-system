import ExcelJS from "exceljs";

const BORDER_THIN = { style: "thin", color: { argb: "FFCCCCCC" } };
const HEADER_FILL = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFE8EEF7" },
};

function cellBorder() {
  return {
    top: BORDER_THIN,
    left: BORDER_THIN,
    bottom: BORDER_THIN,
    right: BORDER_THIN,
  };
}

function horizontalForColumn(col) {
  if (col?.align === "center") return "center";
  if (col?.align === "right") return "right";
  return "left";
}

/**
 * Build a formatted .xlsx for master list screens (headers, borders, widths).
 */
export async function downloadMasterWorkbook({
  sheetName,
  fileName,
  columns,
  rows,
  getCellValue,
}) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31), {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  const headerRow = sheet.addRow(columns.map((c) => c.label));
  headerRow.font = { bold: true };
  headerRow.fill = HEADER_FILL;
  headerRow.height = 24;
  headerRow.eachCell((cell, colNumber) => {
    const col = columns[colNumber - 1];
    cell.border = cellBorder();
    cell.alignment = {
      vertical: "middle",
      horizontal: horizontalForColumn(col),
      wrapText: true,
    };
  });

  for (const row of rows) {
    const values = columns.map((col) => {
      const v = getCellValue(row, col);
      return v === null || v === undefined ? "" : v;
    });
    const excelRow = sheet.addRow(values);
    excelRow.height = 18;
    excelRow.eachCell((cell, colNumber) => {
      const col = columns[colNumber - 1];
      cell.border = cellBorder();
      cell.alignment = {
        vertical: "middle",
        horizontal: horizontalForColumn(col),
        wrapText: true,
      };
    });
  }

  columns.forEach((col, i) => {
    const colIdx = i + 1;
    const headerLen = String(col.label ?? "").length;
    const dataLens = rows.map((r) => String(getCellValue(r, col) ?? "").length);
    const maxChars = Math.max(headerLen, ...dataLens, 6);
    sheet.getColumn(colIdx).width = Math.min(maxChars + 2.5, 48);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
