import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Layers,
  Play,
  RotateCcw,
  Target,
} from "lucide-react";
import { navigate } from "../lib/useHashRoute.js";
import { renderMarkdown } from "../lib/markdown.js";
import * as store from "../lib/store.js";
import Markdown from "../components/Markdown.jsx";

const TRACK_TONES = { hack: "#c9dced", hhvm: "#f0c9a4" };

const StepDots = ({ steps, current, doneThrough, onPick }) => (
  <div className="dots" role="tablist" aria-label="steps">
    {steps.map((step, index) => (
      <button
        key={step.n}
        type="button"
        className={`dot ${index === current ? "on" : index < doneThrough ? "done" : ""}`}
        title={step.heading || `${index + 1}`}
        aria-label={`Step ${index + 1}`}
        onClick={() => onPick(index)}
      />
    ))}
  </div>
);

export default function LearnView({ manual, route, t, lang, menuOpen, setMenuOpen, onPracticeExam, onOpenPlayground }) {
  const [openChapters, setOpenChapters] = useState(() => new Set(manual.tracks[0].chapters.slice(0, 2).map((chapter) => chapter.id)));
  const sheetRef = useRef(null);

  const [trackId, chapterSlug, lessonSlug, stepParam] = route.parts;
  const track = manual.tracks.find((entry) => entry.id === trackId) || manual.tracks[0];
  const lessonList = useMemo(() => track.chapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({ ...lesson, chapterLabel: chapter.label }))), [track]);

  // Resume where the visitor stopped, unless the address names a lesson.
  const last = store.getLast();
  const lastLesson = last ? manual.lessons[last.p.split("/").slice(0, -1).join("/")] : null;
  const fallback = lastLesson || track.chapters.flatMap((chapter) => chapter.lessons)[0];
  const lesson =
    (lessonSlug && manual.lessons[`${track.id}/${chapterSlug}/${lessonSlug}`]) ||
    (!chapterSlug ? fallback : null) ||
    track.chapters.flatMap((chapter) => chapter.lessons)[0];

  const chapter = lesson ? manual.tracks.find((entry) => entry.id === lesson.track).chapters.find((entry) => entry.slug === lesson.chapter) : null;
  const stepIndex = Math.max(0, Math.min(lesson ? lesson.steps.length - 1 : 0, Number(stepParam || 1) - 1));
  const step = lesson ? lesson.steps[stepIndex] : null;

  const resolve = (id) => manual.lessons[id];

  const openLesson = (target, stepNumber = 1, replace = false) => {
    navigate("learn", [target.track, target.chapter, target.slug, String(stepNumber)], {}, replace);
    setOpenChapters((current) => new Set([...current, `${target.track}/${target.chapter}`]));
  };

  // The address is the source of truth, but the first visit has no address yet.
  useEffect(() => {
    if (!chapterSlug && lesson) {
      openLesson(lesson, lastLesson && lastLesson.id === lesson.id ? Number(last.p.split("/").pop()) || 1 : 1, true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!lesson) return;
    store.setLast(lesson.id, stepIndex + 1, lesson.steps.length);
    sheetRef.current?.scrollTo({ top: 0 });
    if (stepIndex >= lesson.steps.length - 1) store.markLessonDone(lesson.id);
  }, [lesson && lesson.id, stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  const goStep = (next) => {
    if (!lesson) return;
    if (next < 0) {
      const previous = lesson.neighbors.prev ? manual.lessons[lesson.neighbors.prev] : null;
      if (previous) openLesson(previous, previous.steps.length);
      return;
    }
    if (next >= lesson.steps.length) {
      const after = lesson.neighbors.next ? manual.lessons[lesson.neighbors.next] : null;
      store.markLessonDone(lesson.id);
      if (after) openLesson(after, 1);
      return;
    }
    openLesson(lesson, next + 1);
  };

  // Arrow keys walk the steps, like the reference course.
  useEffect(() => {
    const onKey = (event) => {
      const inField = ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName);
      if (inField) return;
      if (event.key === "ArrowRight") goStep(stepIndex + 1);
      if (event.key === "ArrowLeft") goStep(stepIndex - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lesson && lesson.id, stepIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!lesson) {
    return <div className="empty-state">{t("noResults")}</div>;
  }

  const doneIds = store.get().done;
  const trackDone = lessonList.filter((entry) => doneIds[entry.id]).length;
  const chapterDone = chapter ? chapter.lessons.filter((entry) => doneIds[entry.id]).length : 0;
  const relatedLessons = lesson.links.map((id) => manual.lessons[id]).filter(Boolean);

  const stepDone = (index) => index < stepIndex;
  const codeSnippet = lesson.code[0];

  return (
    <div className="learn">
      {menuOpen && <button type="button" className="pane-scrim" aria-label={t("close")} onClick={() => setMenuOpen(false)} />}
      <aside className={`pane left ${menuOpen ? "open" : ""}`}>
        <div className="pane-title">
          <Layers size={12} /> {t("courseTree")}
          <button type="button" className="ghost icon-only" style={{ marginLeft: "auto", display: "none" }} onClick={() => setMenuOpen(false)}>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="progress-line">
          <div className="row small">
            <span className="strong">{t("progress")}</span>
            <span className="spacer" />
            <span className="faint">
              {trackDone}/{lessonList.length} {t("lessons")}
            </span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${lessonList.length ? (trackDone / lessonList.length) * 100 : 0}%` }} />
          </div>
        </div>

        {manual.tracks.map((entry) => (
          <div key={entry.id}>
            <div className="pane-title" style={{ marginTop: 10 }}>
              <span className="chapter-dot" style={{ background: TRACK_TONES[entry.id], borderRadius: 999 }} />
              {entry.title[lang] || entry.title.vi}
            </div>
            {entry.chapters.map((item) => {
              const id = item.id;
              const open = openChapters.has(id);
              const doneCount = item.lessons.filter((lessonEntry) => doneIds[lessonEntry.id]).length;
              return (
                <div className="chapter" key={id}>
                  <button
                    type="button"
                    className="chapter-head"
                    onClick={() =>
                      setOpenChapters((current) => {
                        const next = new Set(current);
                        if (next.has(id)) next.delete(id);
                        else next.add(id);
                        return next;
                      })
                    }
                  >
                    {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <span className="chapter-count">
                      {doneCount ? `${doneCount}/` : ""}
                      {item.lessons.length}
                    </span>
                  </button>
                  {open && (
                    <ul className="lesson-list">
                      {item.lessons.map((entryLesson) => (
                        <li key={entryLesson.id}>
                          <button
                            type="button"
                            className={`lesson-item ${entryLesson.id === lesson.id ? "on" : ""}`}
                            onClick={() => {
                              openLesson(entryLesson, 1);
                              setMenuOpen(false);
                            }}
                          >
                            <span className={`tick ${doneIds[entryLesson.id] ? "done" : ""}`}>✓</span>
                            <span style={{ flex: 1 }}>{entryLesson.title}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </aside>

      <section className="sheet" ref={sheetRef}>
        <div className="sheet-head">
          <div className="crumbs">
            <BookOpen size={12} />
            <span>{track.title[lang] || track.title.vi}</span>
            <ChevronRight size={11} />
            <span>{chapter ? chapter.label : ""}</span>
            <span className="spacer" />
            <button type="button" className="ghost tiny" onClick={() => onPracticeExam(chapter ? chapter.slug : undefined)}>
              <Target size={12} /> {t("startFromLesson")}
            </button>
          </div>
          <h1 className="sheet-title">{lesson.title}</h1>
          <div className="sheet-meta">
            <span className="pill">
              <Clock3 size={11} /> {lesson.readingMinutes} {t("minutes")}
            </span>
            <span className="pill">
              {lesson.words.toLocaleString("en")} {t("words")}
            </span>
            <span className="pill">
              {lesson.steps.length} {t("steps")}
            </span>
            {doneIds[lesson.id] && (
              <span className="pill green">
                <Check size={11} /> {t("completed")}
              </span>
            )}
            {lesson.redirect && <span className="pill warn">{t("pointers")}</span>}
            {codeSnippet && (
              <button type="button" className="ghost tiny" onClick={() => onOpenPlayground(codeSnippet)}>
                <Play size={12} /> {t("runInPlayground")}
              </button>
            )}
          </div>
        </div>

        <div className="sheet-body">
          {lesson.redirect && <div className="guide-hint" style={{ marginBottom: 12 }}>{t("pointerNote")}</div>}

          {lesson.steps.map((entry, index) => {
            const isHere = index === stepIndex;
            const isRecap = index === lesson.steps.length - 1;
            return (
              <article
                key={entry.n}
                className={`step ${entry.kind === "note" ? "note" : ""} ${isHere ? "here" : index > stepIndex ? "dim" : ""}`}
                onClick={() => !isHere && goStep(index)}
                style={{ cursor: isHere ? "default" : "pointer" }}
              >
                <div className="step-label">
                  <b>{entry.n}</b>
                  {entry.heading || (index === 0 ? t("questionTypes.concept") : isRecap ? t("recap") : t("steps"))}
                  {stepDone(index) && (
                    <span className="pill green" style={{ marginLeft: "auto" }}>
                      <Check size={10} />
                    </span>
                  )}
                </div>
                <Markdown markdown={entry.md} resolve={resolve} lang={lang} onRun={onOpenPlayground} />
              </article>
            );
          })}

          <div className="step" style={{ borderStyle: "dashed", background: "transparent", boxShadow: "none" }}>
            <div className="step-label">
              <b>✓</b> {t("recap")}
            </div>
            <p className="md" style={{ marginTop: 0 }}>{lesson.summary}</p>
            {relatedLessons.length > 0 && (
              <>
                <div className="pane-title" style={{ margin: "10px 0 6px" }}>
                  <FileText size={11} /> {t("relatedTerms")}
                </div>
                <div className="related">
                  {relatedLessons.slice(0, 6).map((entryLesson) => (
                    <button key={entryLesson.id} type="button" className="linkish" onClick={() => openLesson(entryLesson, 1)}>
                      <ArrowRight size={11} /> {entryLesson.title}
                      <span className="faint" style={{ marginLeft: "auto" }}>
                        {entryLesson.chapter}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="footer-note">
            <span>
              {t("source")}: <code>{lesson.source}</code>
            </span>
            <span className="spacer" />
            <a className="link" href={`https://docs.hhvm.com/${lesson.id}`} target="_blank" rel="noreferrer">
              docs.hhvm.com
            </a>
          </div>
        </div>
      </section>

      <aside className="pane right">
        <div className="pane-title">
          {t("step")} {stepIndex + 1} {t("of")} {lesson.steps.length}
        </div>
        <div className="guide-head">
          <StepDots steps={lesson.steps} current={stepIndex} doneThrough={stepIndex} onPick={(index) => openLesson(lesson, index + 1)} />
        </div>

        <div className="guide-card">
          <div className="step-label">
            <b>{step.n}</b>
            {step.heading || t("steps")}
          </div>
          <div className="md" style={{ fontSize: 11.5 }}>
            <Markdown markdown={firstParagraph(step.md)} resolve={resolve} lang={lang} compact onRun={onOpenPlayground} />
          </div>
          {step.md.length > firstParagraph(step.md).length && (
            <div className="guide-hint">
              {lang === "vi"
                ? "Bước này còn nội dung trong trang: đọc tiếp ở cột giữa."
                : "This step continues in the page: read on in the middle column."}
            </div>
          )}
        </div>

        <div className="guide-nav">
          <button type="button" onClick={() => goStep(stepIndex - 1)} disabled={stepIndex === 0 && !lesson.neighbors.prev}>
            <ArrowLeft size={13} /> {t("prev")}
          </button>
          <button type="button" className="primary" onClick={() => goStep(stepIndex + 1)}>
            {stepIndex >= lesson.steps.length - 1 && !lesson.neighbors.next ? t("finish") : t("next")} <ArrowRight size={13} />
          </button>
        </div>
        <div className="guide-nav">
          <button type="button" className="ghost" onClick={() => openLesson(lesson, 1)}>
            <RotateCcw size={12} /> {t("restart")}
          </button>
        </div>

        <div className="divider" />
        <div className="pane-title">{t("progress")}</div>
        <div className="row small faint" style={{ justifyContent: "space-between", padding: "0 4px" }}>
          <span>{chapter ? chapter.label : ""}</span>
          <span>
            {chapterDone}/{chapter ? chapter.lessons.length : 0}
          </span>
        </div>
        <div className="progress-track" style={{ margin: "6px 4px 12px" }}>
          <div className="progress-fill" style={{ width: `${chapter && chapter.lessons.length ? (chapterDone / chapter.lessons.length) * 100 : 0}%` }} />
        </div>

        <div className="pane-title">{t("keyboard")}</div>
        <div className="small faint" style={{ padding: "0 4px", display: "grid", gap: 3 }}>
          <span><kbd>←</kbd> <kbd>→</kbd> {t("keysMove")}</span>
          <span><kbd>⌘K</kbd> {t("keysSearch")}</span>
          <span><kbd>Esc</kbd> {t("keysClose")}</span>
        </div>
      </aside>
    </div>
  );
}

// The first paragraph of a step, for the guide column.
const firstParagraph = (markdown) => {
  const blocks = String(markdown || "").split(/\n\s*\n/);
  for (const block of blocks) {
    const text = block.trim();
    if (!text) continue;
    if (/^(```|:::|\||>)/.test(text)) return text.length > 260 ? `${text.slice(0, 260)}…` : text;
    return text;
  }
  return "";
};
