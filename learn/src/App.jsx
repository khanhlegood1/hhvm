import { useCallback, useEffect, useState } from "react";
import { BookOpen, GraduationCap, Menu, Moon, Search, Sun, Target, TerminalSquare } from "lucide-react";
import manual from "./content/manual.json";
import { LANGS, t as translate } from "./content/strings.js";
import { prepareIndex } from "./lib/search.js";
import { navigate, useHashRoute, buildHash } from "./lib/useHashRoute.js";
import * as store from "./lib/store.js";
import CommandPalette from "./components/CommandPalette.jsx";
import LearnView from "./views/LearnView.jsx";
import ExamView from "./views/ExamView.jsx";
import PlaygroundView from "./views/PlaygroundView.jsx";
import LibraryView from "./views/LibraryView.jsx";

const REPO = "https://github.com/khanhlegold1/hhvm";

const chaptersById = {};
for (const track of manual.tracks) {
  for (const chapter of track.chapters) chaptersById[chapter.slug] = chapter;
}
const trackByChapter = {};
for (const track of manual.tracks) {
  for (const chapter of track.chapters) trackByChapter[chapter.slug] = track.id;
}

const INDEX = prepareIndex(manual.index, chaptersById, trackByChapter);

const TABS = [
  { id: "learn", icon: BookOpen },
  { id: "exam", icon: Target },
  { id: "playground", icon: TerminalSquare },
  { id: "library", icon: GraduationCap },
];

export default function App() {
  const route = useHashRoute();
  const [lang, setLangState] = useState(() => store.get().lang || "vi");
  const [theme, setThemeState] = useState(() => store.get().theme || "light");
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [, force] = useState(0);

  const t = useCallback((path) => translate(lang, path), [lang]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = lang;
  }, [theme, lang]);

  useEffect(() => store.subscribe(() => force((value) => value + 1)), []);

  // A drawer that survives navigation covers the page the reader just chose.
  useEffect(() => setMenuOpen(false), [route.raw]);

  // Ctrl/⌘+K, or `/`, opens the command palette from anywhere but a text field.
  useEffect(() => {
    const onKey = (event) => {
      const inField = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if ((event.key === "k" && (event.metaKey || event.ctrlKey)) || (event.key === "/" && !inField)) {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const setLang = (next) => {
    store.setLang(next);
    setLangState(next);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    store.setTheme(next);
    setThemeState(next);
  };

  const view = route.view;
  const setView = (next) => navigate(next);

  const lessonCounts = { done: store.doneCount(), total: manual.count.lessons };

  const openSearchResult = (entry) => {
    navigate("learn", [entry.tr, entry.c, entry.id.split("/").pop()]);
  };

  // The three views scroll independently of the shell.
  const mainClass = view === "learn" || view === "playground" ? "main no-scroll" : "main";

  return (
    <div className="app">
      <header className="topbar">
        <button type="button" className="ghost icon-only menu-button" onClick={() => setMenuOpen((value) => !value)} aria-label={t("menu")} style={{ display: "none" }}>
          <Menu size={16} />
        </button>
        <a className="brand" href={buildHash("learn")} onClick={(event) => { event.preventDefault(); setView("learn"); }}>
          <span className="brand-mark" aria-hidden="true">HH</span>
          <span>
            <div className="brand-name">{t("brand")}</div>
            <div className="brand-sub">{t("brandSub")}</div>
          </span>
        </a>

        <nav className="tabs" aria-label={t("brandSub")}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                className={view === tab.id ? "on" : ""}
                onClick={() => setView(tab.id)}
              >
                <Icon size={14} strokeWidth={1.9} />
                <span>{t(`tabs.${tab.id}`)}</span>
              </button>
            );
          })}
        </nav>

        <div className="topbar-right">
          <button type="button" className="search-button" onClick={() => setSearchOpen(true)}>
            <Search size={13} strokeWidth={2} />
            <span>{t("search")}</span>
            <kbd>⌘K</kbd>
          </button>
          <span className="pill" title={t("progressLessons")}>
            {lessonCounts.done}/{lessonCounts.total}
          </span>
          <button type="button" className="ghost icon-only" onClick={() => setLang(lang === "vi" ? "en" : "vi")} title={t("language")} aria-label={t("language")}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.02em" }}>{lang === "vi" ? "VI" : "EN"}</span>
          </button>
          <button type="button" className="ghost icon-only" onClick={toggleTheme} title={t("theme")} aria-label={t("theme")}>
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      <main className={mainClass}>
        {view === "learn" && (
          <LearnView
            manual={manual}
            route={route}
            t={t}
            lang={lang}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            onPracticeExam={(chapter) => navigate("exam", ["chapter", chapter])}
            onOpenPlayground={(code) => {
              if (code) sessionStorage.setItem("hhvm-pg-code", code);
              navigate("playground");
            }}
          />
        )}
        {view === "exam" && <ExamView manual={manual} route={route} t={t} lang={lang} />}
        {view === "playground" && <PlaygroundView manual={manual} route={route} t={t} lang={lang} chaptersById={chaptersById} />}
        {view === "library" && <LibraryView manual={manual} index={INDEX} route={route} t={t} lang={lang} chaptersById={chaptersById} trackByChapter={trackByChapter} />}
      </main>

      {searchOpen && (
        <CommandPalette
          index={INDEX}
          lang={lang}
          t={t}
          onClose={() => setSearchOpen(false)}
          onPick={openSearchResult}
        />
      )}
    </div>
  );
}
