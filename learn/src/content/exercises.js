// Playground exercises. Every task is a small program the interpreter can run,
// and every task is graded by running it: `checks` hold the expected stdout or
// a regular expression the output must match, so nothing is a keyword quiz.
//
// The topics follow the manual's own chapters, and `lesson` links a task back
// to the page it practises.

const task = (id, level, title, chapter, lesson, instructions, checks, starter, solution, hint) => ({
  id,
  level, // 1 easy, 2 medium, 3 hard
  title,
  chapter,
  lesson,
  instructions,
  checks,
  starter,
  solution,
  hint,
});

export const EXERCISES = [
  task(
    "hello",
    1,
    "Hello và echo",
    "getting-started",
    "hack/getting-started/quick-start",
    {
      vi: "In ra đúng một dòng `Hello, Hack!`. Dùng `echo` và nhớ ký tự xuống dòng `\\n`.",
      en: "Print exactly one line, `Hello, Hack!`. Use `echo` and end it with `\\n`.",
    },
    [{ expect: "Hello, Hack!\n" }],
    `<?hh
<<__EntryPoint>>
function main(): void {
  // Viết lệnh echo ở đây
}
`,
    `<?hh
<<__EntryPoint>>
function main(): void {
  echo "Hello, Hack!\\n";
}
`,
    { vi: "Chuỗi nằm trong nháy kép, và `\\n` là xuống dòng.", en: "The text goes in double quotes, and `\\n` is a newline." },
  ),
  task(
    "sum-loop",
    1,
    "Vòng lặp cộng dồn",
    "statements",
    "hack/statements/for",
    {
      vi: "Tính tổng các số từ 1 đến 10 bằng vòng lặp `for`, in ra `55`.",
      en: "Use a `for` loop to add the numbers 1 to 10, then print `55`.",
    },
    [{ expect: "55\n" }],
    `<?hh
<<__EntryPoint>>
function main(): void {
  $total = 0;
  for ($i = 1; $i <= 10; $i++) {
    // Cộng $i vào $total
  }
  echo $total, "\\n";
}
`,
    `<?hh
<<__EntryPoint>>
function main(): void {
  $total = 0;
  for ($i = 1; $i <= 10; $i++) {
    $total += $i;
  }
  echo $total, "\\n";
}
`,
    { vi: "`$total += $i;` là cách viết ngắn của `$total = $total + $i;`.", en: "`$total += $i;` is short for `$total = $total + $i;`." },
  ),
  task(
    "vec-pipeline",
    2,
    "Vec và closure",
    "arrays-and-collections",
    "hack/arrays-and-collections/vec-keyset-and-dict",
    {
      vi: "Với `$nums = vec[1, 2, 3, 4]`, dùng `Vec\\map` nhân đôi từng phần tử rồi in các số cách nhau bởi dấu phẩy trên một dòng: `2,4,6,8`.",
      en: "Given `$nums = vec[1, 2, 3, 4]`, use `Vec\\map` to double every item, then print them comma-separated on one line: `2,4,6,8`.",
    },
    [{ expect: "2,4,6,8\n" }],
    `<?hh
<<__EntryPoint>>
function main(): void {
  $nums = vec[1, 2, 3, 4];
  $doubled = $nums;
  echo implode(",", $doubled), "\\n";
}
`,
    `<?hh
<<__EntryPoint>>
function main(): void {
  $nums = vec[1, 2, 3, 4];
  $doubled = Vec\\map($nums, $n ==> $n * 2);
  echo implode(",", $doubled), "\\n";
}
`,
    { vi: "Closure viết bằng `==>`: `$n ==> $n * 2`.", en: "An arrow closure looks like `$n ==> $n * 2`." },
  ),
  task(
    "dict-count",
    2,
    "Đếm bằng dict",
    "arrays-and-collections",
    "hack/arrays-and-collections/vec-keyset-and-dict",
    {
      vi: "Đếm số lần xuất hiện của từng từ trong `vec['a', 'b', 'a', 'c', 'a']` và in theo thứ tự xuất hiện, mỗi dòng dạng `a: 3`.",
      en: "Count how often each word appears in `vec['a', 'b', 'a', 'c', 'a']` and print them in first-seen order, one `word: count` per line.",
    },
    [{ expect: "a: 3\nb: 1\nc: 1\n" }],
    `<?hh
<<__EntryPoint>>
function main(): void {
  $words = vec['a', 'b', 'a', 'c', 'a'];
  $counts = dict[];
  foreach ($words as $word) {
    // Cộng 1 vào $counts cho từng từ
  }
  foreach ($counts as $word => $count) {
    echo $word, ": ", $count, "\\n";
  }
}
`,
    `<?hh
<<__EntryPoint>>
function main(): void {
  $words = vec['a', 'b', 'a', 'c', 'a'];
  $counts = dict[];
  foreach ($words as $word) {
    $counts[$word] = ($counts[$word] ?? 0) + 1;
  }
  foreach ($counts as $word => $count) {
    echo $word, ": ", $count, "\\n";
  }
}
`,
    { vi: "`$counts[$word] ?? 0` cho 0 khi từ chưa có trong dict.", en: "`$counts[$word] ?? 0` yields 0 the first time a word appears." },
  ),
  task(
    "shape-access",
    2,
    "Shape và field",
    "built-in-types",
    "hack/built-in-types/shape",
    {
      vi: "Cho một shape có `'name'` và `'age'`, in ra `<name> is <age>` cho từng người trong `vec`.",
      en: "Given a shape with `'name'` and `'age'`, print `<name> is <age>` for each person in the `vec`.",
    },
    [{ expect: "Ada is 36\nAlan is 41\n" }],
    `<?hh
<<__EntryPoint>>
function main(): void {
  $people = vec[
    shape('name' => 'Ada', 'age' => 36),
    shape('name' => 'Alan', 'age' => 41),
  ];
  foreach ($people as $person) {
    // In tên và tuổi
  }
}
`,
    `<?hh
<<__EntryPoint>>
function main(): void {
  $people = vec[
    shape('name' => 'Ada', 'age' => 36),
    shape('name' => 'Alan', 'age' => 41),
  ];
  foreach ($people as $person) {
    echo $person['name'], " is ", $person['age'], "\\n";
  }
}
`,
    { vi: "Shape đọc như dict: `$person['name']`.", en: "A shape is read like a dict: `$person['name']`." },
  ),
  task(
    "class-closed",
    3,
    "Lớp có tài khoản",
    "classes",
    "hack/classes/constructors",
    {
      vi: "Viết lớp `Account` giữ `balance`, có `deposit(int $x)` và `withdraw(int $x)` (không cho âm). In số dư cuối cùng sau khi nạp 100 rồi rút 30: `70`.",
      en: "Write an `Account` class holding `balance`, with `deposit(int $x)` and `withdraw(int $x)` (never below zero). Print the final balance after depositing 100 and withdrawing 30: `70`.",
    },
    [{ expect: "70\n" }],
    `<?hh
<<__EntryPoint>>
function main(): void {
  $account = new Account(0);
  $account->deposit(100);
  $account->withdraw(30);
  echo $account->balance, "\\n";
}
`,
    `<?hh
class Account {
  public function __construct(public int $balance) {}

  public function deposit(int $amount): void {
    $this->balance += $amount;
  }

  public function withdraw(int $amount): void {
    $this->balance = $this->balance < $amount ? 0 : $this->balance - $amount;
  }
}

<<__EntryPoint>>
function main(): void {
  $account = new Account(0);
  $account->deposit(100);
  $account->withdraw(30);
  echo $account->balance, "\\n";
}
`,
    {
      vi: "`public int $balance` trong `__construct` vừa là tham số vừa là thuộc tính (property promotion).",
      en: "`public int $balance` in `__construct` declares the property as it sets it (promotion).",
    },
  ),
  task(
    "enum-switch",
    3,
    "Enum và switch",
    "built-in-types",
    "hack/built-in-types/enum",
    {
      vi: "Khai báo `enum Status: string { Pending = 'pending'; Done = 'done'; }`, rồi in nhãn tiếng Việt cho từng giá trị: `pending → chờ`, `done → xong`.",
      en: "Declare `enum Status: string { Pending = 'pending'; Done = 'done'; }`, then print a label for each value: `pending → wait`, `done → finished`.",
    },
    [{ expect: "pending: chờ\ndone: xong\n" }],
    `<?hh
enum Status: string {
  Pending = 'pending';
  Done = 'done';
}

function label(Status $status): string {
  switch ($status) {
    // Trả về nhãn
  }
}

<<__EntryPoint>>
function main(): void {
  foreach (vec[Status::Pending, Status::Done] as $status) {
    echo $status, ": ", label($status), "\\n";
  }
}
`,
    `<?hh
enum Status: string {
  Pending = 'pending';
  Done = 'done';
}

function label(Status $status): string {
  switch ($status) {
    case Status::Pending:
      return "chờ";
    case Status::Done:
      return "xong";
    default:
      return "?";
  }
}

<<__EntryPoint>>
function main(): void {
  foreach (vec[Status::Pending, Status::Done] as $status) {
    echo $status, ": ", label($status), "\\n";
  }
}
`,
    { vi: "Enum có giá trị nền `string` nên in ra chính chuỗi `'pending'`.", en: "A string-backed enum prints its string value." },
  ),
  task(
    "factorial",
    2,
    "Đệ quy",
    "functions",
    "hack/functions/introduction",
    {
      vi: "Viết `factorial(int $n): int` đệ quy, in `factorial(5)` → `120`.",
      en: "Write a recursive `factorial(int $n): int` and print `factorial(5)` → `120`.",
    },
    [{ expect: "120\n" }],
    `<?hh
function factorial(int $n): int {
  // Điều kiện dừng và bước đệ quy
}

<<__EntryPoint>>
function main(): void {
  echo factorial(5), "\\n";
}
`,
    `<?hh
function factorial(int $n): int {
  if ($n <= 1) {
    return 1;
  }
  return $n * factorial($n - 1);
}

<<__EntryPoint>>
function main(): void {
  echo factorial(5), "\\n";
}
`,
    { vi: "`0!` và `1!` đều bằng 1.", en: "Both `0!` and `1!` are 1." },
  ),
  task(
    "nullable",
    2,
    "Nullable và `??`",
    "types",
    "hack/types/nullable-types",
    {
      vi: "Viết `function greeting(?string $name): string` trả về `hi <name>`, và `hi guest` khi tên là `null`.",
      en: "Write `function greeting(?string $name): string` returning `hi <name>`, and `hi guest` when the name is `null`.",
    },
    [{ expect: "hi Ada\nhi guest\n" }],
    `<?hh
function greeting(?string $name): string {
  // Dùng ?? để thay tên khi null
}

<<__EntryPoint>>
function main(): void {
  echo greeting("Ada"), "\\n";
  echo greeting(null), "\\n";
}
`,
    `<?hh
function greeting(?string $name): string {
  return "hi " . ($name ?? "guest");
}

<<__EntryPoint>>
function main(): void {
  echo greeting("Ada"), "\\n";
  echo greeting(null), "\\n";
}
`,
    { vi: "`$name ?? \"guest\"` trả `guest` khi `$name` là null.", en: "`$name ?? \"guest\"` yields `guest` when `$name` is null." },
  ),
  task(
    "readonly",
    3,
    "Readonly và bất biến",
    "readonly",
    "hack/readonly/introduction",
    {
      vi: "Tạo `readonly class Money` giữ `amount` và `currency`, cộng hai đối tượng bằng method `plus(Money $other): Money` (cùng currency). In `150 USD`.",
      en: "Make a `readonly class Money` holding `amount` and `currency`, add two objects with `plus(Money $other): Money` (same currency). Print `150 USD`.",
    },
    [{ expect: "150 USD\n" }],
    `<?hh
readonly class Money {
  public function __construct(public int $amount, public string $currency) {}

  public function plus(Money $other): Money {
    // Trả về đối tượng Money mới
  }
}

<<__EntryPoint>>
function main(): void {
  $a = new Money(100, "USD");
  $b = new Money(50, "USD");
  $sum = $a->plus($b);
  echo $sum->amount, " ", $sum->currency, "\\n";
}
`,
    `<?hh
readonly class Money {
  public function __construct(public int $amount, public string $currency) {}

  public function plus(Money $other): Money {
    return new Money($this->amount + $other->amount, $this->currency);
  }
}

<<__EntryPoint>>
function main(): void {
  $a = new Money(100, "USD");
  $b = new Money(50, "USD");
  $sum = $a->plus($b);
  echo $sum->amount, " ", $sum->currency, "\\n";
}
`,
    {
      vi: "Readonly nghĩa là không sửa thuộc tính sau khi tạo: tạo đối tượng mới thay vì sửa.",
      en: "Readonly means properties never change: build a new object instead of mutating.",
    },
  ),
  task(
    "pipe",
    3,
    "Pipe và xử lý chuỗi",
    "expressions-and-operators",
    "hack/expressions-and-operators/pipe",
    {
      vi: "Dùng `|>` để đưa `'  Hack Lang  '` qua `Str\\trim`, `Str\\lower`, rồi `Str\\replace(' ', '-')`, in ra `hack-lang`.",
      en: "Use `|>` to pass `'  Hack Lang  '` through `Str\\trim`, `Str\\lower`, then `Str\\replace(' ', '-')`, printing `hack-lang`.",
    },
    [{ expect: "hack-lang\n" }],
    `<?hh
<<__EntryPoint>>
function main(): void {
  $slug = "  Hack Lang  ";
  // Dùng |> để nối các bước
  echo $slug, "\\n";
}
`,
    `<?hh
<<__EntryPoint>>
function main(): void {
  $slug = "  Hack Lang  "
    |> Str\\trim($$)
    |> Str\\lower($$)
    |> Str\\replace($$, " ", "-");
  echo $slug, "\\n";
}
`,
    { vi: "Trong chuỗi pipe, `$$` là giá trị của bước trước.", en: "Inside a pipe chain, `$$` is the value from the previous step." },
  ),
  task(
    "exception",
    3,
    "Exception an toàn",
    "statements",
    "hack/statements/try",
    {
      vi: "Viết `divide(int $a, int $b): float` ném `Exception` khi `$b` bằng 0; bắt lỗi và in `cannot divide` thay vì làm sập chương trình.",
      en: "Write `divide(int $a, int $b): float` that throws `Exception` when `$b` is zero; catch it and print `cannot divide` instead of crashing.",
    },
    [{ expect: "5\ncannot divide\n" }],
    `<?hh
function divide(int $a, int $b): float {
  // Ném lỗi khi $b = 0
  return $a / $b;
}

<<__EntryPoint>>
function main(): void {
  echo divide(10, 2), "\\n";
  try {
    echo divide(1, 0), "\\n";
  } catch (Exception $e) {
    // In thông báo
  }
}
`,
    `<?hh
function divide(int $a, int $b): float {
  if ($b === 0) {
    throw new Exception("cannot divide");
  }
  return $a / $b;
}

<<__EntryPoint>>
function main(): void {
  echo divide(10, 2), "\\n";
  try {
    echo divide(1, 0), "\\n";
  } catch (Exception $e) {
    echo $e->getMessage(), "\\n";
  }
}
`,
    { vi: "`new Exception(\"…\")` và `$e->getMessage()` là đủ cho ví dụ này.", en: "`new Exception(\"…\")` and `$e->getMessage()` are all this needs." },
  ),
];

export const EXERCISE_LEVELS = { 1: "easy", 2: "medium", 3: "hard" };

// Runs one exercise's checks against the visitor's source.
// `run` takes Hack source and returns `{ ok, output, error }`.
export const checkExercise = (exercise, source, run) => {
  const result = run(source);
  const checks = exercise.checks.map((check) => {
    const actual = result.ok ? result.output : "";
    const passed =
      result.ok &&
      (check.expect !== undefined ? actual === check.expect : check.match ? new RegExp(check.match, "m").test(actual) : false);
    return { ...check, actual, passed };
  });
  return {
    ok: result.ok && checks.every((check) => check.passed),
    result,
    checks,
  };
};
