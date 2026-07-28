"use client";

import { useState } from "react";
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
      <h1 className="text-2xl font-bold">Attributes & colors</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Product attributes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createAttribute.mutate({ name: attrName, values: attrValues.split(",").map((v) => v.trim()).filter(Boolean) });
              setAttrName("");
              setAttrValues("");
            }}
          >
            <Input placeholder="Name (e.g. Size)" value={attrName} onChange={(e) => setAttrName(e.target.value)} required />
            <Input
              placeholder="Values (comma separated)"
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
              <div key={attr.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                <div>
                  <span className="font-medium">{attr.name}</span>: {attr.values.join(", ")}
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteAttribute.mutate(attr.id)}>
                  Delete
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              createColor.mutate({ name: colorName, hex: colorHex });
              setColorName("");
            }}
          >
            <Input placeholder="Name (e.g. Red)" value={colorName} onChange={(e) => setColorName(e.target.value)} required />
            <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-10 w-14 rounded-md border" />
            <Button type="submit" disabled={createColor.isPending}>
              Add
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {colors?.map((color) => (
              <Badge key={color.id} variant="outline" className="gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: color.hex }} />
                {color.name}
                <button onClick={() => deleteColor.mutate(color.id)} className="ms-1 text-muted-foreground hover:text-destructive">
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
