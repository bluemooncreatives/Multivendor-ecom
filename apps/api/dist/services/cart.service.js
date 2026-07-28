import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../middleware/errorHandler.js";
function ownerFilter({ userId, guestId }) {
    if (userId)
        return { userId };
    if (guestId)
        return { guestId };
    throw new ApiError(400, "Missing cart owner (user session or guest id)");
}
async function findVariant(productId, variantSku) {
    const product = await Product.findOne({ _id: productId, published: true });
    if (!product)
        throw new ApiError(404, "Product not found");
    const variant = product.variants.find((v) => v.sku === variantSku);
    if (!variant)
        throw new ApiError(404, "Variant not found");
    return { product, variant };
}
export async function getCart(owner) {
    const cart = await Cart.findOne(ownerFilter(owner));
    return cart ?? { items: [] };
}
// Stock is re-checked against `stock - reserved` (available, not gross) every time
// a quantity is set — on add, on quantity change, and again on guest-cart merge.
export async function setCartItem(owner, productId, variantSku, quantity) {
    const { variant } = await findVariant(productId, variantSku);
    const available = variant.stock - variant.reserved;
    if (quantity > available) {
        throw new ApiError(409, `Only ${available} unit(s) of this variant are available`);
    }
    const filter = ownerFilter(owner);
    const cart = (await Cart.findOne(filter)) ?? new Cart({ ...owner });
    const existingIndex = cart.items.findIndex((i) => i.productId.toString() === productId && i.variantSku === variantSku);
    if (quantity <= 0) {
        if (existingIndex >= 0)
            cart.items.splice(existingIndex, 1);
    }
    else if (existingIndex >= 0) {
        cart.items[existingIndex].quantity = quantity;
    }
    else {
        cart.items.push({ productId, variantSku, quantity });
    }
    await cart.save();
    return cart;
}
export async function removeCartItem(owner, productId, variantSku) {
    await Cart.updateOne(ownerFilter(owner), { $pull: { items: { productId, variantSku } } });
}
// Called immediately after login: merges the guest cart into the user's cart,
// re-validating combined quantities against current stock (the legacy app merged
// carts by simply overwriting quantities, so an already-in-cart item could exceed
// stock once the guest's items were appended).
export async function mergeGuestCartIntoUser(guestId, userId) {
    const guestCart = await Cart.findOne({ guestId });
    if (!guestCart || guestCart.items.length === 0)
        return;
    const userCart = (await Cart.findOne({ userId })) ?? new Cart({ userId, items: [] });
    for (const guestItem of guestCart.items) {
        const { variant } = await findVariant(guestItem.productId.toString(), guestItem.variantSku);
        const existing = userCart.items.find((i) => i.productId.toString() === guestItem.productId.toString() && i.variantSku === guestItem.variantSku);
        const combinedQty = (existing?.quantity ?? 0) + guestItem.quantity;
        const available = variant.stock - variant.reserved;
        const finalQty = Math.min(combinedQty, available);
        if (finalQty <= 0)
            continue;
        if (existing) {
            existing.quantity = finalQty;
        }
        else {
            userCart.items.push({ productId: guestItem.productId, variantSku: guestItem.variantSku, quantity: finalQty });
        }
    }
    await userCart.save();
    await Cart.deleteOne({ guestId });
}
//# sourceMappingURL=cart.service.js.map