const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "blockquote", "pre", "code",
  "ul", "ol", "li", "h2", "h3", "a", "span", "mark",
];

const allowedTagSet = new Set(ALLOWED_TAGS);
const allowedAttrSet = new Set(["href", "target", "rel", "class"]);
const voidTags = new Set(["br"]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeHref(value: string) {
  const trimmed = value.trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  return "#";
}

export function sanitizeRichText(html: string) {
  const sanitizeAttributes = (rawAttrs: string) => {
    const attrs: string[] = [];
    rawAttrs.replace(/([a-zA-Z0-9:-]+)\s*=\s*("[^"]*"|'[^']*'|[^\s"'>]+)/g, (_match, rawName: string, rawValue: string) => {
      const name = rawName.toLowerCase();
      if (!allowedAttrSet.has(name) || name.startsWith("on") || name === "style") return "";
      const unquoted = String(rawValue).replace(/^['"]|['"]$/g, "");
      const value = name === "href" ? sanitizeHref(unquoted) : unquoted;
      if (name === "target") attrs.push('target="_blank"');
      else if (name === "rel") attrs.push('rel="noreferrer"');
      else attrs.push(`${name}="${escapeHtml(value)}"`);
      return "";
    });
    return attrs.length ? ` ${attrs.join(" ")}` : "";
  };

  if (typeof window === "undefined" || typeof DOMParser === "undefined") {
    return html.replace(/<\s*(\/?)\s*([a-zA-Z0-9]+)([^>]*)>/g, (_match, closing: string, rawTag: string, rawAttrs: string) => {
      const tag = rawTag.toLowerCase();
      if (!allowedTagSet.has(tag)) return "";
      if (closing) return voidTags.has(tag) ? "" : `</${tag}>`;
      if (voidTags.has(tag)) return `<${tag}>`;
      return `<${tag}${sanitizeAttributes(rawAttrs)}>`;
    });
  }

  const parser = new DOMParser();
  const document = parser.parseFromString(`<div>${html}</div>`, "text/html");

  const cleanNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent ?? "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";

    const element = node as Element;
    const tag = element.tagName.toLowerCase();
    const children = Array.from(element.childNodes).map(cleanNode).join("");
    if (tag === "body" || tag === "div") return children;
    if (!allowedTagSet.has(tag)) return children;

    const attrs = Array.from(element.attributes)
      .filter((attr) => allowedAttrSet.has(attr.name.toLowerCase()) && !attr.name.toLowerCase().startsWith("on"))
      .map((attr) => {
        const name = attr.name.toLowerCase();
        const value = name === "href" ? sanitizeHref(attr.value) : attr.value;
        if (name === "target") return `target="_blank"`;
        if (name === "rel") return `rel="noreferrer"`;
        return `${name}="${escapeHtml(value)}"`;
      })
      .join(" ");
    const safeAttrs = attrs ? ` ${attrs}` : "";
    if (tag === "br") return "<br>";
    return `<${tag}${safeAttrs}>${children}</${tag}>`;
  };

  return Array.from(document.body.childNodes).map(cleanNode).join("");
}

export function stripRichText(html: string) {
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const element = document.createElement("div");
  element.innerHTML = sanitizeRichText(html);
  return element.textContent?.replace(/\s+/g, " ").trim() ?? "";
}