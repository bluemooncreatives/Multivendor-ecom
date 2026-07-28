import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { catalogRouter } from "./catalog.routes.js";
import { cartRouter } from "./cart.routes.js";
import { couponRouter } from "./coupon.routes.js";
import { orderRouter } from "./order.routes.js";
import { paymentRouter } from "./payment.routes.js";
import { localizationRouter } from "./localization.routes.js";
import { sellerRouter } from "./seller.routes.js";
import { adminRouter } from "./admin.routes.js";
import { addonRouter } from "./addon.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api", timestamp: new Date().toISOString() });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/catalog", catalogRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/coupons", couponRouter);
apiRouter.use("/orders", orderRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/localization", localizationRouter);
apiRouter.use("/seller", sellerRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/addons", addonRouter);
