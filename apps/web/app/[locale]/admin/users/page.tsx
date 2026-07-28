"use client";

import { useAdminUsers, useBanUser } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminUsersPage() {
  const { data: users, isLoading } = useAdminUsers("customer");
  const banUser = useBanUser();

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
