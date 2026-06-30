export function createEmptyRfqValidation() {
  return {
    rfqDate: "",
    department: "",
    closingDate: "",
    vendors: "",
    lines: "",
    lineErrors: {},
  };
}

export function validateRfqForm(form) {
  const errors = createEmptyRfqValidation();
  let valid = true;

  if (!form.rfqDate) {
    errors.rfqDate = "RFQ date is required";
    valid = false;
  }
  if (!String(form.department || "").trim()) {
    errors.department = "Department is required";
    valid = false;
  }
  if (!String(form.closingDate || "").trim()) {
    errors.closingDate = "Closing date is required";
    valid = false;
  }
  if (!Array.isArray(form.vendors) || !form.vendors.length) {
    errors.vendors = "Select at least one vendor";
    valid = false;
  }
  const activeLines = (form.lines || []).filter((l) => Number(l.qty) > 0);
  if (!activeLines.length) {
    errors.lines = "Add at least one line with quantity";
    valid = false;
  } else {
    activeLines.forEach((line) => {
      const lineErr = {};
      if (line.lineType === "Material" && !line.itemNo && !line.itemName) {
        lineErr.item = "Material is required";
      }
      if (line.lineType === "Service" && !line.serviceCode && !line.serviceName) {
        lineErr.service = "Service is required";
      }
      if (Object.keys(lineErr).length) {
        errors.lineErrors[line.key] = lineErr;
        valid = false;
      }
    });
  }

  return { valid, errors };
}
