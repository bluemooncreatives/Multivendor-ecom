import { Suspense } from "react";
import { AccountRecoveryForm } from "@/components/account-recovery-form";

export default function ResetPasswordPage() {
  return <main className="auth-shell"><Suspense><AccountRecoveryForm mode="reset"/></Suspense></main>;
}
