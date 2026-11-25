"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell } from "@/components/shared/auth-shell";
import { FormField } from "@/components/shared/form-field";
import { useForgotPassword } from "@/lib/hooks/useAuth";
import { useAuthOptions } from "@/lib/hooks/useAuthOptions";
import { PhoneAuthForm } from "@/components/shared/phone-auth-form";
import { getApiErrorMessage } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const forgotPassword = useForgotPassword();
  const { data: options } = useAuthOptions();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await forgotPassword.mutateAsync(email);
      setSent(true);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not send a password reset link"));
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      description="We'll send a recovery link to your verified email or phone."
      icon={KeyRound}
    >
      {sent ? (
        <Alert variant="success">
          <AlertDescription>
            If an account exists for {email}, a password reset link has been sent.
          </AlertDescription>
        </Alert>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField label="Email address" htmlFor="email" required>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
            Send reset link
          </Button>
        </form>
      )}
      {options?.phone?.passwordReset && <PhoneAuthForm resetPassword />}
    </AuthShell>
  );
}
