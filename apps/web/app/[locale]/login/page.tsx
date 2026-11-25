"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/shared/auth-shell";
import { FormField } from "@/components/shared/form-field";
import { SocialLoginButtons } from "@/components/shared/social-login-buttons";
import { useLogin } from "@/lib/hooks/useAuth";
import { useAuthOptions } from "@/lib/hooks/useAuthOptions";
import { PhoneAuthForm } from "@/components/shared/phone-auth-form";
import { getApiErrorMessage } from "@/lib/utils";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const login = useLogin();
  const { data: options } = useAuthOptions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Invalid email or password"));
    }
  }

  return (
    <AuthShell title={t("loginTitle")} description="Enter your credentials to access your account." icon={LogIn}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <FormField label={t("loginIdentifier")} htmlFor="email" required>
          <Input
            id="email"
            type="text"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormField>
        <FormField label={t("password")} htmlFor="password" required>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        <Button type="submit" className="w-full" disabled={login.isPending}>
          {t("signIn")}
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
          <Link href={`/${locale}/forgot-password`} className="hover:text-foreground hover:underline">
            {t("forgotPassword")}
          </Link>
          <span>
            {t("noAccount")}{" "}
            <Link href={`/${locale}/register`} className="font-medium text-primary hover:underline">
              {t("signUp")}
            </Link>
          </span>
        </div>
      </form>
      {options?.phone?.login && <PhoneAuthForm />}
      <div className="mt-4">
        <SocialLoginButtons />
      </div>
    </AuthShell>
  );
}
