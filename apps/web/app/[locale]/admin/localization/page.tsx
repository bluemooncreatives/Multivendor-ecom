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
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { FormField } from "@/components/shared/form-field";
import { getApiErrorMessage } from "@/lib/utils";

export default function AdminLocalizationPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Localization" description="Configure currencies, languages, storefront translation overrides, and countries." />

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
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Add a currency</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await createCurrency.mutateAsync(form);
                setForm(emptyCurrency);
                toast.success("Currency added");
              } catch (err) {
                toast.error(getApiErrorMessage(err, "Could not add currency"));
              }
            }}
          >
            <FormField label="Code" required>
              <Input
                placeholder="USD"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                required
              />
            </FormField>
            <FormField label="Name">
              <Input placeholder="US Dollar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </FormField>
            <FormField label="Symbol" required>
              <Input placeholder="$" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} required />
            </FormField>
            <FormField label="Rate to INR" required>
              <Input
                type="number"
                step="0.0001"
                min={0}
                value={form.rateToBase}
                onChange={(e) => setForm({ ...form, rateToBase: Number(e.target.value) })}
                required
              />
            </FormField>
            <FormField label="Decimals">
              <Input
                type="number"
                min={0}
                max={4}
                value={form.decimals}
                onChange={(e) => setForm({ ...form, decimals: Number(e.target.value) })}
              />
            </FormField>
            <FormField label="Symbol position">
              <NativeSelect
                value={form.symbolPosition}
                onChange={(e) => setForm({ ...form, symbolPosition: e.target.value as "before" | "after" })}
              >
                <option value="before">Before ({form.symbol || "$"}100)</option>
                <option value="after">After (100{form.symbol || "$"})</option>
              </NativeSelect>
            </FormField>
            <Button type="submit" className="lg:col-span-6" disabled={createCurrency.isPending}>
              Add currency
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Currencies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          {currencies?.map((currency) => (
            <div key={currency.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3.5 text-sm">
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
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Add a language</CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await createLanguage.mutateAsync(form);
                setForm({ code: "", name: "", rtl: false });
                toast.success("Language added");
              } catch (err) {
                toast.error(getApiErrorMessage(err, "Could not add language"));
              }
            }}
          >
            <FormField label="Code" required>
              <Input placeholder="fr" className="w-24" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
            </FormField>
            <FormField label="Name" required>
              <Input placeholder="French" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </FormField>
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
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Languages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-4">
          {languages?.map((language) => (
            <div key={language.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5 text-sm">
              <span>
                <span className="font-semibold">{language.name}</span> <Badge variant="outline">{language.code}</Badge>
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

  const [edits, setEdits] = useState<Record<string, string>>({});
  useEffect(() => setEdits({}), [code, search]);

  useEffect(() => {
    if (!code && languages?.length) setCode(languages[0]!.code);
  }, [languages, code]);

  const dirtyCount = Object.keys(edits).length;

  return (
    <Card>
      <CardHeader className="border-b bg-muted/20 pb-3.5">
        <CardTitle className="text-base">Translation editor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <p className="text-sm text-muted-foreground">
          These override the strings shipped with the storefront. An empty value falls back to the built-in text.
        </p>

        <div className="flex flex-wrap items-end gap-3">
          <FormField label="Language">
            <NativeSelect value={code} onChange={(e) => setCode(e.target.value)}>
              {(languages ?? []).map((l) => (
                <option key={l.id} value={l.code}>
                  {l.name}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField label="Search">
            <Input placeholder="Key or value" value={search} onChange={(e) => setSearch(e.target.value)} />
          </FormField>
          <FormField label="Copy keys from">
            <NativeSelect value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
              <option value="">Select a language</option>
              {(languages ?? [])
                .filter((l) => l.code !== code)
                .map((l) => (
                  <option key={l.id} value={l.code}>
                    {l.name}
                  </option>
                ))}
            </NativeSelect>
          </FormField>
          <Button
            type="button"
            variant="outline"
            disabled={!copyFrom || copyTranslations.isPending}
            onClick={async () => {
              try {
                const result = await copyTranslations.mutateAsync({ fromCode: copyFrom, toCode: code });
                toast.success(`Seeded ${result.copied} key(s)`);
              } catch (err) {
                toast.error(getApiErrorMessage(err, "Could not copy translations"));
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
            <div className="max-h-[28rem] space-y-2 overflow-y-auto rounded-lg border p-3">
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
                  toast.error(getApiErrorMessage(err, "Could not save translations"));
                }
              }}
            >
              Save {dirtyCount > 0 ? `${dirtyCount} change${dirtyCount === 1 ? "" : "s"}` : "changes"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CountriesTab() {
  const { data: countries } = useCountries();
  const createCountry = useCreateCountry();
  const [form, setForm] = useState({ code: "", name: "", defaultCurrency: "" });

  return (
    <Card>
      <CardHeader className="border-b bg-muted/20 pb-3.5">
        <CardTitle className="text-base">Countries</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await createCountry.mutateAsync(form);
              setForm({ code: "", name: "", defaultCurrency: "" });
              toast.success("Country added");
            } catch (err) {
              toast.error(getApiErrorMessage(err, "Could not add country"));
            }
          }}
        >
          <FormField label="Code" required>
            <Input
              placeholder="US"
              className="w-24"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              required
            />
          </FormField>
          <FormField label="Name" required>
            <Input placeholder="United States" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </FormField>
          <FormField label="Default currency">
            <Input
              placeholder="USD"
              className="w-32"
              value={form.defaultCurrency}
              onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value.toUpperCase() })}
            />
          </FormField>
          <Button type="submit" disabled={createCountry.isPending}>
            Add
          </Button>
        </form>

        <div className="flex flex-wrap gap-2">
          {countries?.map((c) => (
            <Badge key={c.id} variant="outline" className="py-1">
              {c.name} ({c.code})
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
