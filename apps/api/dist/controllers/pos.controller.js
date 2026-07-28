import { z } from "zod";
import * as posService from "../services/pos.service.js";
export const posSaleSchema = z.object({
    items: z
        .array(z.object({
        productId: z.string(),
        variantSku: z.string(),
        quantity: z.number().int().min(1),
    }))
        .min(1),
});
export async function createPosSaleHandler(req, res) {
    const order = await posService.createPosSale(req.user.id, req.body.items);
    res.status(201).json(order);
}
//# sourceMappingURL=pos.controller.js.map