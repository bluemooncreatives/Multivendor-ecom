"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CLEAR_SECRET, type SecretStatus } from "@/lib/hooks/useAdminSettings";

interface SecretInputProps {
  label: string;
  status?: SecretStatus;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
}

export function SecretInput({ label, status, value, onChange, placeholder }: SecretInputProps) {
  const [editing, setEditing] = useState(false);
  const configured = status?.configured ?? false;

  if (configured && !editing && value !== CLEAR_SECRET) {
    return (
        <div className="space-y-1.5">
          <Label>{label}</Label>
          <div className="flex items-center gap-2">
            <span className="flex h-10 flex-1 items-center rounded-md border bg-muted px-3 font-mono text-sm text-muted-foreground">
              {status?.hint ?? "••••••••"}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(true);
                onChange("");
              }}
            >
              Replace
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(CLEAR_SECRET)}>
              Clear
            </Button>
          </div>
        </div>
        );
  }

        if (value === CLEAR_SECRET) {
    return (
          <div className="space-y-1.5">
            <Label>{label}</Label>
            <div className="flex items-center gap-2">
              <span className="flex h-10 flex-1 items-center rounded-md border border-destructive px-3 text-sm text-destructive">
                Will be cleared on save
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange(undefined)}>
                Undo
              </Button>
            </div>
          </div>
          );
  }

          return (
            <div className="space-y-1.5">
              <Label>{label}</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value || undefined)}
                placeholder={placeholder ?? (configured ? "Enter a new value" : "Not configured")}
              />
              {configured && (
                <button
                  type="button"
                  className="text-xs text-primary underline"
                  onClick={() => {
                    setEditing(false);
                    onChange(undefined);
                  }}
                >
                  Keep the existing value
                </button>
              )}
            </div>
            );
}
