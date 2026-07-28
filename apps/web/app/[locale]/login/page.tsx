"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SocialLoginButtons } from "@/components/shared/social-login-buttons";
import { useLogin } from "@/lib/hooks/useAuth";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login.mutateAsync({ email, password });
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Invalid email or password");
    }
  }

  return (
    <div className="container flex max-w-md flex-col justify-center py-16">
      <Card>
        <CardHeader>
          <CardTitle>{t("loginTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={login.isPending}>
              {t("signIn")}
            </Button>
            <div className="flex justify-between text-sm text-muted-foreground">
              <Link href={`/${locale}/forgot-password`} className="hover:underline">
                {t("forgotPassword")}
              </Link>
              <span>
                {t("noAccount")}{" "}
                <Link href={`/${locale}/register`} className="text-primary hover:underline">
                  {t("signUp")}
                </Link>
              </span>
            </div>
          </form>
          <div className="mt-4">
            <SocialLoginButtons />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
