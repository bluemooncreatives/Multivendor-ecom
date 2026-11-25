"use client";

import { signIn } from "next-auth/react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { useAuthOptions } from "@/lib/hooks/useAuthOptions";

export function SocialLoginButtons() {
  const { data } = useAuthOptions();
  const locale = useLocale();
  if (!data?.providers.length) return null;
  return (
      <div className="space-y-3 pt-2">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {data.providers.map((provider) => (
              <Button
                key={provider}
                type="button"
                variant="outline"
                onClick={() => signIn(provider, { callbackUrl: `/${locale}/dashboard` })}
              >
                {provider[0]!.toUpperCase() + provider.slice(1)}
              </Button>
        ))}
            </div>
    </div>
        );
}
