"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import toast from "react-hot-toast";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/shared/auth-shell";
import { FormField } from "@/components/shared/form-field";
import { useResetPassword } from "@/lib/hooks/useAuth";
import { getApiErrorMessage } from "@/lib/utils";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const locale = useLocale();
  const router = useRouter();
  const resetPassword = useResetPassword();
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await resetPassword.mutateAsync({ token, password });
      toast.success("Password updated. Please sign in.");
      router.push(`/${locale}/login`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "This reset link is invalid or has expired"));
    }
  }

  return (
    <AuthShell title="Choose a new password" description="Enter a strong password of at least 8 characters." icon={ShieldCheck}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField label="New password" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={resetPassword.isPending || !token}>
          Reset password
        </Button>
      </form>
    </AuthShell>
  );
}
