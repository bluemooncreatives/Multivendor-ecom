import sanitizeHtml from "sanitize-html";

/** Public CMS HTML, including imported pages, uses a fixed content allow-list. */
export function safeHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img"],
    allowedAttributes: { a: ["href", "title", "target", "rel"], img: ["src", "alt", "width", "height"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true) },
  });
}

export function safeLink(url: string) {
  if (url.startsWith("/") && !url.startsWith("//") && !url.includes("\\") && !/[\u0000-\u0020]/.test(url)) return true;
  try {
    const parsed = new URL(url);
    return ["https:", "http:", "mailto:", "tel:"].includes(parsed.protocol) && !parsed.username && !parsed.password;
  } catch { return false; }
}
