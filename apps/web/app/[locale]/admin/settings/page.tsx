"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useGeneralSettings, useSaveGeneralSettings } from "@/lib/hooks/useAdmin";
import {
  useSettingsGroup,
  useSaveSettingsGroup,
  useBusinessSettings,
  useSaveBusinessSettings,
  useSeoSettings,
  useSaveSeoSettings,
  useVerificationFields,
  useSaveVerificationField,
  useDeleteVerificationField,
  type SettingsGroup,
  type SecretStatus,
  type ActivationSettings,
  type VerificationField,
} from "@/lib/hooks/useAdminSettings";
import { useUploadFile } from "@/lib/hooks/useCatalogForm";
import { SecretInput } from "@/components/admin/secret-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

function apiError(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="activation">Features</TabsTrigger>
          <TabsTrigger value="commerce">Commerce</TabsTrigger>
          <TabsTrigger value="smtp">Email</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="social">Social login</TabsTrigger>
          <TabsTrigger value="recaptcha">reCAPTCHA</TabsTrigger>
          <TabsTrigger value="seo">SEO &amp; analytics</TabsTrigger>
          <TabsTrigger value="verification">Verification form</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralTab />
        </TabsContent>
        <TabsContent value="activation">
          <ActivationTab />
        </TabsContent>
        <TabsContent value="commerce">
          <CommerceTab />
        </TabsContent>
        <TabsContent value="smtp">
          <SmtpTab />
        </TabsContent>
        <TabsContent value="storage">
          <StorageTab />
        </TabsContent>
        <TabsContent value="social">
          <SocialTab />
        </TabsContent>
        <TabsContent value="recaptcha">
          <RecaptchaTab />
        </TabsContent>
        <TabsContent value="seo">
          <SeoTab />
        </TabsContent>
        <TabsContent value="verification">
          <VerificationFormTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// --- General ------------------------------------------------------------------

const LOGO_SLOTS = [
  { field: "logoUrl", label: "Header logo" },
  { field: "footerLogoUrl", label: "Footer logo" },
  { field: "adminLogoUrl", label: "Admin logo" },
  { field: "faviconUrl", label: "Favicon" },
  { field: "loginBackgroundUrl", label: "Login background" },
  { field: "loginSidebarUrl", label: "Login sidebar" },
] as const;

function GeneralTab() {
  const { data: settings } = useGeneralSettings();
  const save = useSaveGeneralSettings();
  const upload = useUploadFile();
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (settings) setForm({ ...settings, socialProfiles: settings.socialProfiles ?? {} });
  }, [settings]);

  const socials = (form.socialProfiles as Record<string, string>) ?? {};
  const str = (field: string) => String(form[field] ?? "");

  async function handleUpload(field: string, file: File | null) {
    if (!file) return;
    try {
      const stored = await upload.mutateAsync({ file, kind: "image" });
      setForm((prev) => ({ ...prev, [field]: stored.url }));
    } catch (err) {
      toast.error(apiError(err, "Upload failed"));
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await save.mutateAsync(form);
          toast.success("Settings saved");
        } catch (err) {
          toast.error(apiError(err, "Could not save settings"));
        }
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Store information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="App name" className="sm:col-span-2">
            <Input value={str("appName")} onChange={(e) => setForm({ ...form, appName: e.target.value })} />
          </Field>
          <Field label="Default language">
            <Input value={str("defaultLanguage")} onChange={(e) => setForm({ ...form, defaultLanguage: e.target.value })} />
          </Field>
          <Field label="Default currency">
            <Input value={str("defaultCurrency")} onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })} />
          </Field>
          <Field label="Timezone">
            <Input value={str("defaultTimezone")} onChange={(e) => setForm({ ...form, defaultTimezone: e.target.value })} />
          </Field>
          <Field label="Theme colour">
            <Input type="color" value={str("themeColor") || "#2563eb"} onChange={(e) => setForm({ ...form, themeColor: e.target.value })} />
          </Field>
          <Field label="Support email">
            <Input value={str("supportEmail")} onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
          </Field>
          <Field label="Support phone">
            <Input value={str("supportPhone")} onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} />
          </Field>
          <Field label="Address" className="sm:col-span-2">
            <Textarea rows={2} value={str("address")} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </Field>
          <Field label="Footer text" className="sm:col-span-2">
            <Textarea rows={2} value={str("footerText")} onChange={(e) => setForm({ ...form, footerText: e.target.value })} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Logos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          {LOGO_SLOTS.map((slot) => (
            <Field key={slot.field} label={slot.label}>
              {form[slot.field] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={String(form[slot.field])} alt="" className="h-12 w-auto max-w-full rounded border object-contain" />
              ) : null}
              <Input type="file" accept="image/*" onChange={(e) => handleUpload(slot.field, e.target.files?.[0] ?? null)} />
            </Field>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social profiles</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(["facebook", "twitter", "instagram", "youtube", "linkedin"] as const).map((network) => (
            <Field key={network} label={network[0]!.toUpperCase() + network.slice(1)}>
              <Input
                type="url"
                value={socials[network] ?? ""}
                onChange={(e) => setForm({ ...form, socialProfiles: { ...socials, [network]: e.target.value } })}
              />
            </Field>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" disabled={save.isPending}>
        Save settings
      </Button>
    </form>
  );
}

// --- Activation toggles --------------------------------------------------------

const ACTIVATION_TOGGLES: { key: keyof ActivationSettings; label: string; hint: string }[] = [
  { key: "vendorSystem", label: "Vendor system", hint: "Allow third-party sellers to list products." },
  { key: "guestCheckout", label: "Guest checkout", hint: "Let shoppers order without an account." },
  { key: "emailVerification", label: "Email verification", hint: "Require a confirmed address before signing in." },
  { key: "conversation", label: "Conversations", hint: "Buyer–seller messaging." },
  { key: "couponSystem", label: "Coupons", hint: "Accept discount codes at checkout." },
  { key: "walletSystem", label: "Wallet", hint: "Store credit customers can top up and spend." },
  { key: "pickupPoint", label: "Pickup points", hint: "Offer in-person collection as a delivery option." },
  { key: "cashOnDelivery", label: "Cash on delivery", hint: "Offer COD as a payment method." },
  { key: "reviewSystem", label: "Reviews", hint: "Let verified buyers rate products." },
  { key: "classifiedProduct", label: "Classifieds", hint: "Customer-to-customer listings." },
  { key: "categoryBasedCommission", label: "Category-based commission", hint: "Take each category's rate instead of the global one." },
  { key: "forceHttps", label: "Force HTTPS", hint: "Redirect insecure requests." },
  { key: "maintenanceMode", label: "Maintenance mode", hint: "Take the storefront offline for shoppers." },
];

function ActivationTab() {
  const { data: settings } = useBusinessSettings();
  const save = useSaveBusinessSettings();

  async function toggle(key: keyof ActivationSettings, value: boolean) {
    try {
      await save.mutateAsync({ activation: { ...settings!.activation, [key]: value } });
      toast.success("Saved");
    } catch (err) {
      toast.error(apiError(err, "Could not save"));
    }
  }

  if (!settings) return <p className="text-muted-foreground">Loading…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Features</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {ACTIVATION_TOGGLES.map((toggleDef) => (
          <div key={toggleDef.key} className="flex items-start justify-between gap-4 rounded-md border p-3">
            <div>
              <p className="text-sm font-medium">{toggleDef.label}</p>
              <p className="text-xs text-muted-foreground">{toggleDef.hint}</p>
            </div>
            <Switch
              checked={settings.activation?.[toggleDef.key] ?? false}
              onCheckedChange={(v) => toggle(toggleDef.key, v)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// --- Commerce (tax, commission, shipping) --------------------------------------

function CommerceTab() {
  const { data: settings } = useBusinessSettings();
  const save = useSaveBusinessSettings();
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (settings) setForm({ ...settings });
  }, [settings]);

  const num = (field: string) => (form[field] as number | null | undefined) ?? 0;
  const mode = String(form.shippingMode ?? "flat");

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          // `activation` is owned by the Features tab; sending a stale copy from
          // here would revert any toggle changed since this tab loaded.
          const { activation, ...rest } = form;
          await save.mutateAsync(rest);
          toast.success("Saved");
        } catch (err) {
          toast.error(apiError(err, "Could not save"));
        }
      }}
    >
      <Card>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <Field label="Tax %" hint="Applied to products that do not set their own rate.">
            <Input type="number" min={0} step="0.01" value={num("taxPercent")} onChange={(e) => setForm({ ...form, taxPercent: Number(e.target.value) })} />
          </Field>
          <Field label="Commission %" hint="Default platform cut, unless a package or category overrides it.">
            <Input type="number" min={0} max={100} step="0.01" value={num("commissionPercent")} onChange={(e) => setForm({ ...form, commissionPercent: Number(e.target.value) })} />
          </Field>

          <Field label="Shipping mode">
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={mode}
              onChange={(e) => setForm({ ...form, shippingMode: e.target.value })}
            >
              <option value="flat">Flat rate</option>
              <option value="product_wise">Product wise</option>
              <option value="seller_wise">Seller wise</option>
              <option value="free">Free shipping</option>
            </select>
          </Field>
          <Field label="Flat shipping cost" hint="Split across the shipments in an order.">
            <Input type="number" min={0} step="0.01" disabled={mode !== "flat"} value={num("flatShippingCost")} onChange={(e) => setForm({ ...form, flatShippingCost: Number(e.target.value) })} />
          </Field>
          <Field label="In-House shipping cost" hint="Charged for admin-owned products under seller-wise shipping.">
            <Input type="number" min={0} step="0.01" disabled={mode !== "seller_wise"} value={num("adminShippingCost")} onChange={(e) => setForm({ ...form, adminShippingCost: Number(e.target.value) })} />
          </Field>
          <Field label="Free shipping above" hint="Leave empty to always charge shipping.">
            <Input
              type="number"
              min={0}
              step="0.01"
              value={(form.minOrderForFreeShipping as number | null) ?? ""}
              onChange={(e) => setForm({ ...form, minOrderForFreeShipping: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </Field>

          <div className="flex items-start justify-between gap-4 rounded-md border p-3 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Demo mode</p>
              <p className="text-xs text-muted-foreground">
                Blocks every state-changing request except sign-in and cart edits.
              </p>
            </div>
            <Switch checked={Boolean(form.demoMode)} onCheckedChange={(v) => setForm({ ...form, demoMode: v })} />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={save.isPending}>
        Save
      </Button>
    </form>
  );
}

// --- Credential groups ----------------------------------------------------------

/** Shared shell for the four secret-bearing groups. */
function GroupForm({
  group,
  title,
  children,
}: {
  group: SettingsGroup;
  title: string;
  children: (
    form: Record<string, unknown>,
    setForm: (next: Record<string, unknown>) => void,
    status: Record<string, SecretStatus>,
  ) => React.ReactNode;
}) {
  const { data: stored } = useSettingsGroup(group);
  const save = useSaveSettingsGroup(group);
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    if (!stored) return;
    // Secret fields arrive as {configured, hint}; they are kept out of form state
    // so an untouched field submits nothing and the stored value survives.
    const plain = Object.fromEntries(
      Object.entries(stored).filter(([, v]) => typeof v !== "object" || v === null),
    );
    setForm(plain);
  }, [stored]);

  const status = Object.fromEntries(
    Object.entries(stored ?? {}).filter(([, v]) => typeof v === "object" && v !== null),
  ) as Record<string, SecretStatus>;

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await save.mutateAsync(form);
          toast.success("Saved");
        } catch (err) {
          toast.error(apiError(err, "Could not save"));
        }
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">{children(form, setForm, status)}</CardContent>
      </Card>
      <Button type="submit" disabled={save.isPending}>
        Save
      </Button>
      <p className="text-xs text-muted-foreground">
        Secrets are encrypted before they are stored and are never sent back to this page.
      </p>
    </form>
  );
}

