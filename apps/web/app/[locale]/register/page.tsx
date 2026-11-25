"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { UserPlus, Store, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { AuthShell } from "@/components/shared/auth-shell";
import { FormField } from "@/components/shared/form-field";
import { SocialLoginButtons } from "@/components/shared/social-login-buttons";
import { useRegister, useSendPhoneCode } from "@/lib/hooks/useAuth";
import { useAuthOptions } from "@/lib/hooks/useAuthOptions";
import { RegistrationCaptcha } from "@/components/shared/registration-captcha";
import { getApiErrorMessage } from "@/lib/utils";
import { cn } from "@/lib/utils";

const BRAND_ASIDE = (
  <div className="flex h-full flex-col justify-between">
    <div className="space-y-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-white/20 backdrop-blur-sm">
        <Sparkles className="h-8 w-8" />
      </div>
      <div className="space-y-3">
        <h2 className="text-3xl font-black leading-tight">
          Join our thriving marketplace
        </h2>
        <p className="text-primary-foreground/80">
          Shop thousands of products or start selling your own. It's free to get started.
        </p>
      </div>
    </div>
    <div className="space-y-3">
      {[
        { icon: ShoppingBag, label: "Shop from thousands of sellers" },
        { icon: Store, label: "List and sell your products" },
        { icon: Sparkles, label: "Earn with our affiliate program" },
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
  const referralCode = searchParams.get("ref") ?? undefined;
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: defaultRole as "customer" | "seller",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await register.mutateAsync({
        ...form,
        email: usingPhoneOnly ? undefined : form.email,
        referralCode,
        recaptchaToken: recaptchaToken || undefined,
        phone: requiresPhone ? phone || undefined : undefined,
        phoneCode: requiresPhone ? phoneCode || undefined : undefined,
      });
      toast.success(
        usingPhoneOnly ? "Account created! 🎉" : "Check your email to verify your account",
      );
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      setRecaptchaToken("");
      setCaptchaAttempt((value) => value + 1);
      setPhoneCaptchaReady(false);
      toast.error(getApiErrorMessage(err, "Could not create account"));
    }
  }

  return (
    <AuthShell
      title={t("registerTitle")}
      description="Join the marketplace as a shopper or seller."
      icon={UserPlus}
      aside={BRAND_ASIDE}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Account type selector */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">I want to</Label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { role: "customer" as const, label: "Shop", icon: ShoppingBag, desc: "Browse & buy" },
              { role: "seller" as const, label: "Sell", icon: Store, desc: "List products" },
            ].map(({ role, label, icon: Icon, desc }) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm({ ...form, role })}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border p-4 text-sm font-semibold transition-all",
                  form.role === role
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-accent",
                )}
              >
                <Icon className="h-6 w-6" />
                <span>{label}</span>
                <span className="text-xs font-normal opacity-70">{desc}</span>
              </button>
            ))}
          </div>
        </div>

        {options?.phone?.registration && (
          <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border bg-muted/20 p-3 text-sm font-medium">
            <Checkbox
              checked={phoneOnly}
              onCheckedChange={(checked) => {
                setPhoneOnly(checked === true);
                setPhoneCode("");
                setPhoneCaptchaReady(false);
              }}
            />
            <span>Register using a phone number</span>
          </label>
        )}

        <FormField label={t("name")} htmlFor="name" required>
          <Input
            id="name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your full name"
            className="h-11 rounded-xl"
          />
        </FormField>

        {!usingPhoneOnly && (
          <FormField label={t("email")} htmlFor="email" required>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              className="h-11 rounded-xl"
            />
          </FormField>
        )}

        <FormField label={t("password")} htmlFor="password" required>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Min. 8 characters"
            className="h-11 rounded-xl"
          />
        </FormField>

        {requiresPhone && (
          <>
            <FormField label="Phone number" htmlFor="register-phone" required>
              <Input
                id="register-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+919000000001"
                pattern="\+[1-9][0-9]{7,14}"
                required
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setPhoneCode("");
                  setPhoneCaptchaReady(false);
                }}
                className="h-11 rounded-xl"
              />
            </FormField>

            <div className="space-y-3 rounded-2xl border bg-muted/20 p-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full rounded-xl"
                disabled={
                  sendPhoneCode.isPending ||
                  !/^\+[1-9]\d{7,14}$/.test(phone) ||
                  (options?.recaptcha.enabled && !recaptchaToken)
                }
                onClick={async () => {
                  try {
                    await sendPhoneCode.mutateAsync({
                      phone,
                      recaptchaToken: recaptchaToken || undefined,
                    });
                    setPhoneCaptchaReady(true);
                    toast.success("Phone code sent. Check your messages.");
                  } catch (error) {
                    setRecaptchaToken("");
                    setCaptchaAttempt((value) => value + 1);
                    setPhoneCaptchaReady(false);
                    toast.error(getApiErrorMessage(error, "Could not send a code"));
                  }
                }}
              >
                Send verification code
              </Button>
              <FormField label="Phone verification code" htmlFor="register-phone-code" required>
                <Input
                  id="register-phone-code"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  value={phoneCode}
                  onChange={(event) => setPhoneCode(event.target.value)}
                  placeholder="6-digit code"
                  className="h-11 rounded-xl"
                />
              </FormField>
            </div>
          </>
        )}

        {options?.recaptcha.enabled && (
          <RegistrationCaptcha
            key={captchaAttempt}
            siteKey={options.recaptcha.siteKey}
            onChange={setRecaptchaToken}
          />
        )}

        {optionsFailed && (
          <Alert variant="destructive" className="rounded-2xl">
            <AlertDescription>
              Registration settings could not load. Reload to try again.
            </AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="h-11 w-full rounded-xl font-bold"
          disabled={
            register.isPending ||
            loadingOptions ||
            optionsFailed ||
            (options?.recaptcha.enabled && !recaptchaToken && !(requiresPhone && phoneCaptchaReady)) ||
            (requiresPhone && !phoneCode)
          }
        >
          {register.isPending ? "Creating account..." : t("signUp")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link href={`/${locale}/login`} className="font-bold text-primary hover:underline">
            {t("signIn")}
          </Link>
        </p>
      </form>

      {(options?.providers?.length ?? 0) > 0 && (
        <>
          <div className="relative my-5">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Or sign up with
            </span>
          </div>
          <SocialLoginButtons />
        </>
      )}
    </AuthShell>
  );
}
