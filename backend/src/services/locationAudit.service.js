import { LocationChangeAudit } from "../models/LocationChangeAudit.model.js";
import { toObjectId } from "../utils/locationScope.js";

export async function recordLocationChange({
  companyId,
  entityType,
  entityId,
  oldLocationId,
  newLocationId,
  oldSubLocationId,
  newSubLocationId,
  changedBy,
  changedByName,
}) {
  const oldLoc = toObjectId(oldLocationId);
  const newLoc = toObjectId(newLocationId);
  const oldSub = toObjectId(oldSubLocationId);
  const newSub = toObjectId(newSubLocationId);

  const locChanged = oldLoc && newLoc && !oldLoc.equals(newLoc);
  const subChanged = oldSub && newSub && !oldSub.equals(newSub);
  if (!locChanged && !subChanged && !(oldLoc || newLoc) && !(oldSub || newSub)) return null;

  if (String(oldLoc || "") === String(newLoc || "") && String(oldSub || "") === String(newSub || "")) {
    return null;
  }

  return LocationChangeAudit.create({
    company: companyId,
    entityType,
    entityId,
    oldLocationId: oldLoc || undefined,
    newLocationId: newLoc || undefined,
    oldSubLocationId: oldSub || undefined,
    newSubLocationId: newSub || undefined,
    changedBy: changedBy || undefined,
    changedByName: changedByName || "",
    summary: locChanged
      ? `Location changed on ${entityType}`
      : `Sub-location changed on ${entityType}`,
  });
}

export async function auditLocationOnUpdate({
  companyId,
  entityType,
  entityId,
  before,
  after,
  userId,
  userName,
}) {
  const oldLocationId = before?.locationId;
  const newLocationId = after?.locationId ?? before?.locationId;
  const oldSubLocationId = before?.subLocationId;
  const newSubLocationId = after?.subLocationId ?? before?.subLocationId;

  if (String(oldLocationId || "") === String(newLocationId || "") &&
      String(oldSubLocationId || "") === String(newSubLocationId || "")) {
    return null;
  }

  return recordLocationChange({
    companyId,
    entityType,
    entityId,
    oldLocationId,
    newLocationId,
    oldSubLocationId,
    newSubLocationId,
    changedBy: userId,
    changedByName: userName,
  });
}

export async function listLocationAuditForEntity(companyId, entityType, entityId) {
  return LocationChangeAudit.find({
    company: companyId,
    entityType,
    entityId,
  })
    .sort({ createdAt: -1 })
    .lean();
}