function SmtpTab() {
  return (
    <GroupForm group="smtp" title="Outgoing email">
      {(form, setForm, status) => (
        <>
          <Field label="Host">
            <Input value={String(form.host ?? "")} onChange={(e) => setForm({ ...form, host: e.target.value })} />
          </Field>
          <Field label="Port">
            <Input type="number" value={String(form.port ?? "")} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} />
          </Field>
          <Field label="Username">
            <Input value={String(form.username ?? "")} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </Field>
          <SecretInput
            label="Password"
            status={status.password}
            value={form.password as string | undefined}
            onChange={(v) => setForm({ ...form, password: v })}
          />
          <Field label="Encryption">
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={String(form.encryption ?? "tls")}
              onChange={(e) => setForm({ ...form, encryption: e.target.value })}
            >
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
              <option value="none">None</option>
            </select>
          </Field>
          <Field label="From address">
            <Input type="email" value={String(form.fromAddress ?? "")} onChange={(e) => setForm({ ...form, fromAddress: e.target.value })} />
          </Field>
          <Field label="From name">
            <Input value={String(form.fromName ?? "")} onChange={(e) => setForm({ ...form, fromName: e.target.value })} />
          </Field>
        </>
      )}
    </GroupForm>
  );
}

function StorageTab() {
  return (
    <GroupForm group="storage" title="File storage">
      {(form, setForm, status) => (
        <>
          <Field label="Driver">
            <select
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              value={String(form.driver ?? "local")}
              onChange={(e) => setForm({ ...form, driver: e.target.value })}
            >
              <option value="local">Local disk</option>
              <option value="s3">Amazon S3</option>
              <option value="cloudinary">Cloudinary</option>
            </select>
          </Field>
          <Field label="Bucket">
            <Input value={String(form.bucket ?? "")} onChange={(e) => setForm({ ...form, bucket: e.target.value })} />
          </Field>
          <Field label="Region">
            <Input value={String(form.region ?? "")} onChange={(e) => setForm({ ...form, region: e.target.value })} />
          </Field>
          <Field label="Endpoint" hint="Only for S3-compatible providers.">
            <Input value={String(form.endpoint ?? "")} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} />
          </Field>
          <SecretInput
            label="Access key id"
            status={status.accessKeyId}
            value={form.accessKeyId as string | undefined}
            onChange={(v) => setForm({ ...form, accessKeyId: v })}
          />
          <SecretInput
            label="Secret access key"
            status={status.secretAccessKey}
            value={form.secretAccessKey as string | undefined}
            onChange={(v) => setForm({ ...form, secretAccessKey: v })}
          />
        </>
      )}
    </GroupForm>
  );
}

