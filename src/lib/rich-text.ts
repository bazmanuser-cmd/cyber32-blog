import DOMPurify from "dompurify";

const ALLOWED_TAGS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "blockquote", "pre", "code",
  "ul", "ol", "li", "h2", "h3", "a", "span", "mark",
];

const ALLOWED_ATTR = ["href", "target", "rel", "class"];

export function sanitizeRichText(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
  });
}

export function stripRichText(html: string) {
  if (typeof document === "undefined") return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const element = document.createElement("div");
  element.innerHTML = sanitizeRichText(html);
  return element.textContent?.replace(/\s+/g, " ").trim() ?? "";
}