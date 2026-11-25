import { Card, CardContent } from "@/components/ui/card";

export function StaticPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container max-w-3xl space-y-5 py-10">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <Card>
        <CardContent className="space-y-4 p-6 text-sm leading-relaxed text-muted-foreground">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
