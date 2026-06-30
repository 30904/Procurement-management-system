import mongoose from "mongoose";
import { AuditLog } from "../models/AuditLog.model.js";

const SKIP_MODELS = new Set(["AuditLog"]);

function extractUserContext(doc) {
  const raw = doc?.$locals?._auditUser;
  if (raw) return raw;
  return { userId: null, userName: "", company: doc?.company ?? null, ip: "" };
}

function buildChanges(prev, next, schema) {
  if (!prev || !next) return null;
  const changes = {};
  const paths = Object.keys(schema.paths).filter(
    (p) => !["_id", "__v", "createdAt", "updatedAt"].includes(p)
  );
  for (const p of paths) {
    const oldVal = prev[p];
    const newVal = next[p];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes[p] = { from: oldVal ?? null, to: newVal ?? null };
    }
  }
  return Object.keys(changes).length ? changes : null;
}

function summarise(action, modelName, doc) {
  const label = doc?.name || doc?.label || doc?.title || doc?.userName || doc?.code || "";
  const id = doc?._id ? String(doc._id) : "";
  if (label) return `${action} ${modelName} "${label}" (${id})`;
  return `${action} ${modelName} (${id})`;
}

function applyHooks(schema, modelName) {
  schema.pre("save", function (next) {
    if (this.isNew) {
      this.$locals._wasNew = true;
    } else {
      this.constructor
        .findById(this._id)
        .lean()
        .then((prev) => { this.$locals._auditPrev = prev; })
        .catch(() => {})
        .finally(() => next());
      return;
    }
    next();
  });

  schema.post("save", async function () {
    try {
      const ctx = extractUserContext(this);
      const isNew = this.$locals?._wasNew ?? false;
      const action = isNew ? "CREATE" : "UPDATE";
      const changes = isNew
        ? null
        : buildChanges(this.$locals?._auditPrev ?? null, this.toObject(), schema);

      if (!isNew && !changes) return;

      await AuditLog.create({
        company: ctx.company,
        userId: ctx.userId,
        userName: ctx.userName,
        action,
        modelName,
        documentId: this._id,
        summary: summarise(action, modelName, this),
        changes,
        previousData: isNew ? null : (this.$locals?._auditPrev ?? null),
        ipAddress: ctx.ip,
      });
    } catch {
      // Audit logging must never break the main flow
    }
  });

  schema.post("findOneAndUpdate", async function (doc) {
    if (!doc) return;
    try {
      const ctx = doc.$locals?._auditUser ?? {
        userId: null, userName: "", company: doc.company ?? null, ip: "",
      };
      await AuditLog.create({
        company: ctx.company,
        userId: ctx.userId,
        userName: ctx.userName,
        action: "UPDATE",
        modelName,
        documentId: doc._id,
        summary: summarise("UPDATE", modelName, doc),
        changes: null,
        ipAddress: ctx.ip,
      });
    } catch {
      // Silent
    }
  });

  schema.post("findOneAndDelete", async function (doc) {
    if (!doc) return;
    try {
      const ctx = doc.$locals?._auditUser ?? {
        userId: null, userName: "", company: doc.company ?? null, ip: "",
      };
      await AuditLog.create({
        company: ctx.company,
        userId: ctx.userId,
        userName: ctx.userName,
        action: "DELETE",
        modelName,
        documentId: doc._id,
        summary: summarise("DELETE", modelName, doc),
        previousData: doc.toObject ? doc.toObject() : doc,
        ipAddress: ctx.ip,
      });
    } catch {
      // Silent
    }
  });

  schema.pre("deleteOne", { document: true, query: false }, async function () {
    try {
      const ctx = extractUserContext(this);
      await AuditLog.create({
        company: ctx.company,
        userId: ctx.userId,
        userName: ctx.userName,
        action: "DELETE",
        modelName,
        documentId: this._id,
        summary: summarise("DELETE", modelName, this),
        previousData: this.toObject ? this.toObject() : null,
        ipAddress: ctx.ip,
      });
    } catch {
      // Silent
    }
  });
}

/**
 * Call after DB connects and all models are registered.
 * Iterates every compiled Mongoose model and attaches audit hooks.
 */
export function registerAuditTrail() {
  const names = mongoose.modelNames();
  let count = 0;
  for (const name of names) {
    if (SKIP_MODELS.has(name)) continue;
    const model = mongoose.model(name);
    applyHooks(model.schema, name);
    count++;
  }
  console.log(`  [audit] Hooks attached to ${count} model(s)`);
}
