"use client";

import { useMyClubPoints, useClubPointsHistory } from "@/lib/hooks/useAddons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClubPointsPage() {
  const { data: points } = useMyClubPoints();
  const { data: history, isLoading } = useClubPointsHistory();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Club points</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Your balance</CardTitle>
        </CardHeader>
        <CardContent className="text-3xl font-bold">{points?.points ?? 0} pts</CardContent>
      </Card>

      <div>
        <h2 className="mb-2 text-lg font-semibold">History</h2>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : !history || history.length === 0 ? (
          <p className="text-muted-foreground">No point activity yet.</p>
        ) : (
          <div className="divide-y rounded-md border">
            {history.map((tx: any) => (
              <div key={tx.id} className="flex items-center justify-between p-3 text-sm">
                <span>{tx.reason}</span>
                <span className={tx.points >= 0 ? "font-semibold text-green-600" : "font-semibold text-destructive"}>
                  {tx.points >= 0 ? "+" : ""}
                  {tx.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
