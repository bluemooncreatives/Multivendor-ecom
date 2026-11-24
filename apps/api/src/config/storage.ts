import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
export const publicUploadsRoot = path.join(root, "data", "uploads");
export const privateUploadsRoot = path.join(root, "data", "private-uploads");
export const legacyUploadsRoot = path.join(root, "public", "uploads");
