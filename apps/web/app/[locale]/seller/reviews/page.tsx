"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { useSellerReviews, useReplyReview } from "@/lib/hooks/useReviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { RatingStars } from "@/components/shared/rating-stars";
import { EmptyState } from "@/components/shared/empty-state";
import { CardGridSkeleton } from "@/components/shared/loading-state";

export default function SellerReviewsPage() {
  const { data: reviews, isLoading } = useSellerReviews();
  const replyReview = useReplyReview();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <PageHeader title="Product reviews" description="Read customer feedback and post public replies." />

      {isLoading ? (
        <CardGridSkeleton count={3} columns="grid-cols-1" />
      ) : !reviews || reviews.length === 0 ? (
        <EmptyState icon={Star} title="No reviews yet" description="No reviews on your products yet." />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="flex-row items-center justify-between space-y-0 border-b bg-muted/20 py-3.5">
                <CardTitle className="text-base">
                  {typeof review.productId === "object" ? review.productId.name : "Product"}
                </CardTitle>
                <RatingStars value={review.rating} size="sm" />
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                {review.sellerReply ? (
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                    <span className="font-semibold">Your reply: </span>
                    {review.sellerReply}
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Reply to this review…"
                      value={drafts[review.id] ?? ""}
                      onChange={(e) => setDrafts({ ...drafts, [review.id]: e.target.value })}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const msg = drafts[review.id];
                        if (!msg) return;
                        replyReview.mutate({ id: review.id, sellerReply: msg });
                      }}
                    >
                      Reply
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
