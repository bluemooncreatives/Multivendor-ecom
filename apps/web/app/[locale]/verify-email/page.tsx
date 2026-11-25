"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { MailCheck, AlertCircle, Loader2 } from "lucide-react";
import { useVerifyEmail } from "@/lib/hooks/useAuth";
import { AuthShell } from "@/components/shared/auth-shell";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const locale = useLocale();
  const verifyEmail = useVerifyEmail();
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    verifyEmail.mutate(token, {
      onSuccess: () => setStatus("success"),
      onError: () => setStatus("error"),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthShell title="Email verification" icon={MailCheck}>
      <div className="space-y-4 text-center">
        {status === "pending" && (
          <div className="flex flex-col items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p>Verifying your email…</p>
          </div>
        )}
        {status === "success" && (
          <Alert variant="success" className="text-start">
            <MailCheck className="h-4 w-4" />
            <AlertDescription>Your email has been verified. You can now sign in.</AlertDescription>
          </Alert>
        )}
        {status === "error" && (
          <Alert variant="destructive" className="text-start">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>This verification link is invalid or has expired.</AlertDescription>
          </Alert>
        )}
        {status !== "pending" && (
          <Button asChild className="w-full">
            <Link href={`/${locale}/login`}>Go to Sign In</Link>
          </Button>
        )}
      </div>
    </AuthShell>
  );
}
