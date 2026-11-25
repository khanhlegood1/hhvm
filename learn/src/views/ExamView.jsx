import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListChecks,
  Play,
  RotateCcw,
  Target,
  Timer,
  Trophy,
  X,
} from "lucide-react";
import { BANK } from "../content/bank.js";
import { runHack } from "../lib/hack/interpreter.js";
import { navigate } from "../lib/useHashRoute.js";
import * as store from "../lib/store.js";
import Markdown from "../components/Markdown.jsx";

const LETTERS = ["A", "B", "C", "D", "E"];

const pad = (value) => String(value).padStart(2, "0");
const formatClock = (seconds) => `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
const formatDuration = (seconds) => `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;

// Papers are drawn from the bank: a quick paper is ten questions, a full one
// takes everything, and a chapter paper takes what that chapter has.
const buildPaper = (kind, chapter, trackChapters) => {
  let pool = BANK;
  if (chapter) pool = BANK.filter((question) => question.chapter === chapter);
  if (trackChapters) pool = BANK.filter((question) => trackChapters.has(question.chapter));
  const size = kind === "quick" ? Math.min(10, pool.length) : pool.length;
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, size);
  return {
    questions: shuffled,
    seconds: kind === "quick" ? 10 * 60 : Math.max(5 * 60, shuffled.length * 75),
    name: chapter ? chapter : kind,
  };
};

