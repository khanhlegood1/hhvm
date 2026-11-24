// Markdown from the manual, rendered for the browser.
//
// The manual is written for Docusaurus, so its source holds three things a
// plain markdown renderer would show as text:
//
//   :::info[Title] ... :::        admonitions
//   <FbInfo> ... </FbInfo>        Meta-internal blocks, dropped entirely
//   </hack/relative/page>         links to other pages of the manual
//
// `prepare` turns those into markdown that `marked` understands and that the
// site can style. Links to other manual pages are rewritten to the site's own
// routes, so a lesson never sends the reader away from the course.

import { marked } from "marked";

const INTERNAL_CHAPTERS = new Set([
  "FbInfo",
  "FbCaution",
  "FbInternalOnly",
  "FbHistorical",
  "FbTruncate",
  "FbWarning",
]);

// Everything that is internal to Meta is removed, including its contents.
export const stripInternal = (markdown) => {
  let text = markdown;
  for (const tag of INTERNAL_CHAPTERS) {
    const pattern = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, "g");
    text = text.replace(pattern, "");
    const selfClosing = new RegExp(`<${tag}[^>]*/>`, "g");
    text = text.replace(selfClosing, "");
  }
  return text;
};

// Docusaurus admonitions: `:::info[Title] ... :::`
const convertAdmonitions = (markdown) =>
  markdown.replace(/^:::(\w+)(?:\[([^\]]*)\])?\s*\n([\s\S]*?)^:::\s*$/gm, (match, kind, title, body) => {
    const label = title || (kind === "caution" ? "Caution" : kind.charAt(0).toUpperCase() + kind.slice(1));
    const lines = body
      .trim()
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
    return `<div class="admonition ${kind.toLowerCase()}"><div class="adm-title">${label}</div>\n\n${lines}\n\n</div>`;
  });

// Drop headings that the page layout already shows.
const dropTitle = (markdown) => markdown.replace(/^#\s+.*\n/, "");

// Rewrite `/hack/types/nullable-types` to `#/learn/hack/types/nullable-types`
// (and the step anchor, if any, to nothing). `resolve` maps a path to a lesson
// id when one exists; otherwise the link falls back to the manual's own URL.
const rewriteLinks = (markdown, resolve) =>
  markdown.replace(/\]\((\/[a-z0-9/_-]+)(#[^)]*)?\)/g, (match, href, anchor) => {
    const parts = href.split("/").filter(Boolean);
    if (parts.length !== 3) return `](${href})`;
    const id = parts.join("/");
    if (resolve && !resolve(id)) return `](https://docs.hhvm.com${href}${anchor || ""})`;
    return `](#/learn/${id})`;
  });

// Images in the manual live in the docs site, not in this repository.
const rewriteImages = (markdown) =>
  markdown.replace(/!\[([^\]]*)\]\((\/img\/[^)]+)\)/g, (match, alt, src) => `![${alt}](https://docs.hhvm.com${src})`);

export const prepare = (markdown, { resolve, keepTitle = false } = {}) => {
  let text = stripInternal(markdown || "");
  text = convertAdmonitions(text);
  text = keepTitle ? text : dropTitle(text);
  text = rewriteLinks(text, resolve);
  text = rewriteImages(text);
  return text;
};

marked.setOptions({ gfm: true, breaks: false });

// The manual fences code with ```hack, ```php or nothing at all.
export const isHackFence = (lang) => !lang || /^(hack|php|hh|xhp)$/i.test(lang);

// A tiny tokeniser for Hack, used by both the rendered blocks and the
// playground editor. It colours keywords, strings, numbers, variables,
// comments and declarations; it never changes the text it is given.
const KEYWORDS = [
  "async", "await", "abstract", "as", "break", "case", "catch", "class", "const", "continue",
  "default", "do", "echo", "else", "elseif", "enum", "extends", "final", "finally", "for",
  "foreach", "function", "if", "implements", "inout", "instanceof", "interface", "namespace",
  "new", "newtype", "private", "protected", "public", "readonly", "return", "shape", "static",
  "switch", "throw", "trait", "try", "type", "use", "vec", "dict", "keyset", "tuple", "while",
  "yield", "true", "false", "null", "this", "self", "parent", "super", "insteadof", "where",
  "context", "module", "package", "internal", "case", "require", "nameof", "goto", "list",
];

