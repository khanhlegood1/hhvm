// Runs the playground interpreter against hand-written programs whose output is
// known, and reports which parts of the language still fail to parse or run.
//
//   node scripts/test-hack.mjs           all cases
//   node scripts/test-hack.mjs --manual  also parse every snippet in the manual
//
// The cases double as documentation of what the playground supports: the same
// file explains itself to a reader who wonders why `Instansiate` fails.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runHack } from "../src/lib/hack/interpreter.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");

const CASES = [
  {
    name: "echo and arithmetic",
    code: `<?hh
<<__EntryPoint>>
function main(): void {
  echo "Hello, Hack!\\n";
  $a = 6;
  $b = 7;
  echo $a * $b, "\\n";
  echo 10 / 4, "\\n";
  echo 10 / 5, "\\n";
  echo 7 % 3, "\\n";
}`,
    out: "Hello, Hack!\n42\n2.5\n2\n1\n",
  },
  {
    name: "strings and interpolation",
    code: `<?hh
function main(): void {
  $name = "Hack";
  $n = 3;
  echo "Hi $name, n={$n}\\n";
  echo "Tab\\there\\n";
  echo 'single $name\\n';
  echo strlen("hello"), "\\n";
  echo strtoupper("abc"), " ", strtolower("DEF"), "\\n";
}`,
    out: "Hi Hack, n=3\nTab\there\nsingle $name\\n5\nABC def\n",
  },
  {
    name: "vec and dict",
    code: `<?hh
function main(): void {
  $v = vec[1, 2, 3];
  $v[] = 4;
  echo count($v), "\\n";
  echo $v[3], "\\n";
  $d = dict['a' => 1, 'b' => 2];
  $d['c'] = 3;
  echo $d['a'] + $d['c'], "\\n";
  echo implode(",", $v), "\\n";
  $ks = keyset['x', 'y'];
  echo count($ks), "\\n";
}`,
    out: "4\n4\n4\n1,2,3,4\n2\n",
  },
  {
    name: "if, loops",
    code: `<?hh
function main(): void {
  $total = 0;
  for ($i = 1; $i <= 5; $i++) {
    $total += $i;
  }
  echo $total, "\\n";
  foreach (vec['a', 'b'] as $index => $item) {
    echo $index, $item;
  }
  echo "\\n";
  $n = 0;
  while ($n < 3) { $n++; }
  echo $n, "\\n";
  if ($n === 3 && $total === 15) { echo "both\\n"; }
  echo $n > 2 ? "big" : "small", "\\n";
}`,
    out: "15\n0a1b\n3\nboth\nbig\n",
  },
  {
    name: "functions, defaults, recursion, closures",
    code: `<?hh
function add(int $a, int $b = 10): int {
  return $a + $b;
}

function fact(int $n): int {
  return $n <= 1 ? 1 : $n * fact($n - 1);
}

function main(): void {
  echo add(1), " ", add(1, 2), "\\n";
  echo fact(5), "\\n";
  $square = ($x) ==> $x * $x;
  echo $square(7), "\\n";
  echo Vec\\map(vec[1, 2, 3], $x ==> $x + 1)->count(), "\\n";
  $add = function ($a, $b) { return $a . "-" . $b; };
  echo $add("x", "y"), "\\n";
}`,
    out: "11 3\n120\n49\n3\nx-y\n",
  },
  {
    name: "classes, inheritance, interfaces",
    code: `<?hh
interface Shape {
  public function area(): float;
}

abstract class Base implements Shape {
  public function __construct(protected string $name) {}
  public function describe(): string {
    return $this->name . " = " . $this->area();
  }
}

class Square extends Base {
  public function __construct(private float $side) {
    parent::__construct("square");
  }
  public function area(): float {
    return $this->side * $this->side;
  }
}

function main(): void {
  $s = new Square(3.0);
  echo $s->describe(), "\\n";
  echo $s instanceof Shape ? "shape" : "not shape", "\\n";
  echo $s instanceof Base ? "base" : "no", "\\n";
}`,
    out: "square = 9\nshape\nbase\n",
  },
  {
    name: "enums and switch",
    code: `<?hh
enum Color: string {
  Red = 'red';
  Green = 'green';
}

function paint(Color $c): string {
  switch ($c) {
    case Color::Red:
      return "warm";
    default:
      return "cool";
  }
}

function main(): void {
  echo Color::Red, "\\n";
  echo paint(Color::Red), "\\n";
  echo paint(Color::Green), "\\n";
}`,
    out: "red\nwarm\ncool\n",
  },
  {
    name: "shapes, tuples, sorting",
    code: `<?hh
function main(): void {
  $p = shape('x' => 1, 'y' => 2);
  echo $p['x'] + $p['y'], "\\n";
  $nums = Vec\\sort(vec[3, 1, 2]);
  echo implode(",", $nums), "\\n";
  $sorted = Vec\\map($nums, $n ==> $n * 10);
  echo implode(",", $sorted), "\\n";
}`,
    out: "3\n1,2,3\n10,20,30\n",
  },
  {
    name: "null safety",
    code: `<?hh
function greet(?string $name): string {
  return "hi " . ($name ?? "anon");
}

function main(): void {
  echo greet(null), "\\n";
  echo greet("kim"), "\\n";
  $d = dict['k' => 1];
  echo $d['missing'] ?? "default", "\\n";
}`,
    out: "hi anon\nhi kim\ndefault\n",
  },
  {
    name: "runtime error reports the line",
    code: `<?hh
function main(): void {
  echo "before\\n";
  $v = vec[1];
  echo $v[5];
}`,
    out: "before\n",
    error: /Index out of bounds/,
    line: 5,
  },
  {
    name: "type error at runtime",
    code: `<?hh
function takes_int(int $x): int { return $x; }
function main(): void {
  echo "ok\\n";
}`,
    out: "ok\n",
  },
  {
    name: "guardrails stop runaway loops",
    code: `<?hh
function main(): void {
  while (true) {}
}`,
    stop: /steps/,
  },
  {
    name: "vec and dict are value types",
    code: `<?hh
function add_one(vec<int> $v): void {
  $v[] = 9;
}

function main(): void {
  $x = vec[1, 2];
  $y = $x;
  $y[] = 3;
  echo count($x), "/", count($y), "\\n";
  add_one($x);
  echo count($x), "\\n";
  $d = dict["a" => 1];
  $e = $d;
  $e["b"] = 2;
  echo count($d), "/", count($e);
}`,
    out: "2/3\n2\n1/2",
  },
  {
    name: "match expressions",
    code: `<?hh
function label(int $n): string {
  return match ($n) { 1, 2 => "small", 3 => "medium", default => "large" };
}

function main(): void {
  foreach (vec[1, 3, 9] as $n) {
    echo label($n), " ";
  }
}`,
    out: "small medium large ",
  },
  {
    name: "two-parameter arrow functions",
    code: `<?hh
use namespace HH\\Lib\\Vec;

function main(): void {
  $f = ($a, $b) ==> $a * $b;
  echo $f(3, 4), "\\n";
  echo Vec\\reduce(vec[1, 2, 3], ($acc, $n) ==> $acc + $n, 0), "\\n";
}`,
    out: "12\n6\n",
  },
  {
    name: "generators collected by foreach",
    code: `<?hh
function squares(): Generator<int, int, void> {
  foreach (vec[1, 2, 3] as $v) {
    yield $v * $v;
  }
}

function main(): void {
  foreach (squares() as $s) {
    echo $s, ",";
  }
}`,
    out: "1,4,9,",
  },
  {
    name: "self and parent inside a class",
    code: `<?hh
class Counter {
  const int STEP = 1;
  public static int $n = 0;
  public static function bump(): int {
    self::$n = self::$n + self::STEP;
    return self::$n;
  }
}

class LoudCounter extends Counter {
  public static function bump(): int {
    return parent::bump() * 10;
  }
}

function main(): void {
  echo Counter::bump(), " ", LoudCounter::bump();
}`,
    out: "1 20",
  },
  {
    name: "inout parameters write back",
    code: `<?hh
function bump(inout int $n): void {
  $n++;
}

function main(): void {
  $x = 1;
  bump(inout $x);
  bump(inout $x);
  echo $x;
}`,
    out: "3",
  },
  {
    name: "variadic parameters and tuples",
    code: `<?hh
function total(int ...$ns): int {
  $sum = 0;
  foreach ($ns as $n) $sum += $n;
  return $sum;
}

function main(): void {
  echo total(1, 2, 3), "\\n";
  $t = tuple("a", 2);
  echo $t[0], $t[1];
}`,
    out: "6\na2",
  },
  {
    name: "heredoc with space after <<<",
    code: `<?hh
function main(): void {
  $var = 42;
  $s = <<<   ID
Wow, look at this text! $var
ID;
  echo $s;
}`,
    out: "Wow, look at this text! 42",
  },
];

