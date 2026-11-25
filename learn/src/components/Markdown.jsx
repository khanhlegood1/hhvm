import { useEffect, useRef, useState } from "react";
import { renderMarkdown } from "../lib/markdown.js";
import { navigate } from "../lib/useHashRoute.js";

// Renders one block of manual markdown. Code blocks get a Copy button, and a
// Run button that sends the snippet to the playground. Links to other manual
// pages are handled by the hash router instead of reloading the page.
export default function Markdown({ markdown, resolve, onRun, compact = false }) {
  const host = useRef(null);
  const [copied, setCopied] = useState(false);

  const html = renderMarkdown(markdown, { resolve });

  useEffect(() => {
    const node = host.current;
    if (!node) return undefined;

    const onClick = (event) => {
      const copy = event.target.closest("[data-copy]");
      if (copy) {
        event.preventDefault();
        const block = copy.closest(".code-block");
        const code = decodeURIComponent(block?.dataset.code || "");
        navigator.clipboard?.writeText(code).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
        return;
      }
      const run = event.target.closest("[data-run]");
      if (run && onRun) {
        event.preventDefault();
        const block = run.closest(".code-block");
        onRun(decodeURIComponent(block?.dataset.code || ""));
        return;
      }
      const anchor = event.target.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      if (href.startsWith("#/")) {
        event.preventDefault();
        const parts = href.replace(/^#\//, "").split("/").filter(Boolean);
        navigate(parts[0], parts.slice(1));
      }
    };

    node.addEventListener("click", onClick);
    return () => node.removeEventListener("click", onClick);
  }, [onRun]);

  return (
    <div
      ref={host}
      className={`md ${compact ? "compact" : ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
      aria-live={copied ? "polite" : undefined}
    />
  );
}
