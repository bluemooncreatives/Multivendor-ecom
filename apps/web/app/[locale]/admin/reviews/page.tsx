"use client";

import { Star } from "lucide-react";
import { useAdminReviews, useModerateReview } from "@/lib/hooks/useReviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { RatingStars } from "@/components/shared/rating-stars";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/loading-state";

export default function AdminReviewsPage() {
  const { data: reviews, isLoading } = useAdminReviews();
  const moderate = useModerateReview();

  return (
    <div className="space-y-6">
      <PageHeader title="Review moderation" description="Approve or hide customer product reviews." />

      {isLoading ? (
        <CardGridSkeleton count={3} columns="grid-cols-1" />
      ) : !reviews || reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" description="Submitted customer reviews appear here." />
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 py-3.5">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="text-base">
                    {typeof review.productId === "object" ? review.productId.name : "Product"}
                  </CardTitle>
                  <RatingStars value={review.rating} size="sm" />
                </div>
                <StatusBadge status={review.approved ? "visible" : "hidden"} />
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
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
          ))}
        </div>
      )}
    </div>
  );
}