const HighlightedText = ({ text }) => {
  // `code` spans in the question text are rendered as code.
  const parts = String(text || "").split(/(`[^`]+`)/g);
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={index} style={{ padding: "1px 5px", border: "1px solid var(--line)", borderRadius: 5, background: "var(--surface-deep)" }}>
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={index}>{part.replace(/\*\*/g, "")}</span>
        ),
      )}
    </>
  );
};

function QuestionCard({ question, index, total, value, onChange, lang, t, reveal }) {
  const text = question.text[lang] || question.text.vi;
  const options = question.options;
  return (
    <div className="card" id={`q-${index}`}>
      <div className="q-head">
        <span className="q-num">{index + 1}</span>
        <span className="pill">{t(`questionTypes.${question.kind}`)}</span>
        <span className="pill">{t(question.level === 1 ? "easy" : question.level === 2 ? "medium" : "hard")}</span>
        <span className="spacer" />
        <span className="tiny faint">
          {index + 1}/{total}
        </span>
      </div>
      <div className="q-text">
        <HighlightedText text={text} />
      </div>
      {question.code && (
        <pre
          style={{
            margin: "0 0 10px",
            padding: "10px 12px",
            borderRadius: 8,
            background: "var(--code-bg)",
            color: "var(--code-ink)",
            fontSize: 11.5,
            lineHeight: 1.55,
            overflow: "auto",
            border: "1px solid #00000022",
          }}
        >
          <code>{question.code}</code>
        </pre>
      )}
      <div role="radiogroup" aria-label={t("question")}>
        {options.map((option, optionIndex) => {
          let className = "option";
          if (reveal) {
            if (optionIndex === question.answer) className += " right";
            else if (value === optionIndex) className += " wrong";
          } else if (value === optionIndex) className += " on";
          return (
            <button
              key={optionIndex}
              type="button"
              role="radio"
              aria-checked={value === optionIndex}
              className={className}
              onClick={() => !reveal && onChange(optionIndex)}
              disabled={reveal}
            >
              <span className="key">{LETTERS[optionIndex]}</span>
              <span>{option}</span>
              {reveal && optionIndex === question.answer && <Check size={14} style={{ marginLeft: "auto", color: "var(--ok)" }} />}
              {reveal && value === optionIndex && optionIndex !== question.answer && <X size={14} style={{ marginLeft: "auto", color: "var(--bad)" }} />}
            </button>
          );
        })}
      </div>
      {reveal && (
        <div className="explain">
          <div className="adm-title">{t("explanation")}</div>
          <HighlightedText text={question.explanation[lang] || question.explanation.vi} />
          <div style={{ marginTop: 6 }}>
            <button
              type="button"
              className="ghost tiny"
              onClick={() => {
                const [track, chapter, slug] = question.lesson.split("/");
                navigate("learn", [track, chapter, slug]);
              }}
            >
              {t("openLesson")} <ArrowRight size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExamView({ manual, route, t, lang }) {
  const [paper, setPaper] = useState(null);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [startedAt, setStartedAt] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [mode, setMode] = useState("quick");
  const [chapter, setChapter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");
  const timerRef = useRef(null);

  const chapters = useMemo(() => manual.tracks.flatMap((track) => track.chapters.map((entry) => ({ ...entry, track: track.id }))), [manual]);
  const chaptersWithQuestions = useMemo(() => {
    const counts = {};
    for (const question of BANK) counts[question.chapter] = (counts[question.chapter] || 0) + 1;
    return chapters.filter((entry) => counts[entry.slug]);
  }, [chapters]);

  const submit = () => {
    if (!paper || submitted) return;
    const score = paper.questions.reduce((sum, question, position) => sum + (answers[position] === question.answer ? 1 : 0), 0);
    const seconds = startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0;
    const passMark = Math.ceil(paper.questions.length * 0.7);
    store.recordExam({
      id: `${Date.now()}`,
      name: paper.name,
      chapter: chapter || null,
      score,
      total: paper.questions.length,
      percent: Math.round((score / Math.max(1, paper.questions.length)) * 100),
      passed: score >= passMark,
      at: Date.now(),
      seconds,
    });
    setSubmitted(true);
    setShowReview(false);
    setRemaining(null);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // A running clock, for papers built with a time limit.
  useEffect(() => {
    if (!paper || submitted || remaining === null) return undefined;
    const tick = () => setRemaining((value) => {
      if (value === null) return value;
      if (value <= 1) {
        clearInterval(timerRef.current);
        return 0;
      }
      return value - 1;
    });
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [paper, submitted]);

  useEffect(() => {
    if (remaining === 0 && paper && !submitted) submit();
  }, [remaining]);

  // `#/exam/chapter/<slug>` opens a paper for that chapter directly.
  useEffect(() => {
    const [kind, slug] = route.parts;
    if (kind === "chapter" && slug) {
      const entry = chapters.find((item) => item.slug === slug);
      setPaper(buildPaper(kind, slug));
      setChapter(slug);
      setStartedAt(Date.now());
      setRemaining(null);
      setAnswers({});
      setSubmitted(false);
      setShowReview(false);
      setIndex(0);
      if (!entry) setPaper(buildPaper(kind, slug));
    }
  }, [route.parts.join("/")]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = (kind) => {
    if (kind === "chapter" && !chapter) return;
    const paperData = buildPaper(kind, kind === "chapter" ? chapter : undefined);
    setPaper({ ...paperData, questions: paperData.questions });
    setMode(kind);
    setAnswers({});
    setIndex(0);
    setSubmitted(false);
    setShowReview(false);
    setStartedAt(Date.now());
    setRemaining(kind === "quick" ? paperData.seconds : null);
    window.scrollTo({ top: 0 });
  };

  const restart = () => {
    setPaper(null);
    setSubmitted(false);
    setAnswers({});
    setShowReview(false);
    setRemaining(null);
    setStartedAt(null);
    window.scrollTo({ top: 0 });
  };

  const score = paper
    ? paper.questions.reduce((sum, question, position) => sum + (answers[position] === question.answer ? 1 : 0), 0)
    : 0;
  const answeredCount = Object.keys(answers).length;
  const wrongByChapter = useMemo(() => {
    if (!paper || !submitted) return [];
    const groups = {};
    paper.questions.forEach((question, position) => {
      if (answers[position] === question.answer) return;
      groups[question.chapter] = groups[question.chapter] || { total: 0, wrong: 0 };
      groups[question.chapter].total += 1;
      groups[question.chapter].wrong += 1;
    });
    return Object.entries(groups).sort((a, b) => b[1].wrong - a[1].wrong).slice(0, 5);
  }, [paper, submitted, answers]);

  // -------------------------------------------------------------- exam list
  if (!paper) {
    const history = store.getExams();
    return (
      <div className="view">
        <div className="exam-wrap">
          <div className="page-head">
            <div>
              <h1 className="page-title">{t("examTitle")}</h1>
              <p className="page-sub">{t("examSub")}</p>
            </div>
          </div>

          <div className="grid-3">
            <div className="card">
              <div className="row" style={{ marginBottom: 6 }}>
                <Target size={14} />
                <span className="strong">{t("quickExam")}</span>
                <span className="spacer" />
                <span className="pill">{Math.min(10, BANK.length)} {t("questions")}</span>
              </div>
              <p className="small muted" style={{ margin: "0 0 10px" }}>
                {lang === "vi"
                  ? "Đề rút gọn ngẫu nhiên, 10 phút, mỗi câu 6 điểm quy đổi — hợp để ôn nhanh."
                  : "A random short paper, 10 minutes — good for a quick check."}
              </p>
              <button type="button" className="primary" onClick={() => start("quick")} disabled={!BANK.length}>
                <Play size={13} /> {t("start")}
              </button>
            </div>

            <div className="card">
              <div className="row" style={{ marginBottom: 6 }}>
                <ListChecks size={14} />
                <span className="strong">{t("fullExam")}</span>
                <span className="spacer" />
                <span className="pill">{BANK.length} {t("questions")}</span>
              </div>
              <p className="small muted" style={{ margin: "0 0 10px" }}>
                {lang === "vi"
                  ? "Toàn bộ ngân hàng câu hỏi, không giới hạn thời gian. Đạt khi từ 70% trở lên."
                  : "The whole question bank, no time limit. Pass mark is 70% and above."}
              </p>
              <button type="button" onClick={() => start("full")} disabled={!BANK.length}>
                <Play size={13} /> {t("start")}
              </button>
            </div>

            <div className="card">
              <div className="row" style={{ marginBottom: 6 }}>
                <Clock3 size={14} />
                <span className="strong">{t("chapterExam")}</span>
              </div>
              <div className="field" style={{ marginBottom: 8 }}>
                <select value={chapter} onChange={(event) => setChapter(event.target.value)}>
                  <option value="">{t("allChapters")}</option>
                  {chaptersWithQuestions.map((entry) => (
                    <option key={entry.slug} value={entry.slug}>
                      {entry.label} ({BANK.filter((question) => question.chapter === entry.slug).length})
                    </option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={() => start("chapter")} disabled={!chapter}>
                <Play size={13} /> {t("start")}
              </button>
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="row" style={{ marginBottom: 8 }}>
              <Trophy size={14} />
              <span className="strong">{t("examHistory")}</span>
              <span className="spacer" />
              {history.length > 0 && (
                <button
                  type="button"
                  className="ghost tiny danger"
                  onClick={() => {
                    if (window.confirm(t("confirmReset"))) store.reset();
                  }}
                >
                  {t("resetProgress")}
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <p className="small faint" style={{ margin: 0 }}>{t("noHistory")}</p>
            ) : (
              <table className="md" style={{ borderCollapse: "collapse", width: "100%", fontSize: 11 }}>
                <thead>
                  <tr>
                    <th>{lang === "vi" ? "Đề" : "Paper"}</th>
                    <th>{t("score")}</th>
                    <th>{t("timeUsed")}</th>
                    <th>{lang === "vi" ? "Kết quả" : "Result"}</th>
                    <th>{lang === "vi" ? "Lúc" : "When"}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 10).map((entry) => (
                    <tr key={entry.id}>
                      <td>{manual.tracks.flatMap((track) => track.chapters).find((item) => item.slug === entry.chapter)?.label || entry.name}</td>
                      <td className="strong">
                        {entry.score}/{entry.total} ({entry.percent}%)
                      </td>
                      <td>{formatDuration(entry.seconds)}</td>
                      <td>
                        <span className={`pill ${entry.passed ? "green" : "bad"}`}>{entry.passed ? t("passed") : t("failed")}</span>
                      </td>
                      <td className="faint">{new Date(entry.at).toLocaleString(lang === "vi" ? "vi-VN" : "en-GB")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="footer-note">
            <span>{t("thanks")}</span>
            <span className="spacer" />
            <a className="link" href="https://docs.hhvm.com" target="_blank" rel="noreferrer">docs.hhvm.com</a>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------- a paper
  const total = paper.questions.length;
  const passMark = Math.ceil(total * 0.7);
  const current = paper.questions[index];

  if (submitted) {
    const passed = score >= passMark;
    return (
      <div className="view">
        <div className="exam-wrap">
          <div className="card">
            <div className="row" style={{ alignItems: "flex-end", gap: 16 }}>
              <div>
                <div className="tiny faint" style={{ letterSpacing: "0.14em", textTransform: "uppercase" }}>{t("score")}</div>
                <div className="score-big">
                  {score}/{total}
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div className="meter">
                  <span style={{ width: `${(score / Math.max(1, total)) * 100}%` }} />
                </div>
                <div className="row small" style={{ marginTop: 6 }}>
                  <span className={`pill ${passed ? "green" : "bad"}`}>{passed ? t("passed") : t("failed")}</span>
                  <span className="faint">
                    {t("passMark")}: {passMark}/{total}
                  </span>
                  <span className="spacer" />
                  {startedAt && <span className="faint">{t("timeUsed")}: {formatDuration(Math.round((Date.now() - startedAt) / 1000))}</span>}
                </div>
              </div>
            </div>

            {wrongByChapter.length > 0 && (
              <>
                <div className="divider" />
                <div className="pane-title" style={{ margin: "0 0 6px" }}>
                  <AlertTriangle size={11} /> {lang === "vi" ? "Chương cần ôn lại" : "Chapters to revisit"}
                </div>
                <div className="row">
                  {wrongByChapter.map(([slug, stats]) => {
                    const entry = chapters.find((item) => item.slug === slug);
                    return (
                      <button
                        key={slug}
                        type="button"
                        className="chip"
                        onClick={() => navigate("learn", [entry?.track || "hack", slug, entry?.lessons?.[0]?.slug || ""])}
                      >
                        {entry?.label || slug} · {stats.wrong}/{stats.total} {lang === "vi" ? "sai" : "wrong"}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            <div className="divider" />
            <div className="row">
              <button type="button" className="primary" onClick={() => setShowReview(true)}>
                <ListChecks size={13} /> {t("review")}
              </button>
              <button type="button" onClick={restart}>
                <RotateCcw size={13} /> {t("backToExam")}
              </button>
              <span className="spacer" />
              <span className="tiny faint">{paper.questions.length} {t("question").toLowerCase()}</span>
            </div>
          </div>

          {showReview && (
            <div style={{ marginTop: 12 }}>
              <div className="page-head" style={{ marginBottom: 8 }}>
                <h2 className="page-title" style={{ fontSize: 16 }}>{t("reviewTitle")}</h2>
              </div>
              {paper.questions.map((question, position) => (
                <div key={question.id} style={{ marginBottom: 4 }}>
                  <QuestionCard
                    question={question}
                    index={position}
                    total={total}
                    value={answers[position]}
                    onChange={() => {}}
                    lang={lang}
                    t={t}
                    reveal
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="view">
      <div className="exam-wrap">
        <div className="card" style={{ position: "sticky", top: 0, zIndex: 10, padding: "10px 12px" }}>
          <div className="row">
            <button type="button" className="ghost icon-only" onClick={() => window.confirm(t("submitConfirm")) && restart()}>
              <ArrowLeft size={14} />
            </button>
            <span className="strong">
              {paper.name === "quick" ? t("quickExam") : paper.name === "full" ? t("fullExam") : chapters.find((entry) => entry.slug === paper.name)?.label || t("chapterExam")}
            </span>
            <span className="pill">
              {t("question")} {index + 1}/{total}
            </span>
            <span className="spacer" />
            {remaining !== null && (
              <span className={`timer ${remaining < 60 ? "low" : ""}`}>
                <Timer size={12} /> {formatClock(remaining)}
              </span>
            )}
            <button type="button" className="primary" onClick={() => window.confirm(t("submitConfirm")) && submit()}>
              <Check size={13} /> {t("submit")}
            </button>
          </div>
          <div className="toc" style={{ marginTop: 8 }}>
            {paper.questions.map((question, position) => (
              <button
                key={question.id}
                type="button"
                className={`${answers[position] !== undefined ? "answered" : ""} ${position === index ? "on" : ""}`}
                onClick={() => setIndex(position)}
                style={position === index ? { boxShadow: "0 2px 0 var(--ink)", borderColor: "var(--ink)" } : undefined}
              >
                {position + 1}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <QuestionCard
            key={current.id}
            question={current}
            index={index}
            total={total}
            value={answers[index]}
            onChange={(value) => setAnswers((current) => ({ ...current, [index]: value }))}
            lang={lang}
            t={t}
          />
        </div>

        <div className="exam-sticky" style={{ marginTop: 10 }}>
          <button type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>
            <ChevronLeft size={14} /> {t("prev")}
          </button>
          <span className="small faint" style={{ flex: 1, textAlign: "center" }}>
            {answeredCount}/{total} {lang === "vi" ? "đã trả lời" : "answered"}
          </span>
          {index >= total - 1 ? (
            <button type="button" className="primary" onClick={() => window.confirm(t("submitConfirm")) && submit()}>
              {t("submit")} <Check size={13} />
            </button>
          ) : (
            <button type="button" className="primary" onClick={() => setIndex((value) => Math.min(total - 1, value + 1))}>
              {t("next")} <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
