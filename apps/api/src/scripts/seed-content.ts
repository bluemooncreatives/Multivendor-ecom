import type { Policy } from "../models/Content.js";

type PolicyType = NonNullable<Parameters<typeof Policy.create>[0]> extends infer T
  ? T extends { type: infer U }
    ? U
    : never
  : never;

export const IMG = {
  earbuds: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&auto=format&fit=crop",
  headphones: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop",
  speaker: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&auto=format&fit=crop",
  smartwatch: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop",
  smartphone: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop",
  laptop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&auto=format&fit=crop",
  keyboard: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop",
  mouse: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop",
  camera: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop",
  tablet: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop",
  tshirt: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&auto=format&fit=crop",
  jacket: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop",
  kurta: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop",
  dress: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop",
  sneakers: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop",
  backpack: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop",
  sunglasses: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop",
  coffeeMaker: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop",
  lamp: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop",
  ceramicPot: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800&auto=format&fit=crop",
  bedding: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop",
  skincare: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop",
  serum: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop",
  grooming: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&auto=format&fit=crop",
  ebook: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop",
  designKit: "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop",
  yogaMat: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop",
  dumbbell: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop",
  woodenToy: "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=800&auto=format&fit=crop",
  coffeeBeans: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop",
  spices: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop",
  bicycle: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&auto=format&fit=crop",
  guitar: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=800&auto=format&fit=crop",
  deskChair: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?w=800&auto=format&fit=crop",
  bannerTech: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1400&auto=format&fit=crop",
  bannerFashion: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop",
  bannerHome: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1400&auto=format&fit=crop",
  bannerSale: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1400&auto=format&fit=crop",
  avatar1: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop",
  avatar2: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop",
  avatar3: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&auto=format&fit=crop",
  avatar4: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&auto=format&fit=crop",
};

export const COLORS_DATA = [
  { name: "Midnight Black", hex: "#111827", active: true },
  { name: "Pearl White", hex: "#F9FAFB", active: true },
  { name: "Crimson Red", hex: "#DC2626", active: true },
  { name: "Ocean Blue", hex: "#2563EB", active: true },
  { name: "Emerald Green", hex: "#059669", active: true },
  { name: "Sunset Amber", hex: "#D97706", active: true },
  { name: "Royal Purple", hex: "#7C3AED", active: true },
  { name: "Slate Grey", hex: "#64748B", active: true },
  { name: "Rose Pink", hex: "#EC4899", active: true },
  { name: "Navy Blue", hex: "#1E3A8A", active: true },
  { name: "Terracotta", hex: "#C2410C", active: true },
  { name: "Sand Beige", hex: "#D6D3D1", active: true },
];

export const CMS_PAGES = [
  {
    slug: "about-us",
    title: "About PHPStore Marketplace",
    body: `<h2>Built for Local Makers & Modern Shoppers</h2>
<p>PHPStore connects independent Indian sellers, artisan workshops, and curated D2C brands directly with customers across the country. Every vendor is verified before their storefront goes live.</p>
<h3>Why Shop With Us</h3>
<ul>
  <li><strong>Verified Independent Sellers:</strong> Strict KYC and quality verification on every vendor shop.</li>
  <li><strong>Buyer Protection:</strong> 14-day easy return &amp; wallet refund support on eligible orders.</li>
  <li><strong>Nationwide Pickup Hubs:</strong> Collect in person from local pickup points or get doorstep delivery.</li>
</ul>`,
    seoTitle: "About Us — PHPStore Marketplace",
    seoDescription: "Learn about our multivendor marketplace mission supporting local sellers and quality brands.",
    seoKeywords: ["about", "marketplace", "vocal for local", "vendors"],
    published: true,
  },
  {
    slug: "faq",
    title: "Frequently Asked Questions",
    body: `<h2>Customer &amp; Seller FAQs</h2>
<h3>How do I track my order?</h3>
<p>Visit the <a href="/en/track-order">Track Order</a> page and enter your order code to view live shipment status per seller.</p>
<h3>How do Club Points work?</h3>
<p>Every eligible product awards Club Points upon delivery. Once you reach the minimum threshold, convert your points directly into Wallet balance from your dashboard.</p>
<h3>How can I sell on PHPStore?</h3>
<p>Open the <a href="/en/become-seller">Become a Seller</a> page, set up your shop profile, choose a subscription package, and submit your verification documents.</p>`,
    seoTitle: "FAQ — PHPStore",
    seoDescription: "Answers to common questions about shipping, club points, refunds, and selling.",
    seoKeywords: ["faq", "help", "orders", "returns"],
    published: true,
  },
  {
    slug: "how-it-works",
    title: "How Our Marketplace Works",
    body: `<h2>One Cart, Multiple Independent Sellers</h2>
<p>Add items from In-House collections and independent vendors in a single checkout. Each seller ships directly (or to your chosen pickup hub), while your payment and refund guarantees are backed by the platform.</p>`,
    seoTitle: "How It Works — PHPStore",
    seoDescription: "Understand multi-vendor checkout, split shipments, and buyer protection.",
    seoKeywords: ["multivendor", "checkout", "how it works"],
    published: true,
  },
  {
    slug: "sell-with-us",
    title: "Sell With Us",
    body: `<h2>Grow Your Brand Online</h2>
<p>Launch a verified storefront in minutes, manage variants and inventory, sell at your counter with built-in POS, and track every rupee in an immutable settlement ledger.</p>`,
    seoTitle: "Sell With Us — PHPStore",
    seoDescription: "Start selling on PHPStore with low commissions and integrated POS.",
    seoKeywords: ["sell online", "vendor", "seller portal"],
    published: true,
  },
  {
    slug: "classifieds-guide",
    title: "Classifieds Posting Guide",
    body: `<h2>Buy &amp; Sell Locally With Confidence</h2>
<p>Customers with an active listing package can post pre-owned or new items in our Classifieds marketplace. All listings are reviewed by moderators before going live.</p>`,
    seoTitle: "Classifieds Guide — PHPStore",
    seoDescription: "How to post and manage local classified listings.",
    seoKeywords: ["classifieds", "used items", "local"],
    published: true,
  },
  {
    slug: "seasonal-lookbook-draft",
    title: "Festive Lookbook 2026 (Draft)",
    body: `<p>Upcoming seasonal showcase draft for marketing review.</p>`,
    seoTitle: "Festive Lookbook 2026",
    seoDescription: "Draft lookbook page.",
    seoKeywords: ["lookbook"],
    published: false,
  },
];

