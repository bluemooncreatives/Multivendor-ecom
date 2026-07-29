"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialLoginButtons } from "@/components/shared/social-login-buttons";
import { useRegister } from "@/lib/hooks/useAuth";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const register = useRegister();
  const defaultRole = searchParams.get("role") === "seller" ? "seller" : "customer";
  // Carried from an affiliate's shared link (?ref=CODE). An unknown code is not an
  // error — the account is created either way, it just earns nobody a commission.
  const referralCode = searchParams.get("ref") ?? undefined;
  const [form, setForm] = useState({ name: "", email: "", password: "", role: defaultRole as "customer" | "seller" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await register.mutateAsync({ ...form, referralCode });
      toast.success("Check your email to verify your account");
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not create account");
    }
  }

  return (
    <div className="container flex max-w-md flex-col justify-center py-16">
      <Card>
        <CardHeader>
          <CardTitle>{t("registerTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Account type</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={form.role === "customer" ? "default" : "outline"}
                  onClick={() => setForm({ ...form, role: "customer" })}
                >
                  Customer
                </Button>
                <Button
                  type="button"
                  variant={form.role === "seller" ? "default" : "outline"}
                  onClick={() => setForm({ ...form, role: "seller" })}
                >
                  Seller
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={register.isPending}>
              {t("signUp")}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("hasAccount")}{" "}
              <Link href={`/${locale}/login`} className="text-primary hover:underline">
                {t("signIn")}
              </Link>
            </p>
          </form>
          <div className="mt-4">
            <SocialLoginButtons />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
