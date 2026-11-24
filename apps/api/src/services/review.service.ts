import { Review } from "../models/Address.js";
import { Product } from "../models/Product.js";
import { BusinessSetting } from "../models/Settings.js";
import { ApiError } from "../middleware/errorHandler.js";

/**
 * Product rating aggregates.
 *
 * The legacy app recomputed `products.rating` from the approved reviews in two
 * places - on submission (`ReviewController@store`) and on moderation
 * (`ReviewController@updatePublished`) - with the same four lines copied into
 * both. The rewrite only did it on submission, so approving or hiding a review
 * left the product's stars showing the old figure.
 *
 * Recomputing from the collection (rather than nudging a counter) is also what
 * makes the result correct after an import, a moderation sweep or a deletion.
 */
export async function recomputeProductRating(productId: unknown) {
  const [stats] = await Review.aggregate([
    { $match: { productId, approved: true } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Product.updateOne(
    { _id: productId },
    {
      // One decimal, the precision the storefront actually renders. Legacy stored
      // the raw float, which printed as 4.333333333333333 in exports.
      ratingAverage: stats ? Math.round(stats.average * 10) / 10 : 0,
      ratingCount: stats?.count ?? 0,
    },
  );
}

/** The review system can be switched off in Admin > Settings > Activation. */
export async function assertReviewsEnabled() {
  const settings = await BusinessSetting.findOne({ key: "business" }, { activation: 1 });
  if (settings?.activation?.reviewSystem === false) {
    throw new ApiError(403, "Reviews are turned off");
  }
}
