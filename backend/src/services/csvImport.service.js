import { parse } from "csv-parse/sync";
import mongoose from "mongoose";

/**
 * Built-in import profiles keyed by a slug.
 * Each profile describes: target Mongoose model name, column mapping,
 * per-field validation rules, and an optional transform function.
 *
 * Apps built on the framework can register more profiles at runtime
 * via registerProfile().
 */
const profiles = {
  master_data: {
    modelName: "MasterData",
    label: "Master Data",
    columns: [
      { csv: "Category",    field: "category",    required: true },
      { csv: "Label",       field: "label",       required: true },
      { csv: "Value",       field: "value" },
      { csv: "Description", field: "description" },
      { csv: "Sequence",    field: "sequence",    type: "number" },
      { csv: "Status",      field: "status",      enum: ["Active", "Inactive"], default: "Active" },
    ],
  },
  users: {
    modelName: "User",
    label: "Users",
    columns: [
      { csv: "Name",       field: "name",       required: true },
      { csv: "Username",   field: "userName",   required: true },
      { csv: "Email",      field: "userEmail" },
      { csv: "Department", field: "departmentName" },
      { csv: "Password",   field: "password",   required: true },
      { csv: "User Type",  field: "userType",   default: "ADMIN" },
      { csv: "Status",     field: "status",     default: "Active" },
    ],
    transform: async (row) => {
      const bcrypt = await import("bcryptjs");
      if (row.password) row.password = await bcrypt.default.hash(row.password, 8);
      if (!row.userType) row.userType = "ADMIN";
      row.isActive = row.status !== "Inactive";
      return row;
    },
  },
};

export function registerProfile(key, profile) {
  profiles[key] = profile;
}

export function listProfiles() {
  return Object.entries(profiles).map(([key, p]) => ({
    key,
    label: p.label || key,
    modelName: p.modelName,
    columns: p.columns.map((c) => ({
      csv: c.csv,
      field: c.field,
      required: !!c.required,
      type: c.type || "string",
    })),
  }));
}

export function getProfile(key) {
  return profiles[key] || null;
}

export function generateTemplate(profileKey) {
  const profile = profiles[profileKey];
  if (!profile) return null;
  const headers = profile.columns.map((c) => c.csv).join(",");
  const sampleRow = profile.columns
    .map((c) => {
      if (c.enum) return c.enum[0];
      if (c.type === "number") return "1";
      if (c.required) return `Sample ${c.csv}`;
      return "";
    })
    .join(",");
  return `${headers}\n${sampleRow}\n`;
}

export function parseCSV(buffer, profileKey) {
  const profile = profiles[profileKey];
  if (!profile) throw new Error(`Unknown import profile: ${profileKey}`);

  const content = buffer.toString("utf-8").replace(/^\uFEFF/, "");
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  const csvHeaders = profile.columns.map((c) => c.csv);
  const results = { valid: [], invalid: [], totalRows: records.length };

  for (let i = 0; i < records.length; i++) {
    const raw = records[i];
    const row = {};
    const errors = [];

    for (const col of profile.columns) {
      let val = raw[col.csv];
      if (val === undefined || val === null || val === "") {
        if (col.required) {
          errors.push(`"${col.csv}" is required`);
          continue;
        }
        val = col.default !== undefined ? col.default : "";
      }

      if (col.type === "number") {
        const n = Number(val);
        if (isNaN(n)) {
          errors.push(`"${col.csv}" must be a number`);
          continue;
        }
        val = n;
      }

      if (col.enum && val && !col.enum.includes(val)) {
        errors.push(`"${col.csv}" must be one of: ${col.enum.join(", ")}`);
        continue;
      }

      row[col.field] = val;
    }

    if (errors.length) {
      results.invalid.push({ rowNum: i + 2, data: raw, errors });
    } else {
      results.valid.push({ rowNum: i + 2, data: row, raw });
    }
  }

  return results;
}

export async function importRows(profileKey, validRows, company) {
  const profile = profiles[profileKey];
  if (!profile) throw new Error(`Unknown import profile: ${profileKey}`);

  const Model = mongoose.model(profile.modelName);
  let inserted = 0;
  let skipped = 0;
  const errors = [];

  for (let i = 0; i < validRows.length; i++) {
    let doc = { ...validRows[i].data };

    if (company) doc.company = company;

    if (profile.transform) {
      try {
        doc = await profile.transform(doc);
      } catch (err) {
        errors.push({ rowNum: validRows[i].rowNum, error: `Transform error: ${err.message}` });
        skipped++;
        continue;
      }
    }

    try {
      await Model.create(doc);
      inserted++;
    } catch (err) {
      const msg = err.code === 11000
        ? "Duplicate entry"
        : err.message;
      errors.push({ rowNum: validRows[i].rowNum, error: msg });
      skipped++;
    }
  }

  return { inserted, skipped, errors };
}
