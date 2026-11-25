"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

interface CopyButtonProps extends Omit<ButtonProps, "onClick"> {
  value: string;
  label?: string;
  successMessage?: string;
}

export function CopyButton({
  value,
  label = "Copy",
  successMessage = "Copied to clipboard",
  variant = "outline",
  size = "sm",
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(successMessage);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Button type="button" variant={variant} size={size} onClick={handleCopy} {...props}>
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}
