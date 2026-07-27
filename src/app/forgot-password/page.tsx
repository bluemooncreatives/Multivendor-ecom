import { Suspense } from "react";
import { AccountRecoveryForm } from "@/components/account-recovery-form";

export default function ForgotPasswordPage() {
  return <main className="auth-shell"><Suspense><AccountRecoveryForm mode="forgot"/></Suspense></main>;
}