function SocialTab() {
  return (
    <GroupForm group="socialLogin" title="Social login">
      {(form, setForm, status) => (
        <>
          {(
            [
              { provider: "google", label: "Google", idField: "googleClientId", secretField: "googleClientSecret" },
              { provider: "facebook", label: "Facebook", idField: "facebookAppId", secretField: "facebookAppSecret" },
              { provider: "twitter", label: "Twitter", idField: "twitterClientId", secretField: "twitterClientSecret" },
            ] as const
          ).map((entry) => (
            <div key={entry.provider} className="space-y-3 rounded-md border p-3 sm:col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{entry.label}</p>
                <Switch
                  checked={Boolean(form[`${entry.provider}Enabled`])}
                  onCheckedChange={(v) => setForm({ ...form, [`${entry.provider}Enabled`]: v })}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Client id">
                  <Input
                    value={String(form[entry.idField] ?? "")}
                    onChange={(e) => setForm({ ...form, [entry.idField]: e.target.value })}
                  />
                </Field>
                <SecretInput
                  label="Client secret"
                  status={status[entry.secretField]}
                  value={form[entry.secretField] as string | undefined}
                  onChange={(v) => setForm({ ...form, [entry.secretField]: v })}
                />
              </div>
            </div>
          ))}
        </>
      )}
    </GroupForm>
  );
}

