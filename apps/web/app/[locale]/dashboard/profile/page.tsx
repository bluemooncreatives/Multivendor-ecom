"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const [newEmail, setNewEmail] = useState("");
  const searchParams = useSearchParams();

  const requestEmailChange = useMutation({
    mutationFn: async () => api.post("/auth/email-change", { email: newEmail }),
    onSuccess: () => {
      setNewEmail("");
      toast.success("Check your new inbox for a confirmation link");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "Could not start the email change"),
  });

  // The confirmation link lands back here with a token; consuming it once on
  // mount completes the change without a dedicated page.
  const confirmEmailChange = useMutation({
    mutationFn: async (token: string) => (await api.post("/auth/email-change/confirm", { token })).data,
    onSuccess: (data: { email: string }) => {
      if (user) setSession({ ...user, email: data.email }, useAuthStore.getState().accessToken, useAuthStore.getState().refreshToken);
      toast.success("Email address updated");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? "That confirmation link is not valid"),
  });

  useEffect(() => {
    const token = searchParams.get("emailChangeToken");
    if (token && confirmEmailChange.isIdle) confirmEmailChange.mutate(token);
  }, [searchParams, confirmEmailChange]);

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
          <CardTitle className="text-base">Email address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Currently <strong>{user?.email}</strong>. Changing it sends a confirmation link to the new address — your
            sign-in stays on the current one until you follow that link.
          </p>
          <div className="space-y-2">
            <Label htmlFor="new-email">New email address</Label>
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => requestEmailChange.mutate()}
            disabled={!newEmail || requestEmailChange.isPending}
          >
            Send confirmation link
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
