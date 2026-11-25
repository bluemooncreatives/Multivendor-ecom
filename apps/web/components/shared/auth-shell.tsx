import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AuthShellProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: ReactNode;
}

/** Shared centered card frame for login, register, password reset, and verification flows. */
export function AuthShell({ title, description, icon: Icon, children }: AuthShellProps) {
  return (
    <div className="container flex min-h-[calc(100vh-14rem)] max-w-md flex-col justify-center py-12">
      <Card className="overflow-hidden border shadow-md">
        <CardHeader className="space-y-2 border-b bg-muted/30 pb-5 text-center">
          {Icon && (
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <CardTitle className="text-xl">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="pt-6">{children}</CardContent>
      </Card>
    </div>
  );
}
