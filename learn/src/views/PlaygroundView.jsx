import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  CircleCheck,
  CircleX,
  Lightbulb,
  Play,
  RotateCcw,
  Trash2,
  Wand2,
} from "lucide-react";
import { EXERCISES } from "../content/exercises.js";
import { runHack } from "../lib/hack/interpreter.js";
import { asProgram } from "../lib/codeHash.js";
import { highlight } from "../lib/markdown.js";
import { navigate } from "../lib/useHashRoute.js";
import * as store from "../lib/store.js";

const TEMPLATES = [
  {
    id: "hello",
    title: { vi: "Xin chào", en: "Hello" },
    code: `<?hh
<<__EntryPoint>>
function main(): void {
  echo "Hello, Hack!\\n";
}
`,
  },
  {
    id: "collections",
    title: { vi: "Vec, dict, keyset", en: "Vec, dict, keyset" },
    code: `<?hh
<<__EntryPoint>>
function main(): void {
  $nums = vec[3, 1, 2];
  Vec\\sort($nums);
  echo implode(",", $nums), "\\n";

  $ages = dict['ada' => 36, 'alan' => 41];
  foreach ($ages as $name => $age) {
    echo $name, " is ", $age, "\\n";
  }

  $tags = keyset['php', 'hack'];
  echo count($tags), " tags\\n";
}
`,
  },
  {
    id: "classes",
    title: { vi: "Lớp và interface", en: "Classes and interfaces" },
    code: `<?hh
interface Shape {
  public function area(): float;
}

class Circle implements Shape {
  public function __construct(private float $r) {}
  public function area(): float {
    return 3.14159 * $this->r * $this->r;
  }
}

<<__EntryPoint>>
function main(): void {
  $shapes = vec[new Circle(1.0), new Circle(2.0)];
  foreach ($shapes as $shape) {
    echo $shape->area(), "\\n";
  }
}
`,
  },
  {
    id: "enum",
    title: { vi: "Enum và switch", en: "Enum and switch" },
    code: `<?hh
enum Suit: string {
  Hearts = 'hearts';
  Spades = 'spades';
}

function color(Suit $suit): string {
  switch ($suit) {
    case Suit::Hearts:
      return "red";
    default:
      return "black";
  }
}

<<__EntryPoint>>
function main(): void {
  echo Suit::Hearts, " is ", color(Suit::Hearts), "\\n";
}
`,
  },
  {
    id: "closures",
    title: { vi: "Closure và pipeline", en: "Closures and pipes" },
    code: `<?hh
<<__EntryPoint>>
function main(): void {
  $words = vec["Hack", "is", "a", "language"];
  $lens = $words
    |> Vec\\map($$, $w ==> Str\\length($w))
    |> Vec\\filter($$, $n ==> $n > 1);
  echo implode(" ", $lens), "\\n";
}
`,
  },
  {
    id: "errors",
    title: { vi: "Exception", en: "Exceptions" },
    code: `<?hh
function parse_age(string $raw): int {
  if (!\\HH\\Lib\\C\\is_int_ish($raw)) {
    throw new Exception("not a number: " . $raw);
  }
  return (int)$raw;
}

<<__EntryPoint>>
function main(): void {
  try {
    echo parse_age("42"), "\\n";
    echo parse_age("x"), "\\n";
  } catch (Exception $e) {
    echo "caught: ", $e->getMessage(), "\\n";
  }
}
`,
  },
];

