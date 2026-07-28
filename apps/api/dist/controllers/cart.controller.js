import { z } from "zod";
import * as cartService from "../services/cart.service.js";
import { ApiError } from "../middleware/errorHandler.js";
export const setItemSchema = z.object({
    productId: z.string(),
    variantSku: z.string(),
    quantity: z.number().int().min(0),
});
export const mergeSchema = z.object({
    guestId: z.string(),
});
// Guests are identified by a client-generated UUID sent as a header — never a
// client-supplied user id — and this owner is the only one every handler acts on.
function ownerFromRequest(req) {
    if (req.user)
        return { userId: req.user.id };
    const guestId = req.header("x-guest-id");
    if (!guestId)
        throw new ApiError(400, "Missing X-Guest-Id header for anonymous cart");
    return { guestId };
}
export async function getCartHandler(req, res) {
    const cart = await cartService.getCartWithDetails(ownerFromRequest(req));
    res.json(cart);
}
export async function setCartItemHandler(req, res) {
    const { productId, variantSku, quantity } = req.body;
    const owner = ownerFromRequest(req);
    await cartService.setCartItem(owner, productId, variantSku, quantity);
    res.json(await cartService.getCartWithDetails(owner));
}
export async function removeCartItemHandler(req, res) {
    await cartService.removeCartItem(ownerFromRequest(req), String(req.params.productId), String(req.params.variantSku));
    res.status(204).send();
}
export async function mergeCartHandler(req, res) {
    if (!req.user)
        throw new ApiError(401, "Authentication required");
    await cartService.mergeGuestCartIntoUser(req.body.guestId, req.user.id);
    res.json(await cartService.getCartWithDetails({ userId: req.user.id }));
}
//# sourceMappingURL=cart.controller.js.map