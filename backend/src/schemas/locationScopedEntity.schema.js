import mongoose from "mongoose";

/**
 * Reusable location scope fields for manufacturing / transaction entities.
 * Spread into mongoose schemas: { ...locationScopedEntityFields }
 */
export const locationScopedEntityFields = {
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
    index: true,
  },
  locationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    required: true,
    index: true,
  },
  subLocationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubLocation",
    index: true,
  },
};

export function applyLocationScopedEntityIndexes(schema, { compoundSuffix = "" } = {}) {
  schema.index({ company: 1, locationId: 1, ...(compoundSuffix ? {} : {}) });
}
