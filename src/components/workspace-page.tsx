import mongoose from "mongoose";
import { redirect } from "next/navigation";
import { AccountWorkflow } from "@/components/account-workflow";
import { EntityTable } from "@/components/entity-table";
import { OrderWorkflow } from "@/components/order-workflow";
import { WorkspaceShell } from "@/components/workspace-shell";
import { WithdrawalWorkflow } from "@/components/withdrawal-workflow";
import { getSession } from "@/lib/auth";
import { connectMongo } from "@/lib/mongodb";
import { getDashboardMetrics, getEntityRows } from "@/lib/workspace-data";
import { adminNavigation, canAccessWorkspace, customerNavigation, findWorkspaceItem, sellerNavigation, type WorkspaceGroup } from "@/lib/workspace";
import { SettingModel } from "@/models";

async function featureAwareNavigation(workspace: "customer" | "seller" | "admin", groups: WorkspaceGroup[]): Promise<WorkspaceGroup[]> {
  if (workspace === "admin") return groups;
  try {
    await connectMongo();
    const [settings, addons] = await Promise.all([
      SettingModel.find({ key: { $in: ["business.wallet_system", "business.classified_product"] } }).select("key value").lean(),
      mongoose.connection.db!.collection("addons").find({ identifier: { $in: ["affiliate_system"] }, active: true }).project({ identifier: 1 }).toArray(),
    ]);
    const values = Object.fromEntries(settings.map((setting) => [setting.key, setting.value === true || String(setting.value) === "1"]));
    const activeAddons = new Set(addons.map((addon) => String(addon.identifier)));
    return groups.map((group) => ({ ...group, items: group.items.filter((item) => item.slug !== "wallet" || values["business.wallet_system"]).filter((item) => item.slug !== "customer_products" || values["business.classified_product"]).filter((item) => item.slug !== "affiliate" || activeAddons.has("affiliate_system")) })).filter((group) => group.items.length);
  } catch { return groups; }
}

export async function WorkspacePage({ workspace, path, search = "" }: { workspace: "customer" | "seller" | "admin"; path: string; search?: string }) {
  const user = await getSession();
  if (!user) redirect(`/login?next=${encodeURIComponent(workspace === "customer" ? `/${path}` : `/${workspace}/${path}`)}`);
  if (!canAccessWorkspace(user.role, workspace)) redirect("/dashboard");
  const baseGroups = workspace === "admin" ? adminNavigation : workspace === "seller" ? sellerNavigation : customerNavigation;
  const groups = await featureAwareNavigation(workspace, baseGroups);
  const active = path || "dashboard";
  const item = findWorkspaceItem(groups, active);
  const isDashboard = active === "dashboard" || !item;
  const metrics = isDashboard ? await getDashboardMetrics(user, workspace) : [];
  const rows = item?.entity ? await getEntityRows(item.entity, user, workspace, search) : [];
  const managementMode = workspace === "admin" ? "admin" : workspace === "seller" && item?.entity && (item.entity === "products" || item.entity === "shops") ? "seller" : undefined;
  const accountWorkflow = workspace !== "admin" ? active === "profile" ? "profile" : active.startsWith("support_ticket") ? "tickets" : active.startsWith("conversations") ? "conversations" : null : null;
  const orderWorkflow = active === "orders" || active === "purchase_history" || active === "sales";
  const withdrawalWorkflow = active === "withdraw_requests" || active === "withdraw_requests_all";
  return <WorkspaceShell user={user} workspace={workspace} groups={groups} active={active}>{isDashboard ? <><div className="page-heading"><div><span className="eyebrow">Welcome back</span><h1>{user.name}</h1><p>Here is what is happening across your {workspace === "admin" ? "marketplace" : workspace === "seller" ? "shop" : "account"}.</p></div></div><div className="metrics">{metrics.map((metric) => <div className="metric" key={metric.label}><span>{metric.label}</span><strong>{metric.value}</strong><small>{metric.hint}</small></div>)}</div><section className="content-card"><h2>MongoDB workspace ready</h2><p>Use the navigation to manage products, orders, customers, payments, configuration, and support workflows. Every section is served by Node/Express and MongoDB.</p></section></> : orderWorkflow ? <OrderWorkflow workspace={workspace}/> : withdrawalWorkflow && workspace !== "customer" ? <WithdrawalWorkflow workspace={workspace}/> : accountWorkflow ? <AccountWorkflow kind={accountWorkflow} initialRecords={rows}/> : item?.entity ? <EntityTable entity={item.entity} rows={rows} title={item.label} mode={managementMode}/> : <section className="content-card"><h2>{item?.label || "Workspace"}</h2><div className="callout">This workflow is available through its dedicated import, payment, or configuration endpoint. Connect the corresponding provider credentials to activate external processing.</div><p>The page and route are protected for the correct account role.</p></section>}</WorkspaceShell>;
}
