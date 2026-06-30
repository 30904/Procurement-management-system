import { PoTermsConfig } from "../models/PoTermsConfig.model.js";

export const DEFAULT_OPENING_LINE_HTML = "<p>Dear Sir/Madam,</p>";

export const DEFAULT_TERMS_BODY_HTML = `<p>Please supply following goods/material in accordance with agreed terms and conditions or contract purchase agreement.</p>
<p>Please mention our Item code &amp; Purchase Order number on your tax invoice without which invoice will not be processed.</p>
<p>Please send the material along with valid Test Report</p>`;
export const DEFAULT_PO_PRINT_FORMAT_KEY = "traditional";
export const DEFAULT_PO_PRINT_TEMPLATE_KEY = "traditional";
export const ALLOWED_PO_PRINT_TEMPLATE_KEYS = ["traditional", "compact", "modern"];
export const DEFAULT_PO_PRINT_FORMATS = [
  {
    key: DEFAULT_PO_PRINT_FORMAT_KEY,
    name: "Traditional",
    templateKey: DEFAULT_PO_PRINT_TEMPLATE_KEY,
    isActive: true,
  },
  {
    key: "compact",
    name: "Compact",
    templateKey: "compact",
    isActive: true,
  },
  {
    key: "modern",
    name: "Modern",
    templateKey: "modern",
    isActive: true,
  },
];

function normalizeFormatKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function sanitizePoPrintFormats(inputFormats = [], fallbackDefaultKey = DEFAULT_PO_PRINT_FORMAT_KEY) {
  const source = Array.isArray(inputFormats) ? inputFormats : [];
  const seen = new Set();
  const formats = [];

  for (const row of source) {
    const name = String(row?.name || "").trim();
    const keyRaw = String(row?.key || "").trim();
    const key = normalizeFormatKey(keyRaw || name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const templateKeyRaw = String(row?.templateKey || "").trim().toLowerCase();
    const templateKey = ALLOWED_PO_PRINT_TEMPLATE_KEYS.includes(templateKeyRaw)
      ? templateKeyRaw
      : DEFAULT_PO_PRINT_TEMPLATE_KEY;
    formats.push({
      key,
      name: name || keyRaw || key,
      templateKey,
      isActive: row?.isActive !== false,
    });
  }

  if (!formats.length) {
    formats.push(...DEFAULT_PO_PRINT_FORMATS.map((f) => ({ ...f })));
  }

  const hasTraditional = formats.some((f) => f.key === DEFAULT_PO_PRINT_FORMAT_KEY);
  if (!hasTraditional) {
    formats.unshift({ ...DEFAULT_PO_PRINT_FORMATS[0] });
  }

  const hasCompact = formats.some((f) => f.key === "compact");
  if (!hasCompact) {
    formats.push({ ...DEFAULT_PO_PRINT_FORMATS[1] });
  }
  const hasModern = formats.some((f) => f.key === "modern");
  if (!hasModern) {
    formats.push({ ...DEFAULT_PO_PRINT_FORMATS[2] });
  }

  const normalizedDefault = normalizeFormatKey(fallbackDefaultKey) || DEFAULT_PO_PRINT_FORMAT_KEY;
  let defaultKey =
    formats.find((f) => f.key === normalizedDefault)?.key || DEFAULT_PO_PRINT_FORMAT_KEY;

  if (!formats.some((f) => f.key === defaultKey && f.isActive)) {
    defaultKey = formats.find((f) => f.isActive)?.key || DEFAULT_PO_PRINT_FORMAT_KEY;
  }

  return { formats, defaultKey };
}

function getDefaultFormatFromConfig(doc) {
  const { formats, defaultKey } = sanitizePoPrintFormats(
    doc?.poPrintFormats || [],
    doc?.defaultPoPrintFormatKey || DEFAULT_PO_PRINT_FORMAT_KEY
  );
  return (
    formats.find((f) => f.key === defaultKey && f.isActive) ||
    formats.find((f) => f.isActive) ||
    formats[0] ||
    DEFAULT_PO_PRINT_FORMATS[0]
  );
}

export async function getPoTermsConfig(companyId) {
  let doc = await PoTermsConfig.findOne({ company: companyId }).lean();
  if (!doc) {
    doc = {
      company: companyId,
      openingLineHtml: DEFAULT_OPENING_LINE_HTML,
      termsBodyHtml: DEFAULT_TERMS_BODY_HTML,
      poPrintFormats: DEFAULT_PO_PRINT_FORMATS,
      defaultPoPrintFormatKey: DEFAULT_PO_PRINT_FORMAT_KEY,
    };
  }
  const { formats, defaultKey } = sanitizePoPrintFormats(
    doc.poPrintFormats || [],
    doc.defaultPoPrintFormatKey || DEFAULT_PO_PRINT_FORMAT_KEY
  );
  doc.poPrintFormats = formats;
  doc.defaultPoPrintFormatKey = defaultKey;
  return doc;
}

export async function savePoTermsConfig(companyId, body, userId) {
  const openingLineHtml = String(body?.openingLineHtml ?? "").trim();
  const termsBodyHtml = String(body?.termsBodyHtml ?? "").trim();
  const { formats, defaultKey } = sanitizePoPrintFormats(
    body?.poPrintFormats,
    body?.defaultPoPrintFormatKey
  );

  const doc = await PoTermsConfig.findOneAndUpdate(
    { company: companyId },
    {
      $set: {
        company: companyId,
        openingLineHtml,
        termsBodyHtml,
        poPrintFormats: formats,
        defaultPoPrintFormatKey: defaultKey,
        updatedBy: userId || undefined,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc.toObject();
}

export async function getPoTermsSnapshotForCompany(companyId) {
  const doc = await getPoTermsConfig(companyId);
  const defaultFormat = getDefaultFormatFromConfig(doc);
  return {
    openingLineHtml: doc.openingLineHtml || "",
    termsBodyHtml: doc.termsBodyHtml || "",
    poPrintFormatKey: defaultFormat?.key || DEFAULT_PO_PRINT_FORMAT_KEY,
    poPrintFormatName: defaultFormat?.name || "Traditional",
    poPrintTemplateKey: defaultFormat?.templateKey || DEFAULT_PO_PRINT_TEMPLATE_KEY,
  };
}

/** True when HTML has visible text (ignores empty tags). */
export function hasPoTermsHtml(html) {
  const text = String(html ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > 0;
}

/**
 * Fills missing openingLineHtml / termsBodyHtml from company PO terms config.
 * Does not overwrite fields already stored on the PO (snapshot preserved once set).
 */
export async function mergePoTermsWithSnapshot(companyId, poTerms = {}) {
  const merged = { ...(poTerms || {}) };
  const snap = await getPoTermsSnapshotForCompany(companyId);
  if (!hasPoTermsHtml(merged.openingLineHtml) && hasPoTermsHtml(snap.openingLineHtml)) {
    merged.openingLineHtml = snap.openingLineHtml;
  }
  if (!hasPoTermsHtml(merged.termsBodyHtml) && hasPoTermsHtml(snap.termsBodyHtml)) {
    merged.termsBodyHtml = snap.termsBodyHtml;
  }
  if (!String(merged.poPrintFormatKey || "").trim()) {
    merged.poPrintFormatKey = snap.poPrintFormatKey || DEFAULT_PO_PRINT_FORMAT_KEY;
  }
  if (!String(merged.poPrintFormatName || "").trim()) {
    merged.poPrintFormatName = snap.poPrintFormatName || "Traditional";
  }
  if (!String(merged.poPrintTemplateKey || "").trim()) {
    merged.poPrintTemplateKey = snap.poPrintTemplateKey || DEFAULT_PO_PRINT_TEMPLATE_KEY;
  }
  return merged;
}
