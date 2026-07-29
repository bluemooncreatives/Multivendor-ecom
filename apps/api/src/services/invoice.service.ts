import PDFDocument from "pdfkit";
import type { Response } from "express";
import { Order } from "../models/Order.js";
import { GeneralSetting } from "../models/Settings.js";

type OrderDoc = InstanceType<typeof Order>;

/**
 * Which parties' figures the invoice shows. The legacy app shipped three separate
 * Blade templates; the difference between them is only what each party is
 * entitled to see, so it is expressed here as one flag rather than three files.
 *
 * - `customer` what was charged: items, discounts, tax, shipping, total.
 * - `seller`   only that seller's own lines, plus their commission and net payout.
 * - `admin`    everything, including commission across all sellers.
 */
export type InvoiceVariant = "customer" | "seller" | "admin";

export interface InvoiceOptions {
  variant: InvoiceVariant;
  /** Required for the seller variant — scopes the document to one vendor's lines. */
  sellerId?: string;
}

function money(value: number): string {
  return value.toFixed(2);
}

async function buildInvoice(order: OrderDoc, options: InvoiceOptions): Promise<PDFKit.PDFDocument> {
  const settings = await GeneralSetting.findOne({ key: "general" });
  const doc = new PDFDocument({ margin: 50 });

  const title =
    options.variant === "seller" ? "Seller invoice" : options.variant === "admin" ? "Invoice (admin copy)" : "Invoice";

  doc.fontSize(16).text(settings?.appName ?? "Marketplace", { align: "left" });
  doc.moveUp();
  doc.fontSize(20).text(title, { align: "right" });
  doc.fontSize(10).text(`Order: ${order.code}`, { align: "right" });
  doc.text(`Date: ${order.createdAt.toDateString()}`, { align: "right" });
  doc.text(`Payment: ${order.paymentMethod} (${order.paymentStatus})`, { align: "right" });
  doc.moveDown();

  const addr = order.addressSnapshot as Record<string, string>;
  doc.fontSize(12).text("Ship to:");
  doc.fontSize(10).text(`${addr.line1 ?? ""} ${addr.line2 ?? ""}`.trim());
  doc.text(`${addr.city ?? ""}, ${addr.state ?? ""} ${addr.postalCode ?? ""}`);
  doc.text(`${addr.country ?? ""} — ${addr.phone ?? ""}`);
  doc.moveDown();

  // The seller copy must never disclose another vendor's lines or revenue.
  const details =
    options.variant === "seller"
      ? order.details.filter((d) => String(d.sellerId) === options.sellerId)
      : order.details;

  let shownSubtotal = 0;
  let shownShipping = 0;
  let shownCommission = 0;

  for (const detail of details) {
    const label = detail.sellerId ? `Shipment ${String(detail.sellerId).slice(-6)}` : "In-House items";
    doc.fontSize(11).text(`${label} — ${detail.status}`, { underline: true });

    for (const item of detail.items) {
      doc
        .fontSize(10)
        .text(`${item.name}  x${item.quantity}  @ ${money(item.unitPrice)}  = ${money(item.unitPrice * item.quantity)}`);
    }
    if (detail.pickupPointId) doc.fontSize(9).text("Collected in person at a pickup point");
    if (detail.shippingCost > 0) doc.fontSize(9).text(`Shipping: ${money(detail.shippingCost)}`);

    shownSubtotal += detail.subtotal;
    shownShipping += detail.shippingCost;
    shownCommission += detail.commissionAmount;
    doc.moveDown(0.5);
  }

  doc.moveDown();

  if (options.variant === "seller") {
    // A seller is paid their subtotal less commission; order-level discounts and
    // tax are the platform's concern, not theirs.
    doc.fontSize(10).text(`Items subtotal: ${money(shownSubtotal)}`);
    doc.text(`Shipping collected: ${money(shownShipping)}`);
    doc.text(`Platform commission: -${money(shownCommission)}`);
    doc.fontSize(13).text(`Net payout: ${order.currency} ${money(shownSubtotal + shownShipping - shownCommission)}`, {
      underline: true,
    });
  } else {
    doc.fontSize(10).text(`Subtotal: ${money(shownSubtotal)}`);
    if (order.couponDiscount > 0) doc.text(`Coupon (${order.couponCode ?? ""}): -${money(order.couponDiscount)}`);
    if (order.clubPointsDiscount > 0) {
      doc.text(`Club points (${order.clubPointsSpent} pts): -${money(order.clubPointsDiscount)}`);
    }
    doc.text(`Tax: ${money(order.tax)}`);
    doc.text(`Shipping: ${money(order.shippingTotal)}`);
    if (options.variant === "admin") doc.text(`Platform commission: ${money(shownCommission)}`);
    doc.fontSize(13).text(`Grand total: ${order.currency} ${money(order.grandTotal)}`, { underline: true });
  }

  return doc;
}

/** Streams straight to the HTTP response — nothing is buffered or written to disk. */
export async function streamOrderInvoice(order: OrderDoc, res: Response, options: InvoiceOptions) {
  const doc = await buildInvoice(order, options);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${order.code}-${options.variant}.pdf"`);
  doc.pipe(res);
  doc.end();
}

/** Buffered variant, for attaching the invoice to the order-confirmation email. */
export async function renderInvoiceBuffer(order: OrderDoc, options: InvoiceOptions): Promise<Buffer> {
  const doc = await buildInvoice(order, options);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}
