"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useAdminUsers, useBanUser } from "@/lib/hooks/useAdmin";
import { useImpersonateUser } from "@/lib/hooks/useAdminCatalogExtras";
import { useAuthStore } from "@/lib/store";
import { setAccessToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  const locale = useLocale();
  const router = useRouter();
  const { data: users, isLoading } = useAdminUsers("customer");
  const banUser = useBanUser();
  const impersonate = useImpersonateUser();
  const setSession = useAuthStore((s) => s.setSession);

  // One-way: swaps the admin's own session for the target user's. There is no
  // "return to admin" path yet — sign back in separately, or impersonate from a
  // private window so your admin session in another tab stays intact.
  async function handleImpersonate(userId: string) {
    const result = await impersonate.mutateAsync(userId);
    setAccessToken(result.accessToken);
    setSession(result.user, result.accessToken, null);
    router.push(`/${locale}/dashboard`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Customers</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="divide-y rounded-md border">
          {users?.map((user: any) => (
            <div key={user.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-muted-foreground">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                {user.banned && <Badge variant="destructive">Banned</Badge>}
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