// The editor is a textarea with a highlighted mirror behind it, so the text is
// real text (selectable, spell-checkable, accessible) and still coloured.
function Editor({ value, onChange, onRun, t }) {
  const textareaRef = useRef(null);
  const mirrorRef = useRef(null);
  const gutterRef = useRef(null);
  const lines = useMemo(() => value.split("\n"), [value]);

  const sync = () => {
    if (textareaRef.current && mirrorRef.current) {
      mirrorRef.current.scrollTop = textareaRef.current.scrollTop;
      mirrorRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const onKeyDown = (event) => {
    if (event.key === "Tab") {
      event.preventDefault();
      const node = event.currentTarget;
      const { selectionStart: start, selectionEnd: end } = node;
      const next = `${value.slice(0, start)}  ${value.slice(end)}`;
      onChange(next);
      requestAnimationFrame(() => {
        node.selectionStart = node.selectionEnd = start + 2;
      });
      return;
    }
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onRun();
    }
  };

  return (
    <div className="editor-shell">
      <div className="editor-bar">
        <span>main.hack</span>
        <span className="spacer" />
        <span className="tiny">⌘/Ctrl + Enter</span>
      </div>
      <div className="editor">
        <div className="gutter" ref={gutterRef} aria-hidden="true">
          {lines.map((_, index) => `${index + 1}`).join("\n")}
        </div>
        <div style={{ position: "relative", display: "grid" }}>
          <pre
            ref={mirrorRef}
            aria-hidden="true"
            style={{ gridArea: "1 / 1", overflow: "hidden", zIndex: 0 }}
            dangerouslySetInnerHTML={{ __html: `${highlight(value)}\n` }}
          />
          <textarea
            ref={textareaRef}
            style={{ gridArea: "1 / 1", zIndex: 1, color: "transparent", caretColor: "#e2c07a", background: "transparent" }}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={onKeyDown}
            onScroll={sync}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            aria-label={t("editor")}
          />
        </div>
      </div>
    </div>
  );
}

export default function PlaygroundView({ manual, route, t, lang, chaptersById }) {
  const [exerciseId, setExerciseId] = useState(null);
  const exercise = EXERCISES.find((entry) => entry.id === exerciseId) || null;

  const template = TEMPLATES[0];
  const [code, setCode] = useState(() => {
    const injected = sessionStorage.getItem("hhvm-pg-code");
    if (injected) {
      sessionStorage.removeItem("hhvm-pg-code");
      // A fragment typed in a lesson becomes a program here, the same wrapper
      // the content generator ran when it decided to offer the Run button.
      return asProgram(injected);
    }
    return exercise ? store.getDraft(exercise.id) || exercise.starter : template.code;
  });
  const [result, setResult] = useState(null);
  const [checks, setChecks] = useState(null);
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const [id] = route.parts;
    setExerciseId(id || null);
  }, [route.parts.join("/")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!exercise) return;
    const draft = store.getDraft(exercise.id);
    setCode(draft || exercise.starter);
    setResult(null);
    setChecks(null);
    setShowSolution(false);
    setShowHint(false);
  }, [exercise && exercise.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const run = () => {
    const output = runHack(code);
    setResult(output);
    setChecks(null);
    return output;
  };

  const runTests = () => {
    const output = run(code);
    if (!exercise) return;
    const checksResult = exercise.checks.map((check) => {
      const passed = output.ok && (check.expect !== undefined ? output.output === check.expect : check.match ? new RegExp(check.match, "m").test(output.output) : false);
      return { ...check, passed };
    });
    setChecks({ list: checksResult, all: output.ok && checksResult.every((check) => check.passed) });
  };

  const change = (next) => {
    setCode(next);
    if (exercise) store.setDraft(exercise.id, next);
  };

  const pickExercise = (entry) => {
    if (!entry) {
      setExerciseId(null);
      navigate("playground");
      return;
    }
    setExerciseId(entry.id);
    navigate("playground", [entry.id]);
  };

  const consoleText = result
    ? result.ok
      ? result.output || t("noOutput")
      : `${result.output}${result.fatal}`
    : "";

  return (
    <div className="view" style={{ paddingTop: 14 }}>
      <div className="page-head" style={{ marginBottom: 10 }}>
        <div>
          <h1 className="page-title">{t("playgroundTitle")}</h1>
          <p className="page-sub">{t("playgroundSub")}</p>
        </div>
        <span className="spacer" />
        <span className="pill" title={t("playgroundNote")}>
          playground-1 · {lang === "vi" ? "không phải HHVM thật" : "not real HHVM"}
        </span>
      </div>

      <div className="playground">
        <div className="pg-left">
          <div className="card inset" style={{ padding: 10 }}>
            <div className="pane-title" style={{ margin: "0 0 6px" }}>
              {t("templates")}
            </div>
            <div className="ex-list">
              {TEMPLATES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="ex-item"
                  onClick={() => {
                    pickExercise(null);
                    setCode(entry.code);
                    setResult(null);
                    setChecks(null);
                  }}
                >
                  <Wand2 size={12} /> {entry.title[lang] || entry.title.vi}
                </button>
              ))}
            </div>
          </div>

          <div className="card inset" style={{ padding: 10 }}>
            <div className="pane-title" style={{ margin: "0 0 6px" }}>
              {t("exerciseList")} · {EXERCISES.length}
            </div>
            <div className="ex-list">
              {EXERCISES.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className={`ex-item ${entry.id === exerciseId ? "on" : ""}`}
                  onClick={() => pickExercise(entry)}
                >
                  <span className={`level-dot level-${entry.level}`} />
                  <span style={{ flex: 1 }}>{entry.title}</span>
                  <ChevronRight size={12} className="faint" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 10, minWidth: 0 }}>
          {exercise && (
            <div className="card" style={{ padding: "12px 14px" }}>
              <div className="row" style={{ marginBottom: 4 }}>
                <span className={`level-dot level-${exercise.level}`} />
                <span className="strong">{exercise.title}</span>
                <span className="pill">{chaptersById[exercise.chapter]?.label || exercise.chapter}</span>
                <span className="spacer" />
                <button type="button" className="ghost tiny" onClick={() => navigate("learn", exercise.lesson.split("/"))}>
                  <BookOpen size={11} /> {t("openLesson")}
                </button>
              </div>
              <p className="small" style={{ margin: "4px 0 0" }}>
                {exercise.instructions[lang] || exercise.instructions.vi}
              </p>
              <div className="row" style={{ marginTop: 8 }}>
                <button type="button" className="primary" onClick={runTests}>
                  <Check size={13} /> {t("runTests")}
                </button>
                <button type="button" className="ghost tiny" onClick={() => setShowHint((value) => !value)}>
                  <Lightbulb size={12} /> {showHint ? t("hideSolution") && t("hint") : t("showHint")}
                </button>
                <button type="button" className="ghost tiny" onClick={() => setShowSolution((value) => !value)}>
                  {showSolution ? t("hideSolution") : t("showSolution")}
                </button>
                <span className="spacer" />
                <button
                  type="button"
                  className="ghost tiny"
                  onClick={() => {
                    change(exercise.starter);
                    setResult(null);
                    setChecks(null);
                  }}
                >
                  <RotateCcw size={11} /> {t("reset")}
                </button>
              </div>
              {showHint && (
                <div className="guide-hint" style={{ marginTop: 8 }}>
                  {exercise.hint[lang] || exercise.hint.vi}
                </div>
              )}
              {showSolution && (
                <pre
                  style={{
                    margin: "8px 0 0",
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "var(--code-bg)",
                    color: "var(--code-ink)",
                    fontSize: 11.5,
                    overflow: "auto",
                    border: "1px solid #00000022",
                  }}
                >
                  <code>{exercise.solution}</code>
                </pre>
              )}
            </div>
          )}

          <Editor value={code} onChange={change} onRun={exercise ? runTests : run} t={t} />

          <div className="row">
            <button type="button" className="primary" onClick={run}>
              <Play size={13} /> {t("run")}
            </button>
            {exercise && (
              <button type="button" onClick={runTests}>
                <Check size={13} /> {t("runTests")}
              </button>
            )}
            <span className="spacer" />
            {result && (
              <span className={`pill ${result.ok ? "green" : "bad"}`}>
                {result.ok ? `${Math.round(result.ms)} ${t("ms")}` : `${t("stopped")} · ${result.error?.message?.split(":")[0]}`}
              </span>
            )}
            <button
              type="button"
              className="ghost tiny"
              onClick={() => {
                setCode("");
                setResult(null);
                setChecks(null);
                if (exercise) store.setDraft(exercise.id, "");
              }}
            >
              <Trash2 size={12} /> {t("clear")}
            </button>
          </div>

          <div className="console">
            <div className="console-bar">
              <Circle size={8} fill={result ? (result.ok ? "#7fb069" : "#c46a58") : "#9a9183"} strokeWidth={0} />
              {t("output")}
              <span className="spacer" />
              {result && result.ok && <span className="tiny">{result.steps.toLocaleString("en")} steps</span>}
            </div>
            <pre className={!result ? "empty" : result.ok ? "" : "error"}>
              {result ? consoleText : lang === "vi" ? "Bấm Chạy (⌘/Ctrl + Enter) để chạy chương trình." : "Press Run (⌘/Ctrl + Enter) to run the program."}
            </pre>
          </div>

          {checks && (
            <div className="card" style={{ padding: "12px 14px" }}>
              <div className="row" style={{ marginBottom: 8 }}>
                {checks.all ? <CircleCheck size={15} color="var(--ok)" /> : <CircleX size={15} color="var(--bad)" />}
                <span className="strong">{checks.all ? t("testsPassed") : t("testsFailed")}</span>
                <span className="spacer" />
                <span className="tiny faint">
                  {checks.list.filter((check) => check.passed).length}/{checks.list.length} {t("testsCount")}
                </span>
              </div>
              <div className="check-list">
                {checks.list.map((check, index) => (
                  <div key={index} className={`check ${check.passed ? "ok" : "no"}`}>
                    <div className="row">
                      {check.passed ? <Check size={12} color="var(--ok)" /> : <CircleX size={12} color="var(--bad)" />}
                      <span>{check.label || `${t("testsCount")} ${index + 1}`}</span>
                    </div>
                    {!check.passed && check.expect !== undefined && (
                      <pre>
                        {t("expected")}: {JSON.stringify(check.expect)}
                        {"\n"}
                        {t("actual")}: {JSON.stringify(result?.output ?? "")}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pg-right">
          <div className="card inset" style={{ padding: 12 }}>
            <div className="pane-title" style={{ margin: "0 0 6px" }}>
              <Lightbulb size={11} /> {t("notSupported")}
            </div>
            <p className="small muted" style={{ margin: 0 }}>
              {t("playgroundNote")}
            </p>
          </div>
          <div className="card inset" style={{ padding: 12 }}>
            <div className="pane-title" style={{ margin: "0 0 6px" }}>
              <BookOpen size={11} /> {t("relatedTerms")}
            </div>
            <div className="related">
              {["hack/getting-started/quick-start", "hack/arrays-and-collections/vec-keyset-and-dict", "hack/classes/introduction", "hack/expressions-and-operators/pipe"].map((id) => {
                const lesson = manual.lessons[id];
                if (!lesson) return null;
                return (
                  <button key={id} type="button" className="linkish" onClick={() => navigate("learn", id.split("/"))}>
                    <ArrowRight size={11} /> {lesson.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
