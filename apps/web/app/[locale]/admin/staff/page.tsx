"use client";

import { useMemo, useState } from "react";
import {
  usePermissions,
  useRoles,
  useSaveRole,
  useDeleteRole,
  useStaff,
  useCreateStaff,
  useUpdateStaff,
  useDeleteStaff,
  type PermissionItem,
} from "@/lib/hooks/useAdminPeople";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function PermissionPicker({
  permissions,
  selected,
  onChange,
}: {
  permissions: PermissionItem[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, PermissionItem[]>();
    for (const p of permissions) map.set(p.group, [...(map.get(p.group) ?? []), p]);
    return [...map.entries()];
  }, [permissions]);

  function toggle(key: string, checked: boolean) {
    onChange(checked ? [...selected, key] : selected.filter((k) => k !== key));
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {grouped.map(([group, items]) => (
        <div key={group} className="space-y-1">
          <p className="text-xs font-semibold uppercase text-muted-foreground">{group}</p>
          {items.map((permission) => (
            <label key={permission.key} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected.includes(permission.key)}
                onChange={(e) => toggle(permission.key, e.target.checked)}
              />
              {permission.label}
            </label>
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AdminStaffPage() {
  const { data: permissions } = usePermissions();
  const { data: roles } = useRoles();
  const saveRole = useSaveRole();
  const deleteRole = useDeleteRole();

  const { data: staff } = useStaff();
  const createStaff = useCreateStaff();
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();

  const [role, setRole] = useState<{ id?: string; name: string; permissions: string[] }>({ name: "", permissions: [] });
  const [member, setMember] = useState({ name: "", email: "", password: "", permissions: [] as string[] });
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [memberPermissions, setMemberPermissions] = useState<string[]>([]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Staff & roles</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{role.id ? `Edit role: ${role.name}` : "Create a role"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveRole.mutate(role, { onSuccess: () => setRole({ name: "", permissions: [] }) });
            }}
          >
            <div className="max-w-sm space-y-1">
              <Label htmlFor="role-name">Role name</Label>
              <Input id="role-name" value={role.name} onChange={(e) => setRole({ ...role, name: e.target.value })} required />
            </div>
            <PermissionPicker
              permissions={permissions ?? []}
              selected={role.permissions}
              onChange={(next) => setRole({ ...role, permissions: next })}
            />
            <div className="flex gap-2">
              <Button type="submit" disabled={saveRole.isPending}>
                {role.id ? "Save role" : "Create role"}
              </Button>
              {role.id && (
                <Button type="button" variant="outline" onClick={() => setRole({ name: "", permissions: [] })}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="space-y-2">
            {roles?.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
                <div>
                  <span className="font-medium">{r.name}</span>{" "}
                  <span className="text-muted-foreground">{r.permissions.length} permission(s)</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setRole(r)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteRole.mutate(r.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a staff member</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createStaff.mutate(member, {
                onSuccess: () => setMember({ name: "", email: "", password: "", permissions: [] }),
              });
            }}
          >
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="staff-name">Name</Label>
                <Input id="staff-name" value={member.name} onChange={(e) => setMember({ ...member, name: e.target.value })} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="staff-email">Email</Label>
                <Input
                  id="staff-email"
                  type="email"
                  value={member.email}
                  onChange={(e) => setMember({ ...member, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="staff-password">Temporary password</Label>
                <Input
                  id="staff-password"
                  type="password"
                  minLength={8}
                  value={member.password}
                  onChange={(e) => setMember({ ...member, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Start from a role</p>
              <div className="flex flex-wrap gap-2">
                {roles?.map((r) => (
                  <Button key={r.id} type="button" variant="outline" size="sm" onClick={() => setMember({ ...member, permissions: r.permissions })}>
                    {r.name}
                  </Button>
                ))}
              </div>
            </div>

            <PermissionPicker
              permissions={permissions ?? []}
              selected={member.permissions}
              onChange={(next) => setMember({ ...member, permissions: next })}
            />
            <Button type="submit" disabled={createStaff.isPending}>
              Create staff member
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Staff members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {staff?.length === 0 && <p className="text-sm text-muted-foreground">No staff accounts yet.</p>}
          {staff?.map((s) => (
            <div key={s.id} className="space-y-2 rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-medium">{s.name}</span>{" "}
                  <span className="text-muted-foreground">
                    {s.email} · {s.permissions.length} permission(s)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {s.banned && <Badge variant="outline">Deactivated</Badge>}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingMember(editingMember === s.id ? null : s.id);
                      setMemberPermissions(s.permissions);
                    }}
                  >
                    Permissions
                  </Button>
                  {!s.banned && (
                    <Button variant="ghost" size="sm" onClick={() => deleteStaff.mutate(s.id)}>
                      Deactivate
                    </Button>
                  )}
                </div>
              </div>

              {editingMember === s.id && (
                <div className="space-y-3 rounded bg-muted p-3">
                  <PermissionPicker permissions={permissions ?? []} selected={memberPermissions} onChange={setMemberPermissions} />
                  <p className="text-xs text-muted-foreground">
                    Saving revokes this member&apos;s active sessions so the new permissions take effect immediately.
                  </p>
                  <Button
                    size="sm"
                    disabled={updateStaff.isPending}
                    onClick={() =>
                      updateStaff.mutate({ id: s.id, permissions: memberPermissions }, { onSuccess: () => setEditingMember(null) })
                    }
                  >
                    Save permissions
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