const only = process.argv.includes("--manual");
let failures = 0;

if (!only) {
  for (const testCase of CASES) {
    const result = runHack(testCase.code, { maxSteps: 200000 });
    const problems = [];
    if (testCase.out !== undefined && result.output !== testCase.out) {
      problems.push(`output\n     expected ${JSON.stringify(testCase.out)}\n     actual   ${JSON.stringify(result.output)}`);
    }
    if (testCase.error && !(result.error && testCase.error.test(result.error.message))) {
      problems.push(`expected an error matching ${testCase.error}, got ${result.error ? result.error.message : "none"}`);
    }
    if (testCase.line && result.error && result.error.line !== testCase.line) {
      problems.push(`expected the error on line ${testCase.line}, got ${result.error.line}`);
    }
    if (testCase.stop && !/steps|depth/i.test(result.error ? result.error.message : "")) {
      problems.push(`expected the guardrail to stop the run, got ${result.error ? result.error.message : "a clean exit"}`);
    }
    if (!testCase.error && !testCase.stop && !result.ok) {
      problems.push(`unexpected error on line ${result.error.line}: ${result.error.message}`);
    }
    if (problems.length) {
      failures += 1;
      console.log(`FAIL  ${testCase.name}`);
      for (const problem of problems) console.log(`   ${problem}`);
    } else {
      console.log(`ok    ${testCase.name}`);
    }
  }
}

