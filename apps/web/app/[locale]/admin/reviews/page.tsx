"use client";

import { useAdminReviews, useModerateReview } from "@/lib/hooks/useReviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminReviewsPage() {
  const { data: reviews, isLoading } = useAdminReviews();
  const moderate = useModerateReview();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Review moderation</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !reviews || reviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews yet.</p>
      ) : (
        reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">
                {typeof review.productId === "object" ? review.productId.name : "Product"} — {review.rating}★
              </CardTitle>
              <Badge variant={review.approved ? "secondary" : "outline"}>{review.approved ? "Visible" : "Hidden"}</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => moderate.mutate({ id: review.id, approved: !review.approved })}
              >
                {review.approved ? "Hide" : "Approve"}
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
