import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthShellProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  /** Optional side panel content (e.g. brand illustration) */
  aside?: ReactNode;
}

/** Shared centered card frame for login, register, password reset, and verification flows. */
export function AuthShell({ title, description, icon: Icon, children, className, aside }: AuthShellProps) {
  if (aside) {
    return (
      <div className="container flex min-h-[calc(100vh-10rem)] items-center justify-center py-12">
        <div className="grid w-full max-w-5xl gap-0 overflow-hidden rounded-3xl border shadow-xl md:grid-cols-2">
          {/* Left: illustration */}
          <div className="hidden flex-col justify-between bg-gradient-to-br from-primary to-orange-600 p-10 text-primary-foreground md:flex">
            {aside}
          </div>

          {/* Right: form */}
          <div className="bg-card p-8 md:p-10">
            {Icon && (
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
            )}
            <h1 className="mb-1 text-2xl font-bold tracking-tight">{title}</h1>
            {description && <p className="mb-6 text-sm text-muted-foreground">{description}</p>}
            <div className={cn("space-y-4", className)}>{children}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex min-h-[calc(100vh-10rem)] max-w-md flex-col justify-center py-12">
      <div className={cn("overflow-hidden rounded-3xl border bg-card shadow-xl", className)}>
        {/* Header */}
        <div className="border-b bg-gradient-to-br from-primary/5 to-transparent p-7 text-center">
          {Icon && (
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
              <Icon className="h-7 w-7" />
            </div>
          )}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        </div>

        {/* Body */}
        <div className="p-7">{children}</div>
      </div>
    </div>
  );
}