const escapeHtml = (text) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const highlight = (code) => {
  const keywords = new Set(KEYWORDS);
  let out = "";
  let index = 0;

  const push = (className, text) => {
    out += className ? `<span class="${className}">${escapeHtml(text)}</span>` : escapeHtml(text);
  };

  while (index < code.length) {
    const rest = code.slice(index);

    // Comments
    const comment = rest.match(/^(\/\/[^\n]*|#[^[][^\n]*|\/\*[\s\S]*?\*\/)/);
    if (comment) {
      push("tok-com", comment[0]);
      index += comment[0].length;
      continue;
    }

    // Heredocs and quoted strings
    const heredoc = rest.match(/^<<<(['"]?)(\w+)\1\n[\s\S]*?\n\s*\2/);
    if (heredoc) {
      push("tok-str", heredoc[0]);
      index += heredoc[0].length;
      continue;
    }
    const string = rest.match(/^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/);
    if (string) {
      push("tok-str", string[0]);
      index += string[0].length;
      continue;
    }

    // Attributes: <<__EntryPoint>>
    const attribute = rest.match(/^<<[^>]*(?:>>|>)/);
    if (attribute && /^<<\w/.test(rest)) {
      push("tok-attr", attribute[0]);
      index += attribute[0].length;
      continue;
    }

    // Variables
    const variable = rest.match(/^\$[A-Za-z_][A-Za-z0-9_]*/);
    if (variable) {
      push("tok-var", variable[0]);
      index += variable[0].length;
      continue;
    }

    // Numbers
    const number = rest.match(/^(0[xX][0-9a-fA-F]+|0[bB][01]+|\d+\.\d+|\d+)/);
    if (number) {
      push("tok-num", number[0]);
      index += number[0].length;
      continue;
    }

    // Names, including namespaces and `::` members
    const name = rest.match(/^\\?[A-Za-z_][A-Za-z0-9_]*(?:\\[A-Za-z_][A-Za-z0-9_]*)*/);
    if (name) {
      const word = name[0];
      const bare = word.split("\\").pop();
      const before = code.slice(0, index).trimEnd().slice(-1);
      if (keywords.has(bare) && !word.includes("\\")) {
        push("tok-kw", word);
      } else if (/^[A-Z]/.test(bare) || /\\(?:Lib|Exception|ImmVector|Map|Pair|Set|Vector)$/.test(word)) {
        push("tok-type", word);
      } else if (code.slice(index + word.length).match(/^\s*\(/)) {
        push("tok-fn", word);
      } else {
        push(null, word);
      }
      index += word.length;
      continue;
    }

    const punctuation = rest.match(/^[{}()[\];,.:?=+\-*/%<>!&|^~@]+/);
    if (punctuation) {
      push("tok-punc", punctuation[0]);
      index += punctuation[0].length;
      continue;
    }

    push(null, rest[0]);
    index += 1;
  }

  return out;
};

// `marked` renderer: code fences become the site's own block with a copy
// button, which React attaches after inserting the HTML.
const renderer = new marked.Renderer();
renderer.code = (codeOrToken, language) => {
  const code = typeof codeOrToken === "object" ? codeOrToken.text : codeOrToken;
  const lang = (typeof codeOrToken === "object" ? codeOrToken.lang : language) || "";
  const hack = isHackFence(lang);
  const body = hack ? highlight(code) : escapeHtml(code);
  return (
    `<div class="code-block" data-code="${encodeURIComponent(code)}" data-lang="${escapeHtml(lang || "hack")}">` +
    `<div class="code-bar"><span>${escapeHtml(lang || "hack")}</span><span class="spacer"></span>` +
    `<button type="button" data-copy="1">Copy</button>` +
    (hack ? `<button type="button" data-run="1">Run</button>` : "") +
    `</div><pre><code>${body}</code></pre></div>`
  );
};
marked.use({ renderer });

export const renderMarkdown = (markdown, options = {}) => marked.parse(prepare(markdown, options));

export const plainSummary = (markdown, max = 180) => {
  const text = stripInternal(markdown || "")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length <= max ? text : `${text.slice(0, text.lastIndexOf(" ", max))}…`;
};

export { escapeHtml };
