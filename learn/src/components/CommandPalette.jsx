import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { search } from "../lib/search.js";

const flatten = (entries) => entries;

export default function CommandPalette({ index, lang, t, onClose, onPick }) {
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => flatten(search(index, query, lang)).slice(0, 40), [index, query, lang]);

  useEffect(() => {
    setFocus(0);
  }, [query]);

  const pick = (entry) => {
    onPick(entry);
    onClose();
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setFocus((value) => Math.min(results.length - 1, value + 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setFocus((value) => Math.max(0, value - 1));
      return;
    }
    if (event.key === "Enter" && results[focus]) {
      event.preventDefault();
      pick(results[focus]);
    }
  };

  useEffect(() => {
    const node = listRef.current?.querySelector('[data-focus="1"]');
    node?.scrollIntoView({ block: "nearest" });
  }, [focus]);

  return (
    <div className="overlay" role="dialog" aria-modal="true" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="command" onKeyDown={onKeyDown}>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          spellCheck={false}
        />
        <div className="command-results" ref={listRef}>
          {results.length === 0 && <div className="empty-state small">{t("noResults")}</div>}
          {results.map((entry, i) => (
            <button
              type="button"
              key={`${entry.id}-${entry.heading || ""}-${i}`}
              className={`command-item ${i === focus ? "focus" : ""}`}
              data-focus={i === focus ? "1" : "0"}
              onMouseEnter={() => setFocus(i)}
              onClick={() => pick(entry)}
            >
              <Search size={13} strokeWidth={1.8} />
              <span>
                {entry.title}
                {entry.heading ? <span className="muted"> › {entry.heading}</span> : null}
              </span>
              <span className="muted" style={{ marginLeft: "auto" }}>
                {entry.chapterLabel || entry.track}
              </span>
            </button>
          ))}
        </div>
        <div className="command-foot">
          <kbd>↑</kbd>
          <kbd>↓</kbd>
          <span>{t("keysMove")}</span>
          <span className="spacer" />
          <kbd>Esc</kbd>
          <span>{t("keysClose")}</span>
        </div>
      </div>
    </div>
  );
}
