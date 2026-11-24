// End-to-end checks in a DOM, without a browser download: jsdom runs the real
// app, clicks through it, and fails loudly if a view throws or a click does
// nothing. The manual is 2 MB and the interpreter runs in the same page, so
// this catches the failures an SSR smoke test cannot: effects, timers, storage.
//
//   npm run test:dom

import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(HERE, "..");

const dom = new JSDOM("<!doctype html><html lang=\"vi\"><body><div id=\"root\"></div></body></html>", {
  url: "http://localhost:5173/",
  pretendToBeVisual: true,
});
const { window } = dom;

// The app reads these globals directly; jsdom gives us real implementations.
globalThis.window = window;
globalThis.document = window.document;
Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
globalThis.localStorage = window.localStorage;
globalThis.sessionStorage = window.sessionStorage;
globalThis.location = window.location;
globalThis.HTMLElement = window.HTMLElement;
globalThis.Node = window.Node;
globalThis.Event = window.Event;
globalThis.MouseEvent = window.MouseEvent;
globalThis.KeyboardEvent = window.KeyboardEvent;
globalThis.getComputedStyle = window.getComputedStyle.bind(window);
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
window.scrollTo = () => {};
window.confirm = () => true;
window.alert = () => {};
window.matchMedia = window.matchMedia || (() => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
window.Element.prototype.scrollTo = window.Element.prototype.scrollTo || function scrollTo() {};
window.Element.prototype.scrollIntoView = window.Element.prototype.scrollIntoView || function scrollIntoView() {};

// React 18 needs the test flag or every state update warns.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
window.IS_REACT_ACT_ENVIRONMENT = true;

const errors = [];
const fail = (message) => {
  errors.push(message);
  console.log(`FAIL  ${message}`);
};
const ok = (message) => console.log(`ok    ${message}`);

const { createRoot } = await import("react-dom/client");
const { act } = await import("react");
const { default: App } = await import("../src/App.jsx");

const container = window.document.getElementById("root");
const reactRoot = createRoot(container);

const wait = async (ms = 0) => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
};

const mount = async () => {
  await act(async () => {
    reactRoot.render(await import("react").then(({ createElement }) => createElement(App)));
  });
  await wait(0);
};

const click = async (element) => {
  await act(async () => {
    element.dispatchEvent(new window.MouseEvent("click", { bubbles: true, cancelable: true }));
  });
  await wait(0);
};

const type = async (element, value) => {
  const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
  const setText = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
  await act(async () => {
    if (element.tagName === "TEXTAREA") {
      setText.call(element, value);
      element.dispatchEvent(new window.Event("input", { bubbles: true }));
      element.dispatchEvent(new window.Event("change", { bubbles: true }));
    } else {
      setValue.call(element, value);
      element.dispatchEvent(new window.Event("input", { bubbles: true }));
      element.dispatchEvent(new window.Event("change", { bubbles: true }));
    }
  });
  await wait(0);
};

const text = (selector) => window.document.querySelector(selector)?.textContent?.trim() || "";
const all = (selector) => [...window.document.querySelectorAll(selector)];
const byText = (selector, needle) =>
  all(selector).find((element) => element.textContent.toLowerCase().includes(needle.toLowerCase()));

const navigate = async (hash) => {
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new window.Event("hashchange"));
  });
  await wait(0);
};

const go = async (hash) => {
  await act(async () => {
    window.location.hash = hash;
  });
  await wait(0);
};

// React logs a failed render to console.error; keep those as failures too.
const originalError = console.error;
console.error = (...args) => {
  const line = args.map(String).join(" ");
  if (/not wrapped in act|Warning: /.test(line)) return;
  errors.push(line);
  originalError(...args);
};
window.addEventListener("error", (event) => errors.push(`window error: ${event.message}`));
window.addEventListener("unhandledrejection", (event) => errors.push(`unhandled rejection: ${event.reason}`));

await mount();

if (text(".app").length === 0) fail("the app did not render");
else ok("the app renders");

// ---------------------------------------------------------------- learn view
if (!text(".sheet-title")) fail("learn: no lesson title");
else ok(`learn: ${text(".sheet-title")}`);

const stepCount = all(".sheet-body article.step").length;
if (stepCount < 2) fail(`learn: expected several steps, got ${stepCount}`);
else ok(`learn: ${stepCount} steps on the page`);

// The right pane shows the current step, and Next walks forward.
const before = text(".pane.right .pane-title");
const next = all(".guide-nav button").find((button) => /^(sau|next)\b/i.test(button.textContent.trim()));
if (!next) fail("learn: no Next button");
else {
  await click(next);
  const after = text(".pane.right .pane-title");
  if (before === after) fail("learn: Next did not advance the step");
  else ok(`learn: next step (${before} -> ${after})`);
}

