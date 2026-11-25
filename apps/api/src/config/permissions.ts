// Matches the legacy 17-permission role form: flash deals, sales, support
// tickets, conversations, pickup-point orders, SEO and frontend settings each
// get their own switch rather than collapsing into orders.manage/settings.manage.
export const PERMISSIONS = [
  { key: "dashboard.view", label: "View dashboard", group: "General" },
  { key: "catalog.manage", label: "Manage catalog", group: "Catalog" },
  { key: "catalog.moderate", label: "Moderate products & classifieds", group: "Catalog" },
  { key: "flashdeals.manage", label: "Manage flash deals", group: "Catalog" },
  { key: "users.manage", label: "Manage customers", group: "Users" },
  { key: "sellers.manage", label: "Manage sellers", group: "Users" },
  { key: "staff.manage", label: "Manage staff & roles", group: "Users" },
  { key: "orders.manage", label: "Manage orders", group: "Orders" },
  { key: "sales.view", label: "View sales", group: "Orders" },
  { key: "pickuppoints.manage", label: "Manage pickup points & their orders", group: "Orders" },
  { key: "pos.manage", label: "Operate the point of sale till", group: "Orders" },
  { key: "refunds.manage", label: "Handle refund requests", group: "Orders" },
  { key: "payments.manage", label: "Manage payments & withdrawals", group: "Orders" },
  { key: "tickets.manage", label: "Answer support tickets", group: "Support" },
  { key: "conversations.manage", label: "Read buyer–seller conversations", group: "Support" },
  { key: "marketing.manage", label: "Manage coupons & marketing", group: "Marketing" },
  { key: "frontend.manage", label: "Manage homepage & frontend content", group: "Marketing" },
  { key: "seo.manage", label: "Manage SEO settings", group: "Marketing" },
  { key: "reports.view", label: "View reports", group: "Reports" },
  { key: "settings.manage", label: "Manage settings & SMS", group: "Settings" },
  { key: "addons.manage", label: "Configure add-ons (affiliate, club points, packages)", group: "Settings" },
];
