// Turns the manual that ships with this repository into the content of the
// learning site. Nothing is fetched from the network and nothing is retyped:
// every lesson is one page of `hphp/hack/manual`, cut into steps.
//
//   hphp/hack/manual/hack/<chapter>/<page>.md   -> lessons of the Hack track
//   hphp/hack/manual/hhvm/<chapter>/<page>.md   -> lessons of the HHVM track
//   hphp/hack/manual/*-overview.mdx             -> track introductions
//   hphp/hack/manual/hsl/00-overview.md         -> the HSL track introduction
//
// Output: src/content/manual.json

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const MANUAL = process.env.HHVM_MANUAL_DIR
  ? path.resolve(process.env.HHVM_MANUAL_DIR)
  : path.join(ROOT, "hphp/hack/manual");
const OUT = path.join(HERE, "../src/content/manual.json");

// Chapter labels for pages that have no `_category_.json`.
const CHAPTER_LABELS = {
  hsl: "Hack Standard Library",
};

// Slugs keep the manual's own URLs usable: /hack/types/nullable-types is the
// Hack docs URL of "Nullable Types", and the manual calls that chapter 10-types.
const TRACKS = [
  {
    id: "hack",
    dir: "hack",
    title: { vi: "Ngôn ngữ Hack", en: "The Hack language" },
    summary: {
      vi: "Từ cú pháp đầu tiên tới generic, context, async: toàn bộ ngôn ngữ Hack như bộ tài liệu trong repo này mô tả.",
      en: "From the first syntax to generics, contexts and async: the whole language as the manual in this repository describes it.",
    },
    intro: "hack-overview.mdx",
  },
  {
    id: "hhvm",
    dir: "hhvm",
    title: { vi: "HHVM runtime", en: "The HHVM runtime" },
    summary: {
      vi: "Cài đặt, chạy CLI và server, Proxygen, cấu hình INI và extension — cách đưa code Hack ra khỏi máy bạn.",
      en: "Install, run CLI and server, Proxygen, INI configuration and extensions — how Hack code leaves your machine.",
    },
    intro: "hhvm-overview.mdx",
  },
];

const warnings = [];
const warn = (message) => warnings.push(message);

const read = (file) => fs.readFileSync(file, "utf8");

