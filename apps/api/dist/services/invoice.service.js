import PDFDocument from "pdfkit";
// Streams directly to the HTTP response (no temp file on disk) — pdfkit is a
// writable stream, so `doc.pipe(res)` is sufficient; nothing is buffered in memory.
export function streamOrderInvoice(order, res) {
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="invoice-${order.code}.pdf"`);
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res);
    doc.fontSize(20).text("Invoice", { align: "right" });
    doc.fontSize(10).text(`Order: ${order.code}`, { align: "right" });
    doc.text(`Date: ${order.createdAt.toDateString()}`, { align: "right" });
    doc.moveDown();
    const addr = order.addressSnapshot;
    doc.fontSize(12).text("Ship to:");
    doc.fontSize(10).text(`${addr.line1 ?? ""} ${addr.line2 ?? ""}`);
    doc.text(`${addr.city ?? ""}, ${addr.state ?? ""} ${addr.postalCode ?? ""}`);
    doc.text(`${addr.country ?? ""} — ${addr.phone ?? ""}`);
    doc.moveDown();
    for (const detail of order.details) {
        doc.fontSize(11).text(`Seller items (status: ${detail.status})`, { underline: true });
        for (const item of detail.items) {
            doc.fontSize(10).text(`${item.name}  x${item.quantity}  @ ${item.unitPrice.toFixed(2)}  = ${(item.unitPrice * item.quantity).toFixed(2)}`);
        }
        doc.moveDown(0.5);
    }
    doc.moveDown();
    doc.fontSize(10).text(`Discount: ${order.discount.toFixed(2)}`);
    doc.text(`Tax: ${order.tax.toFixed(2)}`);
    doc.text(`Shipping: ${order.shippingTotal.toFixed(2)}`);
    doc.fontSize(13).text(`Grand Total: ${order.currency} ${order.grandTotal.toFixed(2)}`, { underline: true });
    doc.end();
}
//# sourceMappingURL=invoice.service.js.map