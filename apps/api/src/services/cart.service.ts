import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { Shop } from "../models/Shop.js";
import { ApiError } from "../middleware/errorHandler.js";

export interface CartOwner {
  userId?: string;
  guestId?: string;
}

function ownerFilter({ userId, guestId }: CartOwner) {
  if (userId) return { userId };
  if (guestId) return { guestId };
  throw new ApiError(400, "Missing cart owner (user session or guest id)");
}

async function findVariant(productId: string, variantSku: string) {
  const product = await Product.findOne({ _id: productId, published: true });
  if (!product) throw new ApiError(404, "Product not found");
  const variant = product.variants.find((v) => v.sku === variantSku);
  if (!variant) throw new ApiError(404, "Variant not found");
  return { product, variant };
}

export async function getCart(owner: CartOwner) {
  const cart = await Cart.findOne(ownerFilter(owner));
  return cart ?? { items: [] };
}

// Denormalizes each cart line with a product/variant snapshot so the frontend
// doesn't need a separate round-trip per line item just to render the cart.
export async function getCartWithDetails(owner: CartOwner) {
  const cart = await Cart.findOne(ownerFilter(owner));
  if (!cart || cart.items.length === 0) return { id: cart?._id, items: [] };

  const productIds = [...new Set(cart.items.map((i) => i.productId.toString()))];
  const products = await Product.find({ _id: { $in: productIds } });
  const productMap = new Map(products.map((p) => [String(p._id), p]));

  const sellerIds = [...new Set(products.map((p) => p.sellerId).filter(Boolean).map(String))];
  const shops = await Shop.find({ sellerId: { $in: sellerIds } }, { sellerId: 1, name: 1 }).lean();
  const shopNameBySeller = new Map(shops.map((s) => [String(s.sellerId), s.name]));

  const items = cart.items.map((item) => {
    const product = productMap.get(item.productId.toString());
    const variant = product?.variants.find((v) => v.sku === item.variantSku);

    // Per-unit discount, so the cart shows the price the shopper will actually be
    // charged rather than the pre-discount variant price.
    const listPrice = variant?.price ?? 0;
    const discountPerUnit =
      (product?.discountType ?? "percent") === "percent"
        ? (listPrice * (product?.discount ?? 0)) / 100
        : (product?.discount ?? 0);
    const unitPrice = Math.max(0, Math.round((listPrice - discountPerUnit) * 100) / 100);

    return {
      productId: String(item.productId),
      productSlug: product?.slug,
      productName: product?.name,
      productImage: variant?.imageUrl ?? product?.images[0],
      currency: product?.currency ?? "INR",
      // "__admin__" marks In-House items, which group as one bucket at checkout.
      sellerId: product?.sellerId ? String(product.sellerId) : "__admin__",
      sellerName: product?.sellerId ? (shopNameBySeller.get(String(product.sellerId)) ?? "Seller") : "In House",
      variantSku: item.variantSku,
      variantAttributes: variant?.attributes ?? {},
      quantity: item.quantity,
      listPrice,
      unitPrice,
      lineTotal: Math.round(unitPrice * item.quantity * 100) / 100,
      available: variant ? variant.stock - variant.reserved : 0,
    };
  });

  return { id: cart._id, items, subtotal: items.reduce((sum, i) => sum + i.lineTotal, 0) };
}

// Stock is re-checked against `stock - reserved` (available, not gross) every time
// a quantity is set — on add, on quantity change, and again on guest-cart merge.
export async function setCartItem(owner: CartOwner, productId: string, variantSku: string, quantity: number) {
  const { variant } = await findVariant(productId, variantSku);
  const available = variant.stock - variant.reserved;
  if (quantity > available) {
    throw new ApiError(409, `Only ${available} unit(s) of this variant are available`);
  }

  const filter = ownerFilter(owner);
  const cart = (await Cart.findOne(filter)) ?? new Cart({ ...owner });

  const existingIndex = cart.items.findIndex((i) => i.productId.toString() === productId && i.variantSku === variantSku);
  if (quantity <= 0) {
    if (existingIndex >= 0) cart.items.splice(existingIndex, 1);
  } else if (existingIndex >= 0) {
    cart.items[existingIndex]!.quantity = quantity;
  } else {
    cart.items.push({ productId, variantSku, quantity } as never);
  }

  await cart.save();
  return cart;
}

export async function removeCartItem(owner: CartOwner, productId: string, variantSku: string) {
  await Cart.updateOne(ownerFilter(owner), { $pull: { items: { productId, variantSku } } });
}

// Called immediately after login: merges the guest cart into the user's cart,
// re-validating combined quantities against current stock (the legacy app merged
// carts by simply overwriting quantities, so an already-in-cart item could exceed
// stock once the guest's items were appended).
export async function mergeGuestCartIntoUser(guestId: string, userId: string) {
  const guestCart = await Cart.findOne({ guestId });
  if (!guestCart || guestCart.items.length === 0) return;

  const userCart = (await Cart.findOne({ userId })) ?? new Cart({ userId, items: [] });

  for (const guestItem of guestCart.items) {
    const { variant } = await findVariant(guestItem.productId.toString(), guestItem.variantSku);
    const existing = userCart.items.find(
      (i) => i.productId.toString() === guestItem.productId.toString() && i.variantSku === guestItem.variantSku,
    );
    const combinedQty = (existing?.quantity ?? 0) + guestItem.quantity;
    const available = variant.stock - variant.reserved;
    const finalQty = Math.min(combinedQty, available);

    if (finalQty <= 0) continue;
    if (existing) {
      existing.quantity = finalQty;
    } else {
      userCart.items.push({ productId: guestItem.productId, variantSku: guestItem.variantSku, quantity: finalQty } as never);
    }
  }

  await userCart.save();
  await Cart.deleteOne({ guestId });
}
