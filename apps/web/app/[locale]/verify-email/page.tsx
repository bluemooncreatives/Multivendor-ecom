"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useVerifyEmail } from "@/lib/hooks/useAuth";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
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
    <div className="container max-w-md py-16 text-center">
      {status === "pending" && <p>Verifying your email…</p>}
      {status === "success" && <p className="text-green-600">Your email has been verified. You can now sign in.</p>}
      {status === "error" && <p className="text-destructive">This verification link is invalid or has expired.</p>}
    </div>
  );
}
