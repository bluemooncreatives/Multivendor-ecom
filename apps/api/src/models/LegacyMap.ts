import { Schema, model } from "mongoose";

/**
 * Maps a legacy MySQL primary key to the document the importer created for it.
 *
 * Keeping the mapping in its own collection (rather than a `legacyId` field on
 * every domain model) means the import is repeatable and resumable without
 * widening a single production schema: a re-run updates the same documents instead
 * of creating duplicates, and relations between tables are resolved through the
 * same table.
 */
const legacyIdMapSchema = new Schema(
  {
    table: { type: String, required: true },
    legacyId: { type: String, required: true },
    documentId: { type: Schema.Types.ObjectId, required: true },
    collectionName: { type: String, required: true },
  },
  { timestamps: true },
);

legacyIdMapSchema.index({ table: 1, legacyId: 1 }, { unique: true });
export const LegacyIdMap = model("LegacyIdMap", legacyIdMapSchema);