// Every fenced Hack snippet in the manual is parsed (not run): the playground
// can open any of them without a syntax surprise.
if (process.argv.includes("--manual")) {
  const manual = path.join(ROOT, "hphp/hack/manual");
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.md$/.test(entry.name)) files.push(full);
    }
  };
  walk(path.join(manual, "hack"));
  walk(path.join(manual, "hhvm"));

  let snippets = 0;
  let parsed = 0;
  const failuresByFirstWord = new Map();
  for (const file of files) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(/```(\w*)\n([\s\S]*?)```/g)) {
      const lang = match[1].toLowerCase();
      if (lang && !["hack", "php", "hh"].includes(lang)) continue;
      const code = match[2];
      if (!/[;{}]/.test(code) || code.length < 24) continue;
      // Prose that happens to sit in a fenced block is not a program, and
      // neither is a fragment: no page of the manual is a program this small.
      if (/^(##|~~~|CREATE|ALTER|INSERT|SELECT|\$ hh|\$ mkdir|\$ composer|\$ git|\$ apt|\$ brew)/m.test(code.trim())) continue;
      if (code.split("\n").filter((line) => line.trim()).length < 3) continue;
      snippets += 1;
      const fitted = /\bEntryPoint\b|function\s+main\s*\(/.test(code) ? code : code;
      const result = runHack(fitted, { maxSteps: 400000, noEntryPoint: true });
      // Running is not the goal; a parse error is what we count.
      const parseError = result.error && /expected|unexpected|unterminated|Unexpected/i.test(result.error.message);
      if (!parseError) {
        parsed += 1;
        continue;
      }
      const firstWord = (code.trim().split(/[\s(]/)[0] || "").slice(0, 24);
      const bucket = failuresByFirstWord.get(firstWord) || { count: 0, sample: null };
      bucket.count += 1;
      bucket.sample = bucket.sample || `${path.relative(ROOT, file)}:${result.error.line}\n    ${result.error.message}`;
      failuresByFirstWord.set(firstWord, bucket);
    }
  }

  console.log(`\nmanual snippets: ${parsed}/${snippets} parsed`);
  const buckets = [...failuresByFirstWord.entries()].sort((a, b) => b[1].count - a[1].count);
  for (const [word, bucket] of buckets.slice(0, 15)) {
    console.log(`  ${String(bucket.count).padStart(3)}× ${word}`);
  }
  if (buckets.length) console.log(`  first: ${buckets[0][1].sample}`);
}

if (failures) {
  console.log(`\n${failures} case(s) failed`);
  process.exit(1);
}
console.log("\nall cases pass");
