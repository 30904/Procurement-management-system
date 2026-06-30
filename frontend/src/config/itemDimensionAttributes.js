/** Dimension / GSM attributes shown on Item Details for selected categories. */

export const DIMENSION_ATTRIBUTE_CODES = ["WIDTH", "LENGTH", "THICKNESS", "GSM"];

/** Item category values (from Master Data) that show Width, Length, Thickness, GSM. */
export const DIMENSION_ITEM_CATEGORIES = ["IRM", "IPK"];

export function categoryHasDimensionAttributes(itemCategory) {
  const cat = String(itemCategory ?? "").trim();
  return DIMENSION_ITEM_CATEGORIES.includes(cat);
}

export function isDimensionAttributeCode(code) {
  return DIMENSION_ATTRIBUTE_CODES.includes(String(code ?? "").trim().toUpperCase());
}
