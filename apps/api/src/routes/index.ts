import { Router } from "express";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api", timestamp: new Date().toISOString() });
});

// Additional routers (auth, catalog, cart, orders, payments, seller, admin, add-ons)
// are mounted here as each is implemented.
