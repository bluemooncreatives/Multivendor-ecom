"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  useCurrencies,
  useCreateCurrency,
  useUpdateCurrency,
  useLanguages,
  useCreateLanguage,
  useUpdateLanguage,
  useCountries,
  useCreateCountry,
  type CurrencyInput,
} from "@/lib/hooks/useAdminCatalogExtras";
import { useTranslations, useSaveTranslations, useCopyTranslations } from "@/lib/hooks/useAdminSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function apiError(err: unknown, fallback: string) {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

export default function AdminLocalizationPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Localization</h1>

      <Tabs defaultValue="currencies">
        <TabsList>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="translations">Translations</TabsTrigger>
          <TabsTrigger value="countries">Countries</TabsTrigger>
        </TabsList>

        <TabsContent value="currencies">
          <CurrenciesTab />
        </TabsContent>
        <TabsContent value="languages">
          <LanguagesTab />
        </TabsContent>
        <TabsContent value="translations">
          <TranslationsTab />
        </TabsContent>
        <TabsContent value="countries">
          <CountriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

const emptyCurrency: CurrencyInput = {
  code: "",
  name: "",
  symbol: "",
  rateToBase: 1,
  decimals: 2,
  symbolPosition: "before",
};

function CurrenciesTab() {
  const { data: currencies } = useCurrencies();
  const createCurrency = useCreateCurrency();
  const updateCurrency = useUpdateCurrency();
  const [form, setForm] = useState<CurrencyInput>(emptyCurrency);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a currency</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await createCurrency.mutateAsync(form);
                setForm(emptyCurrency);
                toast.success("Currency added");
              } catch (err) {
                toast.error(apiError(err, "Could not add currency"));
              }
            }}
          >
            <div className="space-y-1">
              <Label>Code</Label>
              <Input
                placeholder="USD"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input placeholder="US Dollar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Symbol</Label>
              <Input placeholder="$" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Rate to INR</Label>
              <Input
                type="number"
                step="0.0001"
                min={0}
                value={form.rateToBase}
                onChange={(e) => setForm({ ...form, rateToBase: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Decimals</Label>
              <Input
                type="number"
                min={0}
                max={4}
                value={form.decimals}
                onChange={(e) => setForm({ ...form, decimals: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Symbol position</Label>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.symbolPosition}
                onChange={(e) => setForm({ ...form, symbolPosition: e.target.value as "before" | "after" })}
              >
                <option value="before">Before ({form.symbol || "$"}100)</option>
                <option value="after">After (100{form.symbol || "$"})</option>
              </select>
            </div>
            <Button type="submit" className="lg:col-span-6" disabled={createCurrency.isPending}>
              Add currency
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Currencies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {currencies?.map((currency) => (
            <div key={currency.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
              <span>
                <strong>{currency.code}</strong> {currency.name && `— ${currency.name}`} ·{" "}
                {currency.symbolPosition === "before" ? `${currency.symbol}100` : `100${currency.symbol}`} ·{" "}
                {currency.decimals} dp · 1 {currency.code} = {currency.rateToBase} INR
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Active</span>
                <Switch
                  checked={currency.active}
                  onCheckedChange={(v) => updateCurrency.mutate({ id: currency.id, active: v })}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function LanguagesTab() {
  const { data: languages } = useLanguages();
  const createLanguage = useCreateLanguage();
  const updateLanguage = useUpdateLanguage();
  const [form, setForm] = useState({ code: "", name: "", rtl: false });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a language</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await createLanguage.mutateAsync(form);
                setForm({ code: "", name: "", rtl: false });
                toast.success("Language added");
              } catch (err) {
                toast.error(apiError(err, "Could not add language"));
              }
            }}
          >
            <div className="space-y-1">
              <Label>Code</Label>
              <Input placeholder="fr" className="w-24" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input placeholder="French" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Switch checked={form.rtl} onCheckedChange={(v) => setForm({ ...form, rtl: v })} />
              <span className="text-sm">Right to left</span>
            </div>
            <Button type="submit" disabled={createLanguage.isPending}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Languages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {languages?.map((language) => (
            <div key={language.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3 text-sm">
              <span>
                {language.name} <Badge variant="outline">{language.code}</Badge>
              </span>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">RTL</span>
                  <Switch checked={language.rtl} onCheckedChange={(v) => updateLanguage.mutate({ id: language.id, rtl: v })} />
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <Switch
                    checked={language.active}
                    onCheckedChange={(v) => updateLanguage.mutate({ id: language.id, active: v })}
                  />
                </label>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function TranslationsTab() {
  const { data: languages } = useLanguages();
  const [code, setCode] = useState("");
  const [search, setSearch] = useState("");
  const [copyFrom, setCopyFrom] = useState("");

  const { data: rows } = useTranslations(code, search);
  const saveTranslations = useSaveTranslations();
  const copyTranslations = useCopyTranslations();

  // Edits are held locally and saved as one batch, so a translator can work
  // through a page of strings without a request per keystroke.
  const [edits, setEdits] = useState<Record<string, string>>({});
  useEffect(() => setEdits({}), [code, search]);

  useEffect(() => {
    if (!code && languages?.length) setCode(languages[0]!.code);
  }, [languages, code]);

  const dirtyCount = Object.keys(edits).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Translation editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            These override the strings shipped with the storefront. An empty value falls back to the built-in text.
          </p>

          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label>Language</Label>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              >
                {(languages ?? []).map((l) => (
                  <option key={l.id} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Search</Label>
              <Input placeholder="Key or value" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="space-y-1">
              <Label>Copy keys from</Label>
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={copyFrom}
                onChange={(e) => setCopyFrom(e.target.value)}
              >
                <option value="">Select a language</option>
                {(languages ?? [])
                  .filter((l) => l.code !== code)
                  .map((l) => (
                    <option key={l.id} value={l.code}>
                      {l.name}
                    </option>
                  ))}
              </select>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={!copyFrom || copyTranslations.isPending}
              onClick={async () => {
                try {
                  const result = await copyTranslations.mutateAsync({ fromCode: copyFrom, toCode: code });
                  toast.success(`Seeded ${result.copied} key(s)`);
                } catch (err) {
                  toast.error(apiError(err, "Could not copy translations"));
                }
              }}
            >
              Copy keys
            </Button>
          </div>

          {!rows || rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No keys yet. Copy the key list from another language to get started.
            </p>
          ) : (
            <>
              <div className="max-h-[28rem] space-y-2 overflow-y-auto">
                {rows.map((row) => (
                  <div key={row.id} className="grid gap-2 sm:grid-cols-[1fr_2fr]">
                    <code className="self-center break-all text-xs text-muted-foreground">{row.key}</code>
                    <Input
                      value={edits[row.key] ?? row.value}
                      onChange={(e) => setEdits({ ...edits, [row.key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>

              <Button
                type="button"
                disabled={dirtyCount === 0 || saveTranslations.isPending}
                onClick={async () => {
                  try {
                    await saveTranslations.mutateAsync({
                      languageCode: code,
                      entries: Object.entries(edits).map(([key, value]) => ({ key, value })),
                    });
                    setEdits({});
                    toast.success(`Saved ${dirtyCount} translation(s)`);
                  } catch (err) {
                    toast.error(apiError(err, "Could not save translations"));
                  }
                }}
              >
                Save {dirtyCount > 0 ? `${dirtyCount} change${dirtyCount === 1 ? "" : "s"}` : "changes"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CountriesTab() {
  const { data: countries } = useCountries();
  const createCountry = useCreateCountry();
  const [form, setForm] = useState({ code: "", name: "", defaultCurrency: "" });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Countries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await createCountry.mutateAsync(form);
              setForm({ code: "", name: "", defaultCurrency: "" });
              toast.success("Country added");
            } catch (err) {
              toast.error(apiError(err, "Could not add country"));
            }
          }}
        >
          <div className="space-y-1">
            <Label>Code</Label>
            <Input
              placeholder="US"
              className="w-24"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input placeholder="United States" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="space-y-1">
            <Label>Default currency</Label>
            <Input
              placeholder="USD"
              className="w-32"
              value={form.defaultCurrency}
              onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value.toUpperCase() })}
            />
          </div>
          <Button type="submit" disabled={createCountry.isPending}>
            Add
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {countries?.map((c) => (
            <Badge key={c.id} variant="outline">
              {c.name} ({c.code})
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
