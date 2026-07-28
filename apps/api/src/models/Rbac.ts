import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";

// Named staff roles (distinct from the fixed admin/staff/seller/customer enum on User).
// Each role is a bundle of permission strings checked per-route by requirePermission().
const roleSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    permissions: { type: [String], required: true, default: [] },
  },
  { timestamps: true },
);

withJsonId(roleSchema);
export const Role = model("Role", roleSchema);

// Catalog of all permission strings the app understands, for the admin role-editor UI.
const staffPermissionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true }, // e.g. "orders.manage"
    label: { type: String, required: true },
    group: { type: String, required: true }, // e.g. "Orders"
  },
  { timestamps: true },
);

withJsonId(staffPermissionSchema);
export const StaffPermission = model("StaffPermission", staffPermissionSchema);