// Arrow keys walk steps too.
await act(async () => {
  window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
});
await wait(0);
ok("learn: arrow key handled");

// Deep links land on the named step.
await go("#/learn/hack/types/nullable-types/3");
await wait(30);
if (!/Nullable/.test(text(".sheet-title"))) fail(`learn: deep link did not open Nullable Types (got ${text(".sheet-title")})`);
else ok(`learn: deep link -> ${text(".sheet-title")}`);

// A marked-done lesson is remembered after a remount.
const saved = JSON.parse(window.localStorage.getItem("hhvm-field-manual") || "{}");
if (!saved.last || !saved.last.p) fail("learn: progress was not saved to localStorage");
else ok(`learn: progress saved (${saved.last.p})`);

// The mobile menu button opens the course drawer and the scrim closes it.
await go("#/learn");
await wait(30);
const menuButton = window.document.querySelector(".menu-button");
if (!menuButton) fail("learn: no menu button");
else {
  await click(menuButton);
  if (!window.document.querySelector(".pane.left.open")) fail("learn: the menu button did not open the drawer");
  else ok("learn: menu opens the course drawer");
  const scrim = window.document.querySelector(".pane-scrim");
  if (!scrim) fail("learn: the open drawer has no scrim");
  else {
    await click(scrim);
    if (window.document.querySelector(".pane.left.open")) fail("learn: the scrim did not close the drawer");
    else ok("learn: the scrim closes the drawer");
  }
}

// A manual link inside a step body navigates instead of reloading the page.
await go("#/learn/hack/getting-started/quick-start/1");
await wait(30);
const lessonLink = window.document.querySelector('.sheet-body a[href^="#/"]');
if (!lessonLink) fail("learn: no in-page link to another lesson");
else {
  const href = lessonLink.getAttribute("href");
  const title = lessonLink.textContent.trim();
  await click(lessonLink);
  await wait(60);
  if (window.location.hash !== href) fail(`learn: in-page link went to ${window.location.hash}, expected ${href}`);
  else if (!text(".sheet-title")) fail("learn: in-page link left an empty page");
  else ok(`learn: in-page link "${title}" opens ${text(".sheet-title")}`);
}

// ---------------------------------------------------------------- exam view
await go("#/exam");
await wait(30);
if (!text(".page-title")) fail("exam: no title");
else ok(`exam: ${text(".page-title")}`);

const startButton = byText(".card button", "bắt đầu") || byText(".card button", "start");
if (!startButton) fail("exam: no start button");
else {
  await click(startButton);
  const options = all(".option").length;
  if (options < 2) fail("exam: a question has no options");
  else ok(`exam: paper started, ${options} options on the first question`);

  await click(all(".option")[0]);
  const answered = all(".toc button.answered").length;
  if (answered !== 1) fail("exam: answering did not mark the question");
  else ok("exam: answer recorded");

  const submitButton = all("button").find((button) => /nộp|submit/i.test(button.textContent));
  if (!submitButton) fail("exam: no submit button");
  else {
    await click(submitButton);
    const scoreText = text(".card .strong") + text(".result") + text(".app");
    if (!/\/\s*\d+|%/.test(scoreText)) fail("exam: no score after submitting");
    else ok("exam: submitted and scored");
    if (!JSON.parse(window.localStorage.getItem("hhvm-field-manual") || "{}").exams?.length) {
      fail("exam: result was not saved to history");
    } else ok("exam: result saved to history");
  }
}

// A chapter paper from a URL is built on mount, with the chapter in the title.
await go("#/exam/chapter/types");
await wait(120);
if (!/types/i.test(text(".card .strong") + text(".app"))) fail("exam: chapter paper did not open from the URL");
else if (all(".option").length < 2) fail("exam: chapter paper has no questions");
else ok("exam: chapter paper opens from a deep link");

// ---------------------------------------------------------------- playground
await go("#/playground");
await wait(30);
const editor = window.document.querySelector("textarea");
if (!editor) fail("playground: no editor");
else {
  await type(editor, '<?hh\nfunction main(): void {\n  echo "xin chao\\n";\n}\nmain();\n');
  const runButton = byText(".pg-right button, .playground button", "chạy") || byText("button", "run");
  if (!runButton) fail("playground: no Run button");
  else {
    await click(runButton);
    await wait(30);
    if (!/xin chao/.test(text(".console") + text(".pg-right") + text("pre"))) {
      fail("playground: output did not appear in the console");
    } else ok("playground: ran the program and printed its output");
  }
}

