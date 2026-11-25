"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { MessageSquare } from "lucide-react";
import { useProductReviews, useCreateReview } from "@/lib/hooks/useReviews";
import { useMyOrders } from "@/lib/hooks/useOrders";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/shared/rating-stars";
import { EmptyState } from "@/components/shared/empty-state";
import { getApiErrorMessage } from "@/lib/utils";

export function ProductReviews({ productId }: { productId: string }) {
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useProductReviews(productId);
  const reviews = data?.pages.flatMap((page) => page.items) ?? [];
  const { data: myOrders } = useMyOrders();
  const createReview = useCreateReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const eligibleOrder = myOrders?.find((order) =>
    order.details.some(
      (d) =>
        d.status === "delivered" &&
        d.items.some((i) => Boolean(i.productId) && String(i.productId) === productId),
    ),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eligibleOrder) return;
    try {
      await createReview.mutateAsync({ productId, orderId: eligibleOrder.id, rating, comment });
      setComment("");
      toast.success("Review submitted");
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Could not submit review"));
    }
  }

  return (
    <div className="space-y-6">
      {user && eligibleOrder && (
        <form className="space-y-3 rounded-lg border bg-muted/20 p-4" onSubmit={handleSubmit}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Write a review</p>
              <RatingStars value={rating} onChange={setRating} size="md" />
            </div>
            <Textarea
              rows={3}
              placeholder="Share your experience with this product…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button type="submit" size="sm" disabled={createReview.isPending}>
              Submit review
            </Button>
          </form>
      )}

      {isError ? (
            <Alert variant="destructive">
              <AlertDescription>Could not load reviews.</AlertDescription>
            </Alert>
          ) : isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState icon={MessageSquare} title="No reviews yet" description="Verified buyers can leave a review after delivery." />
          ) : (
              <div className="divide-y">
                {reviews.map((review) => {
                  const author = review.userId && typeof review.userId === "object" ? review.userId.name : "Customer";
                  return (
                        <div key={review.id} className="space-y-2 py-4 first:pt-0 last:pb-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold">{author}</span>
                            <RatingStars value={review.rating} size="sm" />
                          </div>
                          {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
                          {review.sellerReply && (
                              <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                                <span className="font-semibold text-foreground">Seller response: </span>
                                <span className="text-muted-foreground">{review.sellerReply}</span>
                              </div>
                )}
                            </div>
                          );
          })}
                        </div>
      )}

                        {hasNextPage && (
                          <Button variant="outline" disabled={isFetchingNextPage} onClick={() => void fetchNextPage()}>
                            {isFetchingNextPage ? "Loading…" : "Load more reviews"}
                          </Button>
                        )}
                      </div>
                      );
}
