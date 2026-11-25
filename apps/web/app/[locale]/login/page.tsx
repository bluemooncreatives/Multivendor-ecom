"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { LogIn, ShoppingBag, Sparkles, Package, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AuthShell } from "@/components/shared/auth-shell";
import { FormField } from "@/components/shared/form-field";
import { SocialLoginButtons } from "@/components/shared/social-login-buttons";
import { useLogin } from "@/lib/hooks/useAuth";
import { useAuthOptions } from "@/lib/hooks/useAuthOptions";
import { PhoneAuthForm } from "@/components/shared/phone-auth-form";
import { getApiErrorMessage } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const BRAND_ASIDE = (
  <div className="flex h-full flex-col justify-between">
    <div className="space-y-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
        <ShoppingBag className="h-8 w-8" />
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-black leading-tight">
          Welcome back to your marketplace
        </h2>
        <p className="text-primary-foreground/80">
          Sign in to access your orders, wishlist, and personalized experience.
        </p>
      </div>
    </div>

    <div className="space-y-3">
      {[
        { icon: Sparkles, label: "Curated products from top sellers" },
        { icon: Package, label: "Track all your orders in one place" },
        { icon: Store, label: "Manage your seller dashboard" },
      ].map(({ icon: Icon, label }) => (
        <div key={label} className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium text-primary-foreground/90">{label}</span>
        </div>
      ))}
    </div>
  </div>
);

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
    <AuthShell
      title={t("loginTitle")}
      description="Enter your credentials to access your account."
      icon={LogIn}
      aside={BRAND_ASIDE}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <FormField label={t("loginIdentifier")} htmlFor="email" required>
          <Input
            id="email"
            type="text"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-11 rounded-xl"
          />
        </FormField>
        <FormField label={t("password")} htmlFor="password" required>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="h-11 rounded-xl"
          />
        </FormField>

        <div className="flex items-center justify-end">
          <Link
            href={`/${locale}/forgot-password`}
            className="text-xs font-semibold text-primary hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        <Button type="submit" className="h-11 w-full rounded-xl font-bold" disabled={login.isPending}>
          {login.isPending ? "Signing in..." : t("signIn")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href={`/${locale}/register`} className="font-bold text-primary hover:underline">
            {t("signUp")}
          </Link>
        </p>
      </form>

      {(options?.phone?.login || options?.socialLogin) && (
        <>
          <div className="relative my-5">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Or continue with
            </span>
          </div>
          {options?.phone?.login && <PhoneAuthForm />}
          <SocialLoginButtons />
        </>
      )}
    </AuthShell>
  );
}