// Blocks that only make sense inside Meta are removed before a page is cut
// into steps: they would otherwise leave an empty step behind.
const INTERNAL = [
  "FbInfo",
  "FbCaution",
  "FbInternalOnly",
  "FbHistorical",
  "FbTruncate",
  "FbWarning",
];
const stripInternal = (body) => {
  let text = body;
  for (const tag of INTERNAL) {
    text = text.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?</${tag}>`, "g"), "");
    text = text.replace(new RegExp(`<${tag}[^>]*/>`, "g"), "");
  }
  return text;
};
const exists = (file) => fs.existsSync(file);

const stripFrontmatter = (text) => {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { body: text, frontmatter: {} };
  const frontmatter = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (pair) frontmatter[pair[1]] = pair[2].trim();
  }
  return { body: text.slice(match[0].length), frontmatter };
};

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[`'’"“”]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// "10-types" -> "types", "03-expressions-and-operators" -> "expressions-and-operators"
const chapterSlug = (dirName) => dirName.replace(/^\d+-/, "");

// "01-quick-start.md" -> { order: 1, slug: "quick-start" }
const pageSlug = (fileName) => {
  const base = fileName.replace(/\.(md|mdx)$/, "");
  const match = base.match(/^(\d+)-(.+)$/);
  return match ? { order: Number(match[1]), slug: match[2] } : { order: 999, slug: base };
};

// The first H1 is the page title; it is shown in the header, not in the body.
const takeTitle = (body, fallback) => {
  const lines = body.split("\n");
  const index = lines.findIndex((line) => /^#\s+\S/.test(line));
  if (index === -1) return { title: fallback, body: body.trim() };
  const title = lines[index].replace(/^#\s+/, "").trim();
  lines.splice(index, 1);
  return { title, body: lines.join("\n").trim() };
};

const firstParagraph = (body) => {
  for (const chunk of body.split(/\n\s*\n/)) {
    const text = chunk.trim();
    if (!text) continue;
    if (/^(```|:::|\||#|>|[-*+] |\d+\. |<)/.test(text)) continue;
    return text
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_`]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }
  return "";
};

const collapse = (text, max) => {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
};

// Split the page into blocks: a fenced code block counts as one block, however
// many blank lines it holds, and so does an admonition or a table.
const toBlocks = (body) => {
  const blocks = [];
  let buffer = [];
  let fence = null;
  let admonition = 0;

  const flush = () => {
    const text = buffer.join("\n").trim();
    if (text) blocks.push(text);
    buffer = [];
  };

  for (const line of body.split("\n")) {
    const fenceMatch = line.match(/^\s*(```+|~~~+)/);
    if (fence) {
      buffer.push(line);
      if (fenceMatch && fenceMatch[1][0] === fence[0] && fenceMatch[1].length >= fence.length) {
        const rest = line.slice(line.indexOf(fenceMatch[1]) + fenceMatch[1].length).trim();
        // `\`\`\`.expectf` closes the code sample and opens its expected output.
        fence = rest.startsWith(".") ? fenceMatch[1] : null;
      }
      continue;
    }
    if (fenceMatch) {
      if (!admonition) flush();
      fence = fenceMatch[1];
      buffer.push(line);
      continue;
    }
    if (/^:::/.test(line)) {
      admonition += line.match(/^:::/g) ? 1 : 0;
      if (admonition === 1 && buffer.length === 0) {
        buffer.push(line);
        continue;
      }
      buffer.push(line);
      if (/^:::\s*$/.test(line)) {
        admonition = 0;
        flush();
      }
      continue;
    }
    if (admonition) {
      buffer.push(line);
      continue;
    }
    if (line.trim() === "") {
      flush();
      continue;
    }
    buffer.push(line);
  }
  flush();

  // A paragraph that introduces a table or a list stays with it: both together
  // are one thought, and a step that ends on a colon reads badly on its own.
  const merged = [];
  for (const block of blocks) {
    const previous = merged[merged.length - 1];
    const isTable = /^\|/.test(block);
    const isList = /^([-*+] |\d+\. )/.test(block);
    const opensBlock = previous && /(:\s*)$/.test(previous);
    if (previous && (opensBlock || ((isTable || isList) && !/^#/.test(previous) && previous.length < 400))) {
      merged[merged.length - 1] = `${previous}\n\n${block}`;
      continue;
    }
    merged.push(block);
  }

  // A table taller than a step is cut between rows, keeping its header, so
  // that no single step is a wall of settings.
  const rows = [];
  for (const block of merged) {
    const table = block.match(/^\|[\s\S]*/m)?.[0] ?? "";
    if (!table || table.split("\n").length < 12) {
      rows.push(block);
      continue;
    }
    const lines = table.split("\n");
    const header = lines.slice(0, 2);
    let piece = [];
    let words = 0;
    for (const line of lines.slice(2)) {
      piece.push(line);
      words += line.split(/\s+/).filter(Boolean).length;
      if (words > 180) {
        rows.push(`${header.join("\n")}\n${piece.join("\n")}`);
        piece = [];
        words = 0;
      }
    }
    if (piece.length) rows.push(`${header.join("\n")}\n${piece.join("\n")}`);
  }
  return rows;
};

// Cut the page into guide steps. A heading starts a step and the blocks under
// it stay together, unless the section is long: then the extra paragraphs
// become continuation steps, so the guide never shows a wall of text at once.
const splitSteps = (body) => {
  const blocks = toBlocks(stripInternal(body));
  const steps = [];
  let current = null;

  const close = () => {
    if (current && current.parts.length > 0) steps.push(current);
    current = null;
  };

  const wordCount = (text) => text.split(/\s+/).filter(Boolean).length;

  for (const block of blocks) {
    const heading = block.match(/^#{2,4}\s+(.+)$/);
    if (heading) {
      close();
      current = { heading: heading[1].replace(/[*_`]/g, "").trim(), parts: [], kind: "detail" };
      continue;
    }
    if (!current) current = { heading: null, parts: [], kind: steps.length === 0 ? "definition" : "detail" };

    const isNote = /^:::/.test(block) || /^>/.test(block);
    if (isNote && current.parts.length > 0) {
      // An admonition stands on its own so the reader notices it.
      const heading = current.heading;
      close();
      steps.push({ heading, kind: "note", parts: [block] });
      continue;
    }
    current.kind = current.parts.length === 0 && steps.length === 0 ? "definition" : isNote ? "note" : current.kind;
    current.parts.push(block);

    const words = wordCount(current.parts.join(" "));
    if (words > 170 && current.parts.length >= 2) close();
  }
  close();

  // Hard limit: one block that is a whole page of tables becomes several
  // steps at line-boundary chunks, so the reader still gets a step at a time.
  const bounded = [];
  for (const step of steps) {
    let parts = step.parts;
    while (parts.length) {
      const chunk = [];
      let words = 0;
      while (parts.length && words < 220) {
        const next = parts.shift();
        chunk.push(next);
        words += wordCount(next);
      }
      bounded.push({ ...step, parts: chunk });
    }
  }
  return splitStepsOf(bounded);
};

const splitStepsOf = (steps) =>
  steps.map((step, index) => ({
    n: index + 1,
    kind: index === 0 ? "definition" : step.kind,
    heading: step.heading,
    md: step.parts.join("\n\n"),
  }));

// Pages that only forward the reader elsewhere make poor lessons on their own.
const isRedirect = (body) => {
  const text = body.replace(/```[\s\S]*?```/g, "").replace(/^#.*$/gm, "").trim();
  const words = text.split(/\s+/).filter(Boolean);
  return words.length < 55 && /see \[|see the \[|refer to/i.test(text) === false && words.length < 40;
};

const linksOf = (body) =>
  [...body.matchAll(/\]\((\/[a-z0-9/-]+)\)/g)].map((match) => match[1]);

const codeBlocks = (body) =>
  [...body.matchAll(/```(\w*)\n([\s\S]*?)```/g)]
    .filter((match) => !match[1] || /hack|php|hh|xhp/i.test(match[1]))
    .map((match) => match[2].trim())
    .filter((code) => code.length > 30 && code.length < 1400);

const loadTrack = (track) => {
  const dir = path.join(MANUAL, track.dir);
  if (!exists(dir)) {
    warn(`missing manual directory: ${path.relative(ROOT, dir)}`);
    return { ...track, chapters: [] };
  }

  const dirs = fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const chapters = [];
  for (const dirName of dirs) {
    const chapterDir = path.join(dir, dirName);
    const categoryFile = path.join(chapterDir, "_category_.json");
    let label = CHAPTER_LABELS[dirName] || null;
    if (!label && exists(categoryFile)) {
      try {
        label = JSON.parse(read(categoryFile)).label || null;
      } catch {
        warn(`unreadable ${path.relative(ROOT, categoryFile)}`);
      }
    }
    if (!label) label = dirName.replace(/^\d+-/, "").replace(/-/g, " ");

    const slug = chapterSlug(dirName);
    const number = Number((dirName.match(/^(\d+)/) || [])[1] || 0);
    const pages = fs
      .readdirSync(chapterDir)
      .filter((name) => /\.(md|mdx)$/.test(name))
      .map((name) => ({ name, ...pageSlug(name) }))
      .sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));

    const lessons = [];
    for (const page of pages) {
      const rel = path.relative(ROOT, path.join(chapterDir, page.name));
      const { body: rawBody, frontmatter } = stripFrontmatter(read(path.join(chapterDir, page.name)));
      const { title, body } = takeTitle(rawBody, frontmatter.title || page.slug);
      const steps = splitSteps(stripInternal(body));
      const summary = collapse(frontmatter.description || firstParagraph(body) || title, 190);
      const words = body.split(/\s+/).filter(Boolean).length;
      lessons.push({
        id: `${track.id}/${slug}/${page.slug}`,
        track: track.id,
        chapter: slug,
        slug: page.slug,
        title,
        summary,
        words,
        readingMinutes: Math.max(2, Math.round(words / 220)),
        steps,
        code: codeBlocks(body).slice(0, 2),
        links: [...new Set(linksOf(body))].slice(0, 8),
        source: rel,
        redirect: isRedirect(body) && chapters.length > 3,
      });
      if (steps.length === 0) warn(`${rel}: no steps`);
    }

    chapters.push({
      id: `${track.id}/${slug}`,
      track: track.id,
      slug,
      number,
      label,
      lessons,
    });
  }

  const all = chapters.flatMap((chapter) => chapter.lessons);
  for (const lesson of all) {
    lesson.neighbors = {
      prev: null,
      next: null,
    };
  }
  all.forEach((lesson, index) => {
    lesson.neighbors.prev = index > 0 ? all[index - 1].id : null;
    lesson.neighbors.next = index < all.length - 1 ? all[index + 1].id : null;
  });

  return { ...track, chapters };
};

const tracks = TRACKS.map(loadTrack);

// ---------------------------------------------------------------------------
// Search index and glossary. Every lesson is one record; every heading is a
// jump target. Terms from the manual's own glossaries are indexed separately.
// ---------------------------------------------------------------------------

const lessons = tracks.flatMap((track) => track.chapters.flatMap((chapter) => chapter.lessons));
const byId = Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson]));

for (const lesson of lessons) {
  lesson.links = lesson.links.filter((href) => {
    const parts = href.split("/").filter(Boolean);
    if (parts.length !== 3) return false;
    return Boolean(byId[`${parts[0]}/${parts[1]}/${parts[2]}`]);
  });
}

const index = lessons.map((lesson) => ({
  id: lesson.id,
  t: lesson.title,
  c: lesson.chapter,
  tr: lesson.track,
  s: lesson.summary,
  h: lesson.steps.map((step) => step.heading).filter(Boolean),
}));

const output = {
  generatedFrom: "hphp/hack/manual",
  tracks: tracks.map(({ id, title, summary, chapters }) => ({ id, title, summary, chapters })),
  lessons: Object.fromEntries(lessons.map((lesson) => [lesson.id, lesson])),
  index,
  count: {
    chapters: tracks.reduce((sum, track) => sum + track.chapters.length, 0),
    lessons: lessons.length,
    steps: lessons.reduce((sum, lesson) => sum + lesson.steps.length, 0),
    words: lessons.reduce((sum, lesson) => sum + lesson.words, 0),
  },
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(output));

const size = (fs.statSync(OUT).size / 1024).toFixed(0);
console.log(
  `manual.json  ${output.count.lessons} lessons · ${output.count.chapters} chapters · ` +
    `${output.count.steps} steps · ${(output.count.words / 1000).toFixed(0)}k words · ${size} kB`,
);
const redirects = lessons.filter((lesson) => lesson.redirect).length;
if (redirects) console.log(`  ${redirects} short pages flagged as pointers`);
for (const message of warnings.slice(0, 12)) console.log(`  warn: ${message}`);
if (warnings.length > 12) console.log(`  … ${warnings.length - 12} more warnings`);
