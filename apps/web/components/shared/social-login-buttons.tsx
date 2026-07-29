"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function SocialLoginButtons() {
  return (
    <div className="space-y-2">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {(["google", "facebook", "twitter"] as const).map((provider) => (
          <Button key={provider} type="button" variant="outline" onClick={() => signIn(provider, { callbackUrl: "/" })}>
            {provider[0]!.toUpperCase() + provider.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  );
}
