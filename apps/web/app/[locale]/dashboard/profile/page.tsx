"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useLogout } from "@/lib/hooks/useAuth";
import { useAuthOptions } from "@/lib/hooks/useAuthOptions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { getApiErrorMessage } from "@/lib/utils";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useLogout();
  const { data: authOptions } = useAuthOptions();
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.pendingPhone ?? user?.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const searchParams = useSearchParams();

  const sendPhoneCode = useMutation({
    mutationFn: async () => api.post("/auth/otp/send", { phone }),
    onSuccess: () => {
      setPhoneCodeSent(true);
      toast.success("Phone code sent");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Could not send a code")),
  });

  const verifyPhone = useMutation({
    mutationFn: async () => api.post("/auth/otp/verify", { phone, code: phoneCode }),
    onSuccess: async () => {
      const updated = (await api.get("/auth/me")).data;
      setSession(updated, useAuthStore.getState().accessToken, useAuthStore.getState().refreshToken);
      setPhoneCodeSent(false);
      setPhoneCode("");
      toast.success("Phone number verified");
    },
    onError: (error) => toast.error(getApiErrorMessage(error, "Could not verify the code")),
  });

  const requestEmailChange = useMutation({
    mutationFn: async () => api.post("/auth/email-change", { email: newEmail }),
    onSuccess: () => {
      setNewEmail("");
      toast.success("Check your new inbox for a confirmation link");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Could not start the email change")),
  });

  const confirmEmailChange = useMutation({
    mutationFn: async (token: string) => (await api.post("/auth/email-change/confirm", { token })).data,
    onSuccess: (data: { email: string }) => {
      if (user) {
        setSession({ ...user, email: data.email }, useAuthStore.getState().accessToken, useAuthStore.getState().refreshToken);
      }
      toast.success("Email address updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "That confirmation link is not valid")),
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
    onError: (error) => toast.error(getApiErrorMessage(error, "Could not update your profile")),
  });

  const changePassword = useMutation({
    mutationFn: async () => api.post("/me/change-password", { currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Could not update password")),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your personal information, email, phone verification, and password."
        actions={
          <Button variant="destructive" size="sm" onClick={() => logout.mutate()}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        }
      />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base">Account details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Name" htmlFor="profile-name">
              <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
            <FormField label="Phone" htmlFor="profile-phone">
              <Input
                id="profile-phone"
                type="tel"
                placeholder="+919000000001"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneCodeSent(false);
                  setPhoneCode("");
                }}
              />
            </FormField>
          </div>
          <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
            Save changes
          </Button>

          {authOptions?.phone?.verification &&
            (user?.pendingPhone || user?.phone) &&
            phone === (user?.pendingPhone ?? user?.phone) && (
              <div className="space-y-3 border-t pt-4">
                {!user?.pendingPhone && user?.phoneVerifiedAt ? (
                  <Badge variant="success" className="gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Phone number verified
                  </Badge>
                ) : (
                  <div className="space-y-3">
                    <Button variant="outline" onClick={() => sendPhoneCode.mutate()} disabled={sendPhoneCode.isPending}>
                      Send verification code
                    </Button>
                    {phoneCodeSent && (
                      <div className="max-w-xs space-y-2">
                        <FormField label="Phone verification code" htmlFor="profile-phone-code">
                          <Input
                            id="profile-phone-code"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            value={phoneCode}
                            onChange={(event) => setPhoneCode(event.target.value)}
                          />
                        </FormField>
                        <Button onClick={() => verifyPhone.mutate()} disabled={verifyPhone.isPending || !phoneCode}>
                          Verify phone number
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base">Email address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <p className="text-sm text-muted-foreground">
            Currently <strong className="text-foreground">{user?.email || "no email address"}</strong>. Changing it sends a
            confirmation link to the new address — your sign-in stays on the current one until you follow that link.
          </p>
          <FormField label="New email address" htmlFor="new-email" className="max-w-md">
            <Input
              id="new-email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </FormField>
          <Button variant="outline" onClick={() => requestEmailChange.mutate()} disabled={!newEmail || requestEmailChange.isPending}>
            Send confirmation link
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-4">
          <CardTitle className="text-base">Change password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Current password" htmlFor="current-password">
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </FormField>
            <FormField label="New password" htmlFor="new-password">
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
              />
            </FormField>
          </div>
          <Button onClick={() => changePassword.mutate()} disabled={changePassword.isPending}>
            Update password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