function RecaptchaTab() {
  return (
    <GroupForm group="recaptcha" title="reCAPTCHA">
      {(form, setForm, status) => (
        <>
          <div className="flex items-center justify-between rounded-md border p-3 sm:col-span-2">
            <p className="text-sm font-medium">Enabled</p>
            <Switch checked={Boolean(form.enabled)} onCheckedChange={(v) => setForm({ ...form, enabled: v })} />
          </div>
          <Field label="Site key">
            <Input value={String(form.siteKey ?? "")} onChange={(e) => setForm({ ...form, siteKey: e.target.value })} />
          </Field>
          <SecretInput
            label="Secret key"
            status={status.secretKey}
            value={form.secretKey as string | undefined}
            onChange={(v) => setForm({ ...form, secretKey: v })}
          />
        </>
      )}
    </GroupForm>
  );
}

// --- SEO & analytics -----------------------------------------------------------

function SeoTab() {
  const { data: settings } = useSeoSettings();
  const save = useSaveSeoSettings();
  const upload = useUploadFile();
  const [form, setForm] = useState<Record<string, unknown>>({});

  useEffect(() => {
    // metaKeywords defaults to [] so the comma-joined input stays controlled even
    // on a settings row saved before the field existed.
    if (settings) setForm({ ...settings, metaKeywords: settings.metaKeywords ?? [] });
  }, [settings]);

  const keywords = (form.metaKeywords as string[]) ?? [];

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          await save.mutateAsync(form);
          toast.success("Saved");
        } catch (err) {
          toast.error(apiError(err, "Could not save"));
        }
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search engine</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Meta title" className="sm:col-span-2">
            <Input value={String(form.metaTitle ?? "")} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} />
          </Field>
          <Field label="Meta description" className="sm:col-span-2">
            <Textarea rows={3} value={String(form.metaDescription ?? "")} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
          </Field>
          <Field label="Keywords" hint="Comma separated." className="sm:col-span-2">
            <Input
              value={keywords.join(", ")}
              onChange={(e) =>
                setForm({ ...form, metaKeywords: e.target.value.split(",").map((k) => k.trim()).filter(Boolean) })
              }
            />
          </Field>
          <Field label="Author">
            <Input value={String(form.author ?? "")} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </Field>
          <Field label="Revisit after (days)">
            <Input type="number" min={1} value={Number(form.revisitAfterDays ?? 7)} onChange={(e) => setForm({ ...form, revisitAfterDays: Number(e.target.value) })} />
          </Field>
          <Field label="Sitemap URL">
            <Input value={String(form.sitemapUrl ?? "")} onChange={(e) => setForm({ ...form, sitemapUrl: e.target.value })} />
          </Field>
          <Field label="Share image">
            {form.metaImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={String(form.metaImageUrl)} alt="" className="h-12 w-auto rounded border object-contain" />
            ) : null}
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const stored = await upload.mutateAsync({ file, kind: "image" });
                  setForm((prev) => ({ ...prev, metaImageUrl: stored.url }));
                } catch (err) {
                  toast.error(apiError(err, "Upload failed"));
                }
              }}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Trackers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(
            [
              { toggle: "googleAnalyticsEnabled", field: "googleAnalyticsId", label: "Google Analytics", placeholder: "G-XXXXXXX" },
              { toggle: "facebookPixelEnabled", field: "facebookPixelId", label: "Facebook Pixel", placeholder: "Pixel ID" },
              { toggle: "facebookChatEnabled", field: "facebookPageId", label: "Facebook Chat", placeholder: "Page ID" },
            ] as const
          ).map((tracker) => (
            <div key={tracker.field} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{tracker.label}</p>
                <Switch
                  checked={Boolean(form[tracker.toggle])}
                  onCheckedChange={(v) => setForm({ ...form, [tracker.toggle]: v })}
                />
              </div>
              <Input
                placeholder={tracker.placeholder}
                value={String(form[tracker.field] ?? "")}
                onChange={(e) => setForm({ ...form, [tracker.field]: e.target.value })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Button type="submit" disabled={save.isPending}>
        Save
      </Button>
    </form>
  );
}

// --- Seller verification form builder -------------------------------------------

const emptyField = {
  label: "",
  type: "text" as VerificationField["type"],
  options: [] as string[],
  required: false,
  order: 0,
};

function VerificationFormTab() {
  const { data: fields } = useVerificationFields();
  const saveField = useSaveVerificationField();
  const deleteField = useDeleteVerificationField();
  const [draft, setDraft] = useState<typeof emptyField & { id?: string }>(emptyField);

  const needsOptions = ["select", "multi_select", "radio"].includes(draft.type);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Sellers answer these questions when they apply for verification. Removing a field hides it from new applications
        but keeps the answers already submitted.
      </p>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{draft.id ? "Edit field" : "Add a field"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-4"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await saveField.mutateAsync(draft);
                setDraft(emptyField);
                toast.success("Saved");
              } catch (err) {
                toast.error(apiError(err, "Could not save the field"));
              }
            }}
          >
            <Field label="Label" className="sm:col-span-2">
              <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} required />
            </Field>
            <Field label="Type">
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={draft.type}
                onChange={(e) => setDraft({ ...draft, type: e.target.value as VerificationField["type"] })}
              >
                <option value="text">Text</option>
                <option value="select">Select</option>
                <option value="multi_select">Multi-select</option>
                <option value="radio">Radio</option>
                <option value="file">File upload</option>
              </select>
            </Field>
            <Field label="Order">
              <Input type="number" value={draft.order} onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })} />
            </Field>

            {needsOptions && (
              <Field label="Options" hint="Comma separated." className="sm:col-span-4">
                <Input
                  value={draft.options.join(", ")}
                  onChange={(e) =>
                    setDraft({ ...draft, options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean) })
                  }
                  required
                />
              </Field>
            )}

            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch checked={draft.required} onCheckedChange={(v) => setDraft({ ...draft, required: v })} />
              <span className="text-sm">Required</span>
            </div>

            <div className="flex items-end gap-2 sm:col-span-2">
              <Button type="submit" disabled={saveField.isPending}>
                {draft.id ? "Save" : "Add field"}
              </Button>
              {draft.id && (
                <Button type="button" variant="outline" onClick={() => setDraft(emptyField)}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Form fields</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(fields ?? []).length === 0 && <p className="text-sm text-muted-foreground">No fields yet.</p>}
          {(fields ?? []).map((field) => (
            <div key={field.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
              <div>
                <span className={field.active ? "font-medium" : "text-muted-foreground line-through"}>{field.label}</span>
                <span className="ms-2 text-xs text-muted-foreground">{field.type}</span>
                {field.required && (
                  <Badge variant="outline" className="ms-2">
                    Required
                  </Badge>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setDraft({
                      id: field.id,
                      label: field.label,
                      type: field.type,
                      options: field.options ?? [],
                      required: field.required,
                      order: field.order,
                    })
                  }
                >
                  Edit
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteField.mutate(field.id)}>
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// --- Shared -------------------------------------------------------------------

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
