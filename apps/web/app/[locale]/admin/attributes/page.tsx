"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  useAttributes,
  useCreateAttribute,
  useDeleteAttribute,
  useColors,
  useCreateColor,
  useDeleteColor,
} from "@/lib/hooks/useAdminCatalogExtras";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";

export default function AdminAttributesPage() {
  const { data: attributes } = useAttributes();
  const createAttribute = useCreateAttribute();
  const deleteAttribute = useDeleteAttribute();
  const { data: colors } = useColors();
  const createColor = useCreateColor();
  const deleteColor = useDeleteColor();

  const [attrName, setAttrName] = useState("");
  const [attrValues, setAttrValues] = useState("");
  const [colorName, setColorName] = useState("");
  const [colorHex, setColorHex] = useState("#000000");

  return (
    <div className="space-y-6">
      <PageHeader title="Attributes & colors" description="Configure variant attributes and swatch colors for product listings." />

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Product attributes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createAttribute.mutate({ name: attrName, values: attrValues.split(",").map((v) => v.trim()).filter(Boolean) });
              setAttrName("");
              setAttrValues("");
            }}
          >
            <Input
              placeholder="Name (e.g. Size)"
              className="flex-1 sm:max-w-xs"
              value={attrName}
              onChange={(e) => setAttrName(e.target.value)}
              required
            />
            <Input
              placeholder="Values (comma separated)"
              className="flex-1"
              value={attrValues}
              onChange={(e) => setAttrValues(e.target.value)}
              required
            />
            <Button type="submit" disabled={createAttribute.isPending}>
              Add
            </Button>
          </form>
          <div className="space-y-2">
            {attributes?.map((attr) => (
              <div key={attr.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <div>
                  <span className="font-semibold">{attr.name}</span>:{" "}
                  <span className="text-muted-foreground">{attr.values.join(", ")}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteAttribute.mutate(attr.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b bg-muted/20 pb-3.5">
          <CardTitle className="text-base">Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-5">
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createColor.mutate({ name: colorName, hex: colorHex });
              setColorName("");
            }}
          >
            <Input
              placeholder="Name (e.g. Red)"
              className="max-w-xs flex-1"
              value={colorName}
              onChange={(e) => setColorName(e.target.value)}
              required
            />
            <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-10 w-14 cursor-pointer rounded-md border p-1" />
            <Button type="submit" disabled={createColor.isPending}>
              Add
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {colors?.map((color) => (
              <Badge key={color.id} variant="outline" className="gap-2 py-1">
                <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: color.hex }} />
                {color.name}
                <button
                  type="button"
                  aria-label={`Delete ${color.name}`}
                  onClick={() => deleteColor.mutate(color.id)}
                  className="ms-1 text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