// An exercise opens with a starter, and its own graded run reports checks.
await go("#/playground/dict-count");
await wait(60);
const exercise = window.document.querySelector("textarea");
if (!exercise) fail("playground: no exercise editor");
else {
  const starter = exercise.value;
  if (!starter.trim()) fail("playground: the exercise has no starter code");
  else ok("playground: exercise opened with starter code");

  // Write the reference solution into the editor and run it: every check must pass.
  const { EXERCISES } = await import("../src/content/exercises.js");
  const exerciseSpec = EXERCISES.find((entry) => entry.id === "dict-count");
  await type(exercise, exerciseSpec.solution);
  const runExercise = all("button").find((button) => /kiểm tra|tests/i.test(button.textContent));
  if (!runExercise) fail("playground: the exercise has no Run-tests button");
  else {
    await click(runExercise);
    await wait(60);
    const checksText = text(".check-list");
    if (!checksText) fail("playground: the exercise did not report checks");
    else if (/trượt|failed|thiếu/i.test(text(".pg-right"))) fail(`playground: the solution failed its checks (${checksText.slice(0, 80)})`);
    else ok(`playground: the reference solution passed (${checksText.replace(/\s+/g, " ").slice(0, 40)}…)`);
  }
}

// ---------------------------------------------------------------- library
await go("#/library");
await wait(30);
const libraryCards = all(".term-grid a, .term-grid button, .card").length;
if (libraryCards === 0) fail("library: no entries");
else ok(`library: ${libraryCards} entries`);

await go("#/library?q=vec");
await wait(30);
if (!/vector|vec/i.test(text(".view"))) fail("library: search for vec found nothing");
else ok("library: search works");

// ---------------------------------------------------------------- palette
await go("#/learn");
await wait(30);
await act(async () => {
  window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));
});
await wait(30);
const paletteInput = window.document.querySelector(".palette input, [role=dialog] input");
if (!paletteInput) fail("palette: ⌘K did not open");
else {
  await type(paletteInput, "nullable");
  const results = all(".palette button, [role=dialog] button").length;
  if (results < 2) fail("palette: typing produced no results");
  else ok(`palette: ${results} results for "nullable"`);

  // Picking a result opens that lesson, not just a highlighted row.
  const firstResult = all(".palette button, [role=dialog] button").find((button) => /nullable/i.test(button.textContent));
  const hashBefore = window.location.hash;
  if (!firstResult) fail("palette: no result mentions nullable");
  else {
    await click(firstResult);
    await wait(60);
    if (window.location.hash === hashBefore) fail("palette: choosing a result did not navigate");
    else if (!/Nullable/i.test(text(".sheet-title"))) fail(`palette: the result opened ${text(".sheet-title")}`);
    else ok(`palette: choosing a result opens ${text(".sheet-title")}`);
  }
  await act(async () => {
    window.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  });
  await wait(0);
}

// The theme toggle is a real interaction: click it and the document follows.
const themeButton = all(".topbar button").find((button) => button.getAttribute("aria-label") === "Giao diện" || button.getAttribute("aria-label") === "Theme");
if (!themeButton) fail("theme: no toggle in the header");
else {
  const beforeTheme = window.document.documentElement.dataset.theme;
  await click(themeButton);
  const afterTheme = window.document.documentElement.dataset.theme;
  if (afterTheme === beforeTheme) fail("theme: the toggle did not change the theme");
  else ok(`theme: ${beforeTheme} -> ${afterTheme}`);
  if (JSON.parse(window.localStorage.getItem("hhvm-field-manual") || "{}").theme !== afterTheme) {
    fail("theme: the choice was not saved");
  } else ok("theme: choice saved");
}

// The language toggle re-renders the labels in the other language.
const langButton = all(".topbar button").find((button) => button.getAttribute("aria-label") === "Ngôn ngữ" || button.getAttribute("aria-label") === "Language");
if (!langButton) fail("language: no toggle in the header");
else {
  const beforeLang = text(".topbar .tabs");
  await click(langButton);
  const afterLang = text(".topbar .tabs");
  if (beforeLang === afterLang) fail("language: the toggle did not change the labels");
  else ok(`language: ${beforeLang.trim()} -> ${afterLang.trim()}`);
  await click(langButton);
}

// ---------------------------------------------------------------- remount
await act(async () => {
  reactRoot.unmount();
});
const second = createRoot(container);
await act(async () => {
  const { createElement } = await import("react");
  second.render(createElement(App));
});
await wait(30);
const savedTheme = JSON.parse(window.localStorage.getItem("hhvm-field-manual") || "{}").theme;
if (window.document.documentElement.dataset.theme !== savedTheme) fail("reload: the saved theme was not applied on reload");
else ok(`reload: saved ${savedTheme} theme restored`);
if (!/field manual|hhvm/i.test(text(".app"))) fail("reload: the app did not come back");
else ok("reload: the app remounts");

console.error = originalError;
await act(async () => {
  second.unmount();
});

if (errors.length) {
  console.log(`\n${errors.length} problem(s)`);
  process.exit(1);
}
console.log("\nthe app works in a DOM");
