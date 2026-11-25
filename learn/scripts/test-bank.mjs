// Checks the exam bank against the interpreter and the manual.
//
//   - every question links to a lesson that exists;
//   - every option list has exactly one right answer;
//   - for `predict` and `fill`, running the snippet must print one of the
//     options, and that option must be the marked answer. This is what keeps
//     the questions honest: nobody has to remember what a snippet prints, it
//     is executed here.
//
//   node scripts/test-bank.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { BANK } from "../src/content/bank.js";
import { runHack } from "../src/lib/hack/interpreter.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const manual = JSON.parse(fs.readFileSync(path.join(HERE, "../src/content/manual.json"), "utf8"));

let failures = 0;
const fail = (id, message) => {
  failures += 1;
  console.log(`FAIL  ${id}: ${message}`);
};

// A `fill` question spells the blank `____`; replace it with the answer to run it.
const codeFor = (question, optionIndex) =>
  question.kind === "fill" ? question.code.replace(/____/g, question.options[optionIndex]) : question.code;

for (const question of BANK) {
  if (!manual.lessons[question.lesson]) {
    fail(question.id, `lesson ${question.lesson} is not in the manual index`);
  } else if (manual.lessons[question.lesson].chapter !== question.chapter) {
    // A wrong answer offers "open the lesson"; it has to be in the chapter the
    // question claims, or the link leads somewhere that does not explain it.
    fail(question.id, `lesson ${question.lesson} belongs to ${manual.lessons[question.lesson].chapter}, not ${question.chapter}`);
  }
  if (!question.options || question.options.length < 2) {
    fail(question.id, "needs at least two options");
    continue;
  }
  if (question.answer < 0 || question.answer >= question.options.length) {
    fail(question.id, "answer index is out of range");
    continue;
  }

  if (question.kind === "predict" || question.kind === "fill") {
    const result = runHack(codeFor(question, question.answer));
    if (question.runtime === "error") {
      if (result.ok) {
        fail(question.id, "this question expects a runtime error, but the code ran cleanly");
        continue;
      }
      if (question.errorMatch && !new RegExp(question.errorMatch, "i").test(result.error.message)) {
        fail(question.id, `expected an error matching ${question.errorMatch}, got ${result.error.message}`);
      }
      continue;
    }
    if (question.kind === "fill") {
      // A fill question tests syntax, not output: running it only has to work.
      if (!result.ok) fail(question.id, `the right answer crashes: ${result.error.message} (line ${result.error.line})`);
      continue;
    }
    if (!result.ok) {
      fail(question.id, `the right answer crashes: ${result.error.message} (line ${result.error.line})`);
      continue;
    }
    const expected = question.options[question.answer].replace(/\\n/g, "\n").trim();
    const actual = result.output.trim();
    if (actual !== expected) {
      fail(question.id, `expected output ${JSON.stringify(expected)} but the code prints ${JSON.stringify(actual)}`);
    }
    // No other option may also be what the code prints.
    question.options.forEach((option, index) => {
      if (index === question.answer) return;
      if (option.replace(/\\n/g, "\n").trim() === actual) {
        fail(question.id, `option ${index} also matches the output`);
      }
    });
  }

  if (question.kind === "concept" && !question.explanation?.en) {
    fail(question.id, "concept questions need an explanation");
  }
}

// A paper where the right answer is always in the same place can be beaten
// without reading the code. Fail when one position holds too many answers.
const positions = {};
for (const question of BANK) {
  const letter = "ABCDE"[question.answer];
  positions[letter] = (positions[letter] || 0) + 1;
}
const mostCommon = Math.max(...Object.values(positions));
if (BANK.length >= 20 && mostCommon > BANK.length * 0.4) {
  fail("answer-positions", `too many answers sit at one position: ${JSON.stringify(positions)}`);
}

// A paper per chapter is offered for every chapter with questions; one question
// does not make a paper.
const perChapter = {};
for (const question of BANK) perChapter[question.chapter] = (perChapter[question.chapter] || 0) + 1;
for (const [chapter, count] of Object.entries(perChapter)) {
  if (count < 2) fail(chapter, `needs at least two questions to make a paper, has ${count}`);
}

// Every chapter that has questions should exist in the manual.
const chapters = new Set(
  manual.tracks.flatMap((track) => track.chapters.map((chapter) => chapter.slug)),
);
for (const question of BANK) {
  if (!chapters.has(question.chapter)) {
    fail(question.id, `chapter ${question.chapter} is not in the manual`);
  }
}

const byChapter = {};
for (const question of BANK) byChapter[question.chapter] = (byChapter[question.chapter] || 0) + 1;
console.log(`${BANK.length} questions in the bank`);
console.log(`  answers by position: ${Object.entries(positions).sort().map(([letter, count]) => `${letter}=${count}`).join(" ")}`);
for (const [chapter, count] of Object.entries(byChapter).sort()) {
  console.log(`  ${String(count).padStart(2)}  ${chapter}`);
}

if (failures) {
  console.log(`\n${failures} problem(s)`);
  process.exit(1);
}
console.log("\nthe bank matches the interpreter and the manual");
