import { useEffect, useRef } from "react";
import hljs from "highlight.js/lib/common";
import "highlight.js/styles/atom-one-dark.css";
import { sanitizeRichText } from "@/lib/rich-text";

type Props = { html: string; className?: string };

export function RichContent({ html, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const blocks = ref.current.querySelectorAll<HTMLElement>("pre code");
    blocks.forEach((block) => {
      if (block.dataset.highlighted === "yes") return;
      try {
        hljs.highlightElement(block);
      } catch {
        // ignore
      }
      const pre = block.parentElement;
      if (pre && !pre.querySelector("[data-copy-btn]")) {
        pre.classList.add("relative", "group");
        const btn = document.createElement("button");
        btn.setAttribute("data-copy-btn", "");
        btn.textContent = "کپی";
        btn.className =
          "absolute top-2 left-2 text-[10px] font-mono px-2 py-1 rounded bg-primary/20 text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/30";
        btn.onclick = () => {
          navigator.clipboard.writeText(block.innerText);
          const orig = btn.textContent;
          btn.textContent = "کپی شد!";
          setTimeout(() => { btn.textContent = orig; }, 1200);
        };
        pre.appendChild(btn);
      }
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className={`rich-content ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  );
}
