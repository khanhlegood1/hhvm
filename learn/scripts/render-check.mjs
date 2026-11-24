// Renders every view with React's server renderer. This catches the class of
// bug a build cannot: a component that throws on real data.
//
//   node scripts/render-check.mjs

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const manual = JSON.parse(fs.readFileSync(path.join(HERE, "../src/content/manual.json"), "utf8"));
import LearnView from "../src/views/LearnView.jsx";
import ExamView from "../src/views/ExamView.jsx";
import PlaygroundView from "../src/views/PlaygroundView.jsx";
import LibraryView from "../src/views/LibraryView.jsx";
import { t as translate } from "../src/content/strings.js";
import { prepareIndex } from "../src/lib/search.js";

// A tiny localStorage, so the views can read progress without a browser.
const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => (memory.has(key) ? memory.get(key) : null),
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
};
globalThis.sessionStorage = globalThis.localStorage;
globalThis.window = {
  location: { hash: "#/learn" },
  history: { replaceState() {} },
  addEventListener() {},
  removeEventListener() {},
  scrollTo() {},
  confirm: () => true,
  navigator: { clipboard: null },
};

const chaptersById = {};
const trackByChapter = {};
for (const track of manual.tracks) {
  for (const chapter of track.chapters) {
    chaptersById[chapter.slug] = chapter;
    trackByChapter[chapter.slug] = track.id;
  }
}
const index = prepareIndex(manual.index, chaptersById, trackByChapter);

const cases = [
  ["learn, first lesson", LearnView, { manual, route: { view: "learn", parts: [], params: {} }, lang: "vi", menuOpen: false, setMenuOpen() {}, onPracticeExam() {}, onOpenPlayground() {} }],
  ["learn, deep link", LearnView, { manual, route: { view: "learn", parts: ["hack", "types", "nullable-types", "3"], params: {} }, lang: "en", menuOpen: false, setMenuOpen() {}, onPracticeExam() {}, onOpenPlayground() {} }],
  ["exam list", ExamView, { manual, route: { view: "exam", parts: [], params: {} }, lang: "vi" }],
  ["exam, chapter paper", ExamView, { manual, route: { view: "exam", parts: ["chapter", "types"], params: {} }, lang: "en" }],
  ["playground", PlaygroundView, { manual, route: { view: "playground", parts: [], params: {} }, lang: "vi", chaptersById }],
  ["playground, exercise", PlaygroundView, { manual, route: { view: "playground", parts: ["dict-count"], params: {} }, lang: "en", chaptersById }],
  ["library", LibraryView, { manual, index, route: { view: "library", parts: [], params: {} }, lang: "vi", chaptersById, trackByChapter }],
  ["library, query", LibraryView, { manual, index, route: { view: "library", parts: [], params: { q: "vec" } }, lang: "en", chaptersById, trackByChapter }],
];

let failures = 0;
for (const [name, Component, props] of cases) {
  const lang = props.lang || "vi";
  try {
    const html = renderToString(createElement(Component, { ...props, t: (path) => translate(lang, path) }));
    if (html.length < 400) throw new Error(`only ${html.length} characters of HTML`);
    console.log(`ok    ${name} (${(html.length / 1024).toFixed(0)} kB)`);
  } catch (error) {
    failures += 1;
    console.log(`FAIL  ${name}`);
    console.log(`      ${error.stack.split("\n").slice(0, 6).join("\n      ")}`);
  }
}

if (failures) {
  console.log(`\n${failures} view(s) failed to render`);
  process.exit(1);
}
console.log("\nevery view renders");
