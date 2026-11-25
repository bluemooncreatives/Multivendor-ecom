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
import { useRegister, useSendPhoneCode } from "@/lib/hooks/useAuth";
import { useAuthOptions } from "@/lib/hooks/useAuthOptions";
import { RegistrationCaptcha } from "@/components/shared/registration-captcha";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const register = useRegister();
  const sendPhoneCode = useSendPhoneCode("registration");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneOnly, setPhoneOnly] = useState(false);
  const { data: options, isPending: loadingOptions, isError: optionsFailed } = useAuthOptions();
  const usingPhoneOnly = phoneOnly && options?.phone?.registration === true;
  const requiresPhone = usingPhoneOnly || options?.phone?.registrationRequired === true;
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [captchaAttempt, setCaptchaAttempt] = useState(0);
  const [phoneCaptchaReady, setPhoneCaptchaReady] = useState(false);
  const defaultRole = searchParams.get("role") === "seller" ? "seller" : "customer";
  // Carried from an affiliate's shared link (?ref=CODE). An unknown code is not an
  // error — the account is created either way, it just earns nobody a commission.
  const referralCode = searchParams.get("ref") ?? undefined;
  const [form, setForm] = useState({ name: "", email: "", password: "", role: defaultRole as "customer" | "seller" });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await register.mutateAsync({ ...form, email: usingPhoneOnly ? undefined : form.email, referralCode, recaptchaToken: recaptchaToken || undefined,
        phone: requiresPhone ? phone || undefined : undefined, phoneCode: requiresPhone ? phoneCode || undefined : undefined });
      toast.success(usingPhoneOnly ? "Account created" : "Check your email to verify your account");
      router.push(`/${locale}/dashboard`);
    } catch (err: any) {
      setRecaptchaToken(""); setCaptchaAttempt((value) => value + 1);
      setPhoneCaptchaReady(false);
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
            {options?.phone?.registration && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={phoneOnly}
              onChange={(event) => { setPhoneOnly(event.target.checked); setPhoneCode(""); setPhoneCaptchaReady(false); }} />Register using a phone number</label>}
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            {!usingPhoneOnly && <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>}
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
            {requiresPhone && <div className="space-y-2">
              <Label htmlFor="register-phone">Phone number</Label>
              <Input id="register-phone" type="tel" autoComplete="tel" placeholder="+919000000001" pattern="\+[1-9][0-9]{7,14}"
                required value={phone} onChange={(event) => { setPhone(event.target.value); setPhoneCode(""); setPhoneCaptchaReady(false); }} />
            </div>}
            {requiresPhone && <div className="space-y-2">
              <Button type="button" variant="outline" disabled={sendPhoneCode.isPending || !/^\+[1-9]\d{7,14}$/.test(phone) || (options?.recaptcha.enabled && !recaptchaToken)} onClick={async () => {
                try { await sendPhoneCode.mutateAsync({ phone, recaptchaToken: recaptchaToken || undefined }); setPhoneCaptchaReady(true); toast.success("Phone code sent. Check your messages."); }
                catch (error: any) { setRecaptchaToken(""); setCaptchaAttempt((value) => value + 1); setPhoneCaptchaReady(false); toast.error(error?.response?.data?.message ?? "Could not send a code"); }
              }}>Send registration code</Button>
              <Label htmlFor="register-phone-code">Phone verification code</Label>
              <Input id="register-phone-code" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" value={phoneCode} onChange={(event) => setPhoneCode(event.target.value)} />
            </div>}
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
            {options?.recaptcha.enabled && <RegistrationCaptcha key={captchaAttempt} siteKey={options.recaptcha.siteKey} onChange={setRecaptchaToken} />}
            {optionsFailed && <p className="text-sm text-destructive">Registration settings could not load. Reload to try again.</p>}
            <Button type="submit" className="w-full" disabled={register.isPending || loadingOptions || optionsFailed || (options?.recaptcha.enabled && !recaptchaToken && !(requiresPhone && phoneCaptchaReady)) || (requiresPhone && !phoneCode)}>
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
