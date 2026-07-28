"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Star } from "lucide-react";
import { useProductReviews, useCreateReview } from "@/lib/hooks/useReviews";
import { useMyOrders } from "@/lib/hooks/useOrders";
import { useAuthStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Stars({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star className={cn("h-4 w-4", n <= value ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const user = useAuthStore((s) => s.user);
  const { data: reviews, isLoading } = useProductReviews(productId);
  const { data: myOrders } = useMyOrders();
  const createReview = useCreateReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const eligibleOrder = myOrders?.find((order) =>
    order.details.some((d) => d.status === "delivered" && d.items.some((i: any) => String(i.productId) === productId)),
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!eligibleOrder) return;
    try {
      await createReview.mutateAsync({ productId, orderId: eligibleOrder.id, rating, comment });
      setComment("");
      toast.success("Review submitted");
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not submit review");
    }
  }

  return (
    <div className="space-y-6">
      {user && eligibleOrder && (
        <form className="space-y-3 rounded-md border p-4" onSubmit={handleSubmit}>
          <p className="text-sm font-medium">Write a review</p>
          <Stars value={rating} onChange={setRating} />
          <textarea
            className="w-full rounded-md border p-2 text-sm"
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

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading reviews…</p>
      ) : !reviews || reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const author = typeof review.userId === "object" ? review.userId.name : "Customer";
            return (
              <div key={review.id} className="border-b pb-4 last:border-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{author}</p>
                  <Stars value={review.rating} />
                </div>
                {review.comment && <p className="mt-1 text-sm text-muted-foreground">{review.comment}</p>}
                {review.sellerReply && (
                  <div className="mt-2 rounded-md bg-muted p-2 text-sm">
                    <span className="font-medium">Seller response: </span>
                    {review.sellerReply}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
