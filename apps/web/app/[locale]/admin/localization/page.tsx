"use client";

import { useState } from "react";
import {
  useCurrencies,
  useCreateCurrency,
  useLanguages,
  useCreateLanguage,
  useCountries,
  useCreateCountry,
} from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminLocalizationPage() {
  const { data: currencies } = useCurrencies();
  const createCurrency = useCreateCurrency();
  const { data: languages } = useLanguages();
  const createLanguage = useCreateLanguage();
  const { data: countries } = useCountries();
  const createCountry = useCreateCountry();

  const [currencyForm, setCurrencyForm] = useState({ code: "", symbol: "", rateToBase: 1 });
  const [languageForm, setLanguageForm] = useState({ code: "", name: "", rtl: false });
  const [countryForm, setCountryForm] = useState({ code: "", name: "", defaultCurrency: "" });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Currencies, languages & countries</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Currencies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createCurrency.mutate(currencyForm);
              setCurrencyForm({ code: "", symbol: "", rateToBase: 1 });
            }}
          >
            <Input
              placeholder="Code (USD)"
              className="w-24"
              value={currencyForm.code}
              onChange={(e) => setCurrencyForm({ ...currencyForm, code: e.target.value.toUpperCase() })}
              required
            />
            <Input
              placeholder="Symbol ($)"
              className="w-24"
              value={currencyForm.symbol}
              onChange={(e) => setCurrencyForm({ ...currencyForm, symbol: e.target.value })}
              required
            />
            <Input
              type="number"
              placeholder="Rate to INR"
              className="w-32"
              value={currencyForm.rateToBase}
              onChange={(e) => setCurrencyForm({ ...currencyForm, rateToBase: Number(e.target.value) })}
              required
            />
            <Button type="submit" disabled={createCurrency.isPending}>
              Add
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {currencies?.map((c) => (
              <Badge key={c.id} variant="outline">
                {c.code} ({c.symbol}) — 1 {c.code} = {c.rateToBase} INR
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Languages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createLanguage.mutate(languageForm);
              setLanguageForm({ code: "", name: "", rtl: false });
            }}
          >
            <Input
              placeholder="Code (fr)"
              className="w-24"
              value={languageForm.code}
              onChange={(e) => setLanguageForm({ ...languageForm, code: e.target.value })}
              required
            />
            <Input
              placeholder="Name (French)"
              value={languageForm.name}
              onChange={(e) => setLanguageForm({ ...languageForm, name: e.target.value })}
              required
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={languageForm.rtl}
                onChange={(e) => setLanguageForm({ ...languageForm, rtl: e.target.checked })}
              />
              RTL
            </label>
            <Button type="submit" disabled={createLanguage.isPending}>
              Add
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {languages?.map((l) => (
              <Badge key={l.id} variant="outline">
                {l.name} ({l.code}) {l.rtl && "· RTL"}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Countries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createCountry.mutate(countryForm);
              setCountryForm({ code: "", name: "", defaultCurrency: "" });
            }}
          >
            <Input
              placeholder="Code (US)"
              className="w-24"
              value={countryForm.code}
              onChange={(e) => setCountryForm({ ...countryForm, code: e.target.value.toUpperCase() })}
              required
            />
            <Input
              placeholder="Name (United States)"
              value={countryForm.name}
              onChange={(e) => setCountryForm({ ...countryForm, name: e.target.value })}
              required
            />
            <Input
              placeholder="Default currency"
              className="w-32"
              value={countryForm.defaultCurrency}
              onChange={(e) => setCountryForm({ ...countryForm, defaultCurrency: e.target.value.toUpperCase() })}
            />
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
    </div>
  );
}
