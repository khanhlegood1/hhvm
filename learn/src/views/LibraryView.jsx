import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BookOpen, Filter, Search, X } from "lucide-react";
import { search } from "../lib/search.js";
import { navigate } from "../lib/useHashRoute.js";
import * as store from "../lib/store.js";

const PAGE = 36;

export default function LibraryView({ manual, index, route, t, lang, chaptersById, trackByChapter }) {
  const [query, setQuery] = useState(route.params.q || "");
  const [chapter, setChapter] = useState(route.params.chapter || "");
  const [visible, setVisible] = useState(PAGE);
  const inputRef = useRef(null);
  const done = store.get().done;

  useEffect(() => {
    setQuery(route.params.q || "");
    setChapter(route.params.chapter || "");
    setVisible(PAGE);
  }, [route.params.q, route.params.chapter]);

  // Keep the address in step with the filters, so a view can be shared.
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = { q: query || undefined, chapter: chapter || undefined };
      const current = { q: route.params.q || undefined, chapter: route.params.chapter || undefined };
      if (next.q !== current.q || next.chapter !== current.chapter) {
        navigate("library", [], next, true);
      }
    }, 220);
    return () => clearTimeout(handle);
  }, [query, chapter]); // eslint-disable-line react-hooks/exhaustive-deps

  const chapters = useMemo(() => manual.tracks.flatMap((track) => track.chapters.map((entry) => ({ ...entry, track: track.id }))), [manual]);

  const results = useMemo(() => {
    let list = index;
    if (chapter) list = list.filter((entry) => entry.c === chapter);
    const found = search(list, query, lang);
    return found.length ? found : query ? [] : list;
  }, [index, query, chapter, lang]);

  const shown = results.slice(0, visible);

  return (
    <div className="view">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t("libraryTitle")}</h1>
          <p className="page-sub">{t("librarySub")}</p>
        </div>
        <span className="spacer" />
        <span className="pill">
          {manual.count.lessons} {t("lessons")}
        </span>
        <span className="pill">
          {manual.count.steps} {t("steps")}
        </span>
        <span className="pill">
          {(manual.count.words / 1000).toFixed(0)}k {t("words")}
        </span>
      </div>

      <div className="lib-top">
        <div className="lib-search">
          <Search size={14} className="muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setVisible(PAGE);
            }}
            placeholder={t("search")}
            aria-label={t("search")}
            spellCheck={false}
          />
          {query && (
            <button type="button" className="ghost icon-only" onClick={() => setQuery("")} aria-label={t("clear")}>
              <X size={13} />
            </button>
          )}
        </div>
        <label className="row small faint" style={{ gap: 6 }}>
          <Filter size={12} />
          <select
            value={chapter}
            onChange={(event) => {
              setChapter(event.target.value);
              setVisible(PAGE);
            }}
          >
            <option value="">{t("allChapters")}</option>
            {manual.tracks.map((track) => (
              <optgroup key={track.id} label={track.title[lang] || track.title.vi}>
                {track.chapters.map((entry) => (
                  <option key={entry.slug} value={entry.slug}>
                    {entry.label} ({entry.lessons.length})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <span className="pill">
          {results.length} {t("results")}
        </span>
      </div>

      {results.length === 0 ? (
        <div className="empty-state">
          <h3>{t("noResults")}</h3>
        </div>
      ) : (
        <>
          <div className="term-grid">
            {shown.map((entry) => {
              const [track, chapterSlug, slug] = entry.id.split("/");
              return (
                <button
                  key={entry.id}
                  type="button"
                  className="term-card"
                  onClick={() => navigate("learn", [track, chapterSlug, slug])}
                >
                  <div className="row" style={{ gap: 6 }}>
                    <h4>{entry.t}</h4>
                    {done[entry.id] && <span className="pill green" style={{ marginLeft: "auto", padding: "0 6px" }}>✓</span>}
                  </div>
                  <p>{entry.s}</p>
                  <div className="meta">
                    <span>{chaptersById[entry.c]?.label || entry.c}</span>
                    <span>·</span>
                    <span>{manual.lessons[entry.id]?.steps.length || 0} {t("steps")}</span>
                    <span className="spacer" style={{ flex: 1 }} />
                    <ArrowRight size={11} />
                  </div>
                </button>
              );
            })}
          </div>
          {visible < results.length && (
            <div className="row" style={{ justifyContent: "center", marginTop: 16 }}>
              <button type="button" onClick={() => setVisible((value) => value + PAGE)}>
                {t("nextPage")} ({results.length - visible})
              </button>
            </div>
          )}
        </>
      )}

      <div className="footer-note">
        <BookOpen size={12} />
        <span>{t("thanks")}</span>
        <span className="spacer" />
        <a className="link" href="https://docs.hhvm.com" target="_blank" rel="noreferrer">
          docs.hhvm.com
        </a>
      </div>
    </div>
  );
}
