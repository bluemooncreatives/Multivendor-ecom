"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Users } from "lucide-react";
import { useAdminUsers, useBanUser } from "@/lib/hooks/useAdmin";
import { useImpersonateUser } from "@/lib/hooks/useAdminCatalogExtras";
import { useAuthStore } from "@/lib/store";
import { setAccessToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { TableSkeleton } from "@/components/shared/loading-state";

export default function AdminUsersPage() {
  const locale = useLocale();
  const router = useRouter();
  const { data: users, isLoading } = useAdminUsers("customer");
  const banUser = useBanUser();
  const impersonate = useImpersonateUser();
  const setSession = useAuthStore((s) => s.setSession);

  async function handleImpersonate(userId: string) {
    const result = await impersonate.mutateAsync(userId);
    setAccessToken(result.accessToken);
    setSession(result.user, result.accessToken, null);
    router.push(`/${locale}/dashboard`);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="View registered shoppers, impersonate sessions, or manage account access." />

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : !users || users.length === 0 ? (
        <EmptyState icon={Users} title="No customers found" description="Registered customer accounts will appear here." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-end">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user: { id: string; name: string; email?: string; phone?: string; banned?: boolean }) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email || user.phone || "No contact details"}</TableCell>
                  <TableCell>
                    <StatusBadge status={user.banned ? "banned" : "active"} />
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="inline-flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleImpersonate(user.id)} disabled={impersonate.isPending}>
                        Login as
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => banUser.mutate({ id: user.id, banned: !user.banned })}
                      >
                        {user.banned ? "Unban" : "Ban"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
