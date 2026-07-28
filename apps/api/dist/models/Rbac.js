import { Schema, model } from "mongoose";
import { withJsonId } from "./plugins.js";
// Named staff roles (distinct from the fixed admin/staff/seller/customer enum on User).
// Each role is a bundle of permission strings checked per-route by requirePermission().
const roleSchema = new Schema({
    name: { type: String, required: true, unique: true },
    permissions: { type: [String], required: true, default: [] },
}, { timestamps: true });
withJsonId(roleSchema);
export const Role = model("Role", roleSchema);
// Catalog of all permission strings the app understands, for the admin role-editor UI.
const staffPermissionSchema = new Schema({
    key: { type: String, required: true, unique: true }, // e.g. "orders.manage"
    label: { type: String, required: true },
    group: { type: String, required: true }, // e.g. "Orders"
}, { timestamps: true });
withJsonId(staffPermissionSchema);
export const StaffPermission = model("StaffPermission", staffPermissionSchema);
// Immutable audit trail for admin impersonation ("login as user") — every use
// is recorded and never deleted, so account-access-on-behalf-of-a-user is traceable.
const adminAuditLogSchema = new Schema({
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true }, // e.g. "impersonate"
    targetUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    ip: String,
}, { timestamps: true });
withJsonId(adminAuditLogSchema);
export const AdminAuditLog = model("AdminAuditLog", adminAuditLogSchema);
//# sourceMappingURL=Rbac.js.map