import { Router } from "express";
import { authRouter } from "./auth.routes.js";
import { catalogRouter } from "./catalog.routes.js";
import { cartRouter } from "./cart.routes.js";
import { couponRouter } from "./coupon.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api", timestamp: new Date().toISOString() });
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/catalog", catalogRouter);
apiRouter.use("/cart", cartRouter);
apiRouter.use("/coupons", couponRouter);

// Additional routers (orders/checkout, payments, seller, admin, add-ons)
// are mounted here as each is implemented.
