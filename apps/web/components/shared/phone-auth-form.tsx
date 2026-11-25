"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { usePhoneLogin, useSendPhoneCode } from "@/lib/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function PhoneAuthForm({ resetPassword = false }: { resetPassword?: boolean }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const locale = useLocale();
  const login = usePhoneLogin();
  const send = useSendPhoneCode(resetPassword ? "password_reset" : "login");
  const reset = useMutation({ mutationFn: async () => api.post("/auth/phone/reset-password", { phone, code, password }) });
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    try {
      if (resetPassword) {
        await reset.mutateAsync(); toast.success("Password updated. Sign in with your new password."); router.push(`/${locale}/login`);
      } else { await login.mutateAsync({ phone, code }); router.push(`/${locale}/dashboard`); }
    } catch (error: any) { toast.error(error?.response?.data?.message ?? "The code could not be verified"); }
  }
  return <form className="mt-6 space-y-4 border-t pt-4" onSubmit={submit}>
    <p className="font-medium">{resetPassword ? "Reset by phone" : "Sign in by phone"}</p>
    <div className="space-y-2"><Label htmlFor="auth-phone">Phone number</Label>
      <Input id="auth-phone" type="tel" autoComplete="tel" placeholder="+919000000001" required pattern="\+[1-9][0-9]{7,14}" value={phone}
        onChange={(event) => { setPhone(event.target.value); setCode(""); setSent(false); }} /></div>
    <Button type="button" variant="outline" disabled={send.isPending || !/^\+[1-9]\d{7,14}$/.test(phone)} onClick={async () => {
      try { await send.mutateAsync(phone); setSent(true); toast.success("If this verified number has an active account, a code has been sent."); }
      catch (error: any) { toast.error(error?.response?.data?.message ?? "Could not send a code"); }
    }}>Send phone code</Button>
    {sent && <>
      <div className="space-y-2"><Label htmlFor="auth-phone-code">Phone verification code</Label>
        <Input id="auth-phone-code" inputMode="numeric" autoComplete="one-time-code" required pattern="[0-9]{4,10}" value={code} onChange={(event) => setCode(event.target.value)} /></div>
      {resetPassword && <div className="space-y-2"><Label htmlFor="phone-new-password">New password</Label>
        <Input id="phone-new-password" type="password" autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={(event) => setPassword(event.target.value)} /></div>}
      <Button type="submit" disabled={login.isPending || reset.isPending}>{resetPassword ? "Reset password by phone" : "Sign in with code"}</Button>
    </>}
  </form>;
}