export const POLICIES_DATA: { type: PolicyType; body: string }[] = [
  {
    type: "privacy",
    body: `<h2>Privacy Policy</h2>
<p>We respect your privacy and protect your personal information. Order addresses, phone numbers, and payment details are processed solely to fulfill purchases, prevent fraud, and deliver customer support.</p>
<p>Payment credentials are never stored in plain text on our servers; gateway transactions are handled through PCI-compliant processors.</p>`,
  },
  {
    type: "terms",
    body: `<h2>Terms &amp; Conditions</h2>
<p>By accessing and placing an order on PHPStore, you agree to provide accurate delivery and contact information and abide by our marketplace policies. Sellers are responsible for accurate product descriptions, pricing, and timely dispatch.</p>`,
  },
  {
    type: "refund",
    body: `<h2>Refund Policy</h2>
<p>Eligible delivered items may be submitted for a refund within 14 days of delivery from your Customer Dashboard. Approved refunds are credited directly to your PHPStore Wallet after inspection.</p>
<p>Digital downloads and non-refundable personal care items are excluded once accessed or opened.</p>`,
  },
  {
    type: "return",
    body: `<h2>Return Policy</h2>
<p>Items must be returned unused, in original packaging, and with all tags intact. Damaged or defective items qualify for full pickup and replacement or wallet credit.</p>`,
  },
  {
    type: "shipping",
    body: `<h2>Shipping Policy</h2>
<p>Standard delivery takes 2–5 business days across metro cities and 4–7 business days nationwide. Orders above ₹1,999 qualify for free standard shipping. In-person collection is available at designated Pickup Points.</p>`,
  },
  {
    type: "support",
    body: `<h2>Support Policy</h2>
<p>Our support team responds to tickets Monday through Saturday, 9:00 AM to 8:00 PM IST. Open a ticket anytime from your Dashboard for order, payment, or account assistance.</p>`,
  },
  {
    type: "seller_agreement",
    body: `<h2>Seller Agreement</h2>
<p>Approved sellers agree to maintain authentic inventory, honor listed prices, fulfill confirmed shipments within 48 business hours, and comply with applicable GST and consumer protection regulations.</p>`,
  },
];

export const HEADER_FOOTER_LINKS = [
  { label: "All Products", url: "/en/products", placement: "header" as const, order: 1 },
  { label: "Classifieds", url: "/en/classifieds", placement: "header" as const, order: 2 },
  { label: "Brands", url: "/en/brands", placement: "header" as const, order: 3 },
  { label: "About Us", url: "/en/about-us", placement: "header" as const, order: 4 },
  { label: "About Us", url: "/en/about-us", placement: "footer" as const, order: 1 },
  { label: "FAQ", url: "/en/faq", placement: "footer" as const, order: 2 },
  { label: "Sell With Us", url: "/en/become-seller", placement: "footer" as const, order: 3 },
  { label: "Listing Packages", url: "/en/customer-packages", placement: "footer" as const, order: 4 },
  { label: "Track Order", url: "/en/track-order", placement: "footer" as const, order: 5 },
  { label: "Shipping Info", url: "/en/shipping-info", placement: "footer" as const, order: 6 },
];

export const SUBSCRIBERS_DATA = [
  "customer@example.com",
  "ananya.sharma@example.com",
  "rohan.mehta@example.com",
  "priya.nair@example.com",
  "vikram.patel@example.com",
  "sneha.iyer@example.com",
  "kabir.verma@example.com",
  "meera.joshi@example.com",
  "arjun.reddy@example.com",
  "divya.kapoor@example.com",
  "newsletter.fan1@example.com",
  "deals.hunter@example.com",
];

export const SEARCH_ANALYTICS = [
  { query: "wireless earbuds", resultCount: 4 },
  { query: "wireless earbuds", resultCount: 4 },
  { query: "cotton t-shirt", resultCount: 3 },
  { query: "smartwatch", resultCount: 2 },
  { query: "smartwatch", resultCount: 2 },
  { query: "organic coffee", resultCount: 2 },
  { query: "mechanical keyboard", resultCount: 2 },
  { query: "backpack", resultCount: 2 },
  { query: "handloom kurta", resultCount: 2 },
  { query: "yoga mat", resultCount: 2 },
  { query: "ui design kit", resultCount: 2 },
  { query: "vitamin c serum", resultCount: 2 },
  { query: "gaming console", resultCount: 0 },
  { query: "4k drone", resultCount: 0 },
  { query: "espresso grinder", resultCount: 0 },
];
