// Everything the site remembers about a visitor, kept in localStorage.
//
// Shape of the record (one JSON object, key `hhvm-field-manual`):
//
//   lang      "vi" | "en"
//   theme     "light" | "dark"
//   done      { "<lesson id>": <ms when finished> }
//   last      { p: "<lesson id>/<step>", t: <ms> }
//   exams     [ { id, name, score, total, at, passed, seconds } ]   newest first
//   drafts    { "<exercise id>": "<source>" }
//
// Nothing leaves the device. `reset()` keeps the language and theme.

const KEY = "hhvm-field-manual";
const MAX_EXAMS = 40;

const empty = () => ({ lang: "vi", theme: "light", done: {}, last: null, exams: [], drafts: {} });

const read = () => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!value || typeof value !== "object") return empty();
    return { ...empty(), ...value, done: value.done || {}, exams: value.exams || [], drafts: value.drafts || {} };
  } catch {
    return empty();
  }
};

let record = null;
const listeners = new Set();

const load = () => {
  if (!record) record = read();
  return record;
};

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // Storage can be full or disabled; the session still works in memory.
  }
  for (const listener of listeners) listener(record);
};

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const get = () => load();

export const setLang = (lang) => {
  load().lang = lang;
  save();
};

export const setTheme = (theme) => {
  load().theme = theme;
  save();
};

export const markLessonDone = (lessonId) => {
  const data = load();
  if (!data.done[lessonId]) {
    data.done[lessonId] = Date.now();
    save();
  }
};

export const isLessonDone = (lessonId) => Boolean(load().done[lessonId]);

export const setLast = (lessonId, step, total) => {
  const data = load();
  data.last = { p: `${lessonId}/${step}`, t: Date.now(), n: total };
  save();
};

export const getLast = () => load().last;

export const doneCount = (lessonIds) => {
  const data = load();
  if (!lessonIds) return Object.keys(data.done).length;
  return lessonIds.reduce((sum, id) => sum + (data.done[id] ? 1 : 0), 0);
};

export const recordExam = (entry) => {
  const data = load();
  data.exams = [entry, ...data.exams].slice(0, MAX_EXAMS);
  save();
};

export const getExams = () => load().exams;

export const setDraft = (exerciseId, source) => {
  const data = load();
  data.drafts[exerciseId] = source;
  save();
};

export const getDraft = (exerciseId) => load().drafts[exerciseId];

export const reset = () => {
  const data = load();
  record = { ...empty(), lang: data.lang, theme: data.theme };
  save();
};

export const progressSummary = (lessonIds) => {
  const data = load();
  const total = lessonIds.length;
  const done = lessonIds.filter((id) => data.done[id]).length;
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
};
