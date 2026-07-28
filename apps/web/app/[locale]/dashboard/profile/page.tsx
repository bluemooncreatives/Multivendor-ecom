"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useLogout } from "@/lib/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useLogout();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const updateProfile = useMutation({
    mutationFn: async () => (await api.patch("/me/profile", { name, phone })).data,
    onSuccess: (updated) => {
      setSession(updated, useAuthStore.getState().accessToken, useAuthStore.getState().refreshToken);
      toast.success("Profile updated");
    },
  });

  const changePassword = useMutation({
    mutationFn: async () => api.post("/me/change-password", { currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Could not update password"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
            Save changes
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current password</Label>
            <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>New password</Label>
            <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={8} />
          </div>
          <Button onClick={() => changePassword.mutate()} disabled={changePassword.isPending}>
            Update password
          </Button>
        </CardContent>
      </Card>

      <Button variant="destructive" onClick={() => logout.mutate()}>
        Sign out
      </Button>
    </div>
  );
}
