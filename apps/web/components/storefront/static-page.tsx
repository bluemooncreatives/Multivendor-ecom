export function StaticPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="container max-w-3xl space-y-4 py-10">
      <h1 className="text-2xl font-bold">{title}</h1>
      <div className="space-y-4 rounded-lg bg-card p-6 text-sm leading-relaxed text-muted-foreground shadow-sm">
        {children}
      </div>
    </div>
  );
}
