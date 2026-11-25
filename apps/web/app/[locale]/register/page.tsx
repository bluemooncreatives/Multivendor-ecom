"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthShell } from "@/components/shared/auth-shell";
import { FormField } from "@/components/shared/form-field";
import { SocialLoginButtons } from "@/components/shared/social-login-buttons";
import { useRegister, useSendPhoneCode } from "@/lib/hooks/useAuth";
import { useAuthOptions } from "@/lib/hooks/useAuthOptions";
import { RegistrationCaptcha } from "@/components/shared/registration-captcha";
import { getApiErrorMessage } from "@/lib/utils";

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
  const [form, setForm] = useState({ name: "", email: "", password: "", role: defaultRole as "customer" | "seller" });

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
      toast.success(usingPhoneOnly ? "Account created" : "Check your email to verify your account");
      router.push(`/${locale}/dashboard`);
    } catch (err) {
      setRecaptchaToken("");
      setCaptchaAttempt((value) => value + 1);
      setPhoneCaptchaReady(false);
      toast.error(getApiErrorMessage(err, "Could not create account"));
    }
  }

  return (
    <AuthShell title={t("registerTitle")} description="Join the marketplace as a shopper or seller." icon={UserPlus}>
      <form className="space-y-4" onSubmit={handleSubmit}>
        {options?.phone?.registration && (
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border bg-muted/20 p-3 text-sm font-medium">
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
          <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormField>

        {!usingPhoneOnly && (
          <FormField label={t("email")} htmlFor="email" required>
            <Input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
          />
        </FormField>

        {requiresPhone && (
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
            />
          </FormField>
        )}

        {requiresPhone && (
          <div className="space-y-2 rounded-lg border bg-muted/20 p-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              disabled={
                sendPhoneCode.isPending ||
                !/^\+[1-9]\d{7,14}$/.test(phone) ||
                (options?.recaptcha.enabled && !recaptchaToken)
              }
              onClick={async () => {
                try {
                  await sendPhoneCode.mutateAsync({ phone, recaptchaToken: recaptchaToken || undefined });
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
              Send registration code
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
              />
            </FormField>
          </div>
        )}

        <div className="space-y-2">
          <Label>Account type</Label>
          <div className="grid grid-cols-2 gap-2">
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

        {options?.recaptcha.enabled && (
          <RegistrationCaptcha key={captchaAttempt} siteKey={options.recaptcha.siteKey} onChange={setRecaptchaToken} />
        )}

        {optionsFailed && (
          <Alert variant="destructive">
            <AlertDescription>Registration settings could not load. Reload to try again.</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={
            register.isPending ||
            loadingOptions ||
            optionsFailed ||
            (options?.recaptcha.enabled && !recaptchaToken && !(requiresPhone && phoneCaptchaReady)) ||
            (requiresPhone && !phoneCode)
          }
        >
          {t("signUp")}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link href={`/${locale}/login`} className="font-medium text-primary hover:underline">
            {t("signIn")}
          </Link>
        </p>
      </form>
      <div className="mt-4">
        <SocialLoginButtons />
      </div>
    </AuthShell>
  );
}
