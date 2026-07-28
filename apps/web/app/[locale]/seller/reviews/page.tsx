"use client";

import { useState } from "react";
import { useSellerReviews, useReplyReview } from "@/lib/hooks/useReviews";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SellerReviewsPage() {
  const { data: reviews, isLoading } = useSellerReviews();
  const replyReview = useReplyReview();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Product reviews</h1>
      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !reviews || reviews.length === 0 ? (
        <p className="text-muted-foreground">No reviews on your products yet.</p>
      ) : (
        reviews.map((review) => (
          <Card key={review.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {typeof review.productId === "object" ? review.productId.name : "Product"} — {review.rating}★
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
              {review.sellerReply ? (
                <div className="rounded-md bg-muted p-2 text-sm">
                  <span className="font-medium">Your reply: </span>
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
        ))
      )}
    </div>
  );
}
