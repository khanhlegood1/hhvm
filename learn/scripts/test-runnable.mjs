// The Run buttons must be truthful: every snippet the site offers to run has
// to actually run, in the same wrapper the playground applies, and produce
// output the reader can see. This checks the generated `runnable` list against
// the interpreter, and fails if a listed snippet is broken.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runHack } from "../src/lib/hack/interpreter.js";
import { asProgram, codeHash } from "../src/lib/codeHash.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const manual = JSON.parse(fs.readFileSync(path.join(HERE, "../src/content/manual.json"), "utf8"));
const listed = new Set([...manual.runnable, ...(manual.loadable || [])]);

let failures = 0;
let checked = 0;

const check = (code, where) => {
  const hash = codeHash(code);
  if (!listed.has(hash)) return false;
  checked += 1;
  const result = runHack(asProgram(code), { maxSteps: 200000 });
  if (!result.ok) {
    failures += 1;
    console.log(`FAIL  ${where}: the Run button would show an error`);
    console.log(`      ${result.error.message.split("\n")[0]}`);
    return true;
  }
  return true;
};

// 1. Every fence in every step that has a Run button must still run.
const byStep = new Map();
for (const lesson of Object.values(manual.lessons)) {
  for (const step of lesson.steps) {
    for (const match of step.md.matchAll(/```([\w.]*)\n([\s\S]*?)```/g)) {
      const lang = match[1].toLowerCase();
      if (lang && !/^(hack|php|hh|xhp)$/.test(lang)) continue;
      const code = match[2].trim();
      if (!/[;{}]/.test(code) || code.length < 24 || code.length > 1400) continue;
      if (/^\s*\$ /m.test(code) || /^[A-Z][a-z]+\s+[a-z]+\s+[a-z]/m.test(code)) continue;
      byStep.set(code, `${lesson.id}#${step.n}`);
    }
  }
}

let offered = 0;
let promised = 0;
for (const [code, where] of byStep) {
  if (listed.has(codeHash(code))) {
    offered += 1;
    const result = runHack(asProgram(code), { maxSteps: 200000 });
    if (manual.runnable.includes(codeHash(code))) {
      promised += 1;
      if (!result.output.trim()) {
        failures += 1;
        console.log(`FAIL  ${where}: the button says Run but the snippet prints nothing`);
      }
    }
    if (!result.ok) {
      failures += 1;
      console.log(`FAIL  ${where}: a code button is offered but the code fails`);
      console.log(`      ${result.error.message.split("\n")[0]}`);
    }
  }
}
const silent = [...byStep.entries()].filter(([code]) => manual.runnable.includes(codeHash(code)) && !runHack(asProgram(code), { maxSteps: 200000 }).output.trim()).length;

// 2. The playground hand-off on each lesson must be runnable when offered.
for (const lesson of Object.values(manual.lessons)) {
  const snippet = lesson.code.find((code) => listed.has(codeHash(code)));
  if (!snippet) continue;
  check(snippet, lesson.id);
}

console.log(`\ncode buttons: ${offered} offered over ${byStep.size} snippets, ${promised} say Run and print`);
if (failures) {
  console.log(`${failures} broken run button(s)`);
  process.exit(1);
}
console.log("every run button points at code the playground can run");
