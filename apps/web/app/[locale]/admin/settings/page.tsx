"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useGeneralSettings, useSaveGeneralSettings } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSettingsPage() {
  const { data: settings } = useGeneralSettings();
  const saveSettings = useSaveGeneralSettings();
  const [form, setForm] = useState({
    appName: "",
    defaultLanguage: "en",
    defaultCurrency: "INR",
    supportEmail: "",
    supportPhone: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        appName: settings.appName ?? "",
        defaultLanguage: settings.defaultLanguage ?? "en",
        defaultCurrency: settings.defaultCurrency ?? "INR",
        supportEmail: settings.supportEmail ?? "",
        supportPhone: settings.supportPhone ?? "",
      });
    }
  }, [settings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await saveSettings.mutateAsync(form);
      toast.success("Settings saved");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not save settings");
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">General settings</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Store information</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <div className="space-y-2 sm:col-span-2">
              <Label>App name</Label>
              <Input value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Default language</Label>
              <Input value={form.defaultLanguage} onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Default currency</Label>
              <Input value={form.defaultCurrency} onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Support email</Label>
              <Input value={form.supportEmail} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Support phone</Label>
              <Input value={form.supportPhone} onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} />
            </div>
            <Button type="submit" className="sm:col-span-2" disabled={saveSettings.isPending}>
              Save settings
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
