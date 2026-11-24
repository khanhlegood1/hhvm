// The question bank for the practice exam.
//
// Every question is written against a chapter of the manual and carries the
// lesson it comes from, so a wrong answer leads back to the page that explains
// it. Questions with `code` are run by the interpreter in this folder: the
// expected output is checked by `scripts/test-bank.mjs`, so a question cannot
// drift away from the behaviour of the code it shows.
//
// Kinds:
//   concept  one right option out of several
//   predict  read the snippet, choose the output
//   fill     complete the snippet with the right line
//   order    put the steps of a mechanism in order

const q = (entry) => entry;

export const BANK = [
  // ---------------------------------------------------------------- basics
  q({
    id: "echo-separators",
    chapter: "getting-started",
    lesson: "hack/getting-started/quick-start",
    kind: "predict",
    level: 1,
    text: { vi: "Chương trình in ra gì?", en: "What does this program print?" },
    code: `<?hh
function main(): void {
  echo "a", 1 + 2, "b";
}`,
    options: ["a3b", "a 3 b", "a1 + 2b", "a12b"],
    answer: 0,
    explanation: {
      vi: "`echo` nhận nhiều biểu thức, cách nhau bởi dấu phẩy, và in chúng liền nhau. Nó không thêm dấu cách hay xuống dòng.",
      en: "`echo` takes several comma-separated expressions and prints them with nothing in between. It adds no spaces and no newline.",
    },
  }),
  q({
    id: "interpolate-braces",
    chapter: "expressions-and-operators",
    lesson: "hack/expressions-and-operators/string-concatenation",
    kind: "predict",
    level: 1,
    text: { vi: "Kết quả của đoạn code sau?", en: "What does this snippet print?" },
    code: `<?hh
function main(): void {
  $user = "Ada";
  $n = 3;
  echo "Hi {$user}, you have $n messages\\n";
}`,
    options: ["Hi {$user}, you have 3 messages", "Hi Ada, you have 3 messages", "Hi $user, you have $n messages", "Hi Ada, you have $n messages"],
    answer: 1,
    explanation: {
      vi: "Trong chuỗi nháy kép, `$user` và `{$user}` đều được thay bằng giá trị; `{$...}` dùng khi biểu thức dài hơn một biến. Chuỗi nháy đơn thì không thay.",
      en: "In a double-quoted string both `$user` and `{$user}` are replaced by the value; braces are for longer expressions. Single quotes never interpolate.",
    },
  }),
  q({
    id: "division-dot",
    chapter: "expressions-and-operators",
    lesson: "hack/expressions-and-operators/arithmetic",
    kind: "predict",
    level: 2,
    text: { vi: "In ra gì?", en: "What is printed?" },
    code: `<?hh
function main(): void {
  echo 7 / 2, " ", 7 % 2, " ", 7 . 2;
}`,
    options: ["3.5 1 72", "3 1 72", "3.5 1 9", "3.5 0.5 72"],
    answer: 0,
    explanation: {
      vi: "`/` luôn cho số thực, `%` là phần dư nguyên, còn `.` là nối chuỗi nên `7 . 2` thành `\"72\"`.",
      en: "`/` always yields a float, `%` is the integer remainder, and `.` concatenates, so `7 . 2` is `\"72\"`.",
    },
  }),
  q({
    id: "strict-vs-loose",
    chapter: "expressions-and-operators",
    lesson: "hack/expressions-and-operators/equality",
    kind: "predict",
    level: 2,
    text: { vi: "Hai phép so sánh cho kết quả gì?", en: "What do the two comparisons give?" },
    code: `<?hh
function main(): void {
  $a = "1";
  $b = 1;
  echo $a == $b ? "loose" : "different", " ";
  echo $a === $b ? "strict" : "types differ";
}`,
    options: ["loose strict", "loose types differ", "different types differ", "different strict"],
    answer: 1,
    explanation: {
      vi: "`==` so sánh sau khi đổi kiểu nên `\"1\" == 1` đúng. `===` đòi cả kiểu nên chuỗi và số nguyên khác nhau.",
      en: "`==` compares after converting types, so `\"1\" == 1` holds. `===` also compares the type, so a string and an int differ.",
    },
  }),

  // ----------------------------------------------------------- collections
  q({
    id: "vec-keyset-dict",
    chapter: "arrays-and-collections",
    lesson: "hack/arrays-and-collections/vec-keyset-and-dict",
    kind: "concept",
    level: 1,
    text: {
      vi: "Cấu trúc nào giữ các giá trị **duy nhất**, không trùng lặp, và không gắn khoá riêng?",
      en: "Which collection holds **unique** values with no separate keys?",
    },
    options: ["`vec<T>`", "`dict<Tk, Tv>`", "`keyset<T>`", "`varray<T>`"],
    answer: 2,
    explanation: {
      vi: "`keyset` là tập hợp giá trị duy nhất. `vec` giữ thứ tự và cho phép trùng; `dict` gắn mỗi giá trị với một khoá.",
      en: "`keyset` is a set of unique values. `vec` keeps order and allows duplicates; `dict` pairs each value with a key.",
    },
  }),
  q({
    id: "append-vs-index",
    chapter: "arrays-and-collections",
    lesson: "hack/arrays-and-collections/mutating-values",
    kind: "predict",
    level: 1,
    text: { vi: "In ra gì?", en: "What is printed?" },
    code: `<?hh
function main(): void {
  $v = vec[1, 2, 3];
  $v[] = 4;
  echo count($v), " ", $v[0], $v[3];
}`,
    options: ["3 14", "4 14", "4 41", "3 41"],
    answer: 1,
    explanation: {
      vi: "`$v[] = 4` thêm vào cuối, nên vec có bốn phần tử; phần tử đầu là `1`, phần tử thứ tư là `4`.",
      en: "`$v[] = 4` appends, so the vec holds four items; the first is `1` and the fourth is `4`.",
    },
  }),
  q({
    id: "vec-out-of-bounds",
    chapter: "arrays-and-collections",
    lesson: "hack/arrays-and-collections/vec-keyset-and-dict",
    kind: "predict",
    level: 2,
    text: { vi: "Điều gì xảy ra khi chạy?", en: "What happens when this runs?" },
    code: `<?hh
function main(): void {
  $v = vec[10, 20];
  echo $v[2];
}`,
    runtime: "error",
    errorMatch: "Index out of bounds",
    options: [
      "In ra `null`",
      "In ra `0`",
      "Chương trình dừng với lỗi `Index out of bounds`",
      "HHVM tự thêm phần tử mới và in ra rỗng",
    ],
    answer: 2,
    explanation: {
      vi: "Đọc vec ngoài phạm vi là lỗi thời gian chạy trong Hack, không trả về null như PHP cũ.",
      en: "Reading a vec out of range is a runtime error in Hack; it does not return null the way old PHP did.",
    },
  }),
  q({
    id: "dict-missing-key",
    chapter: "arrays-and-collections",
    lesson: "hack/expressions-and-operators/coalesce",
    kind: "predict",
    level: 2,
    text: { vi: "In ra gì?", en: "What is printed?" },
    code: `<?hh
function main(): void {
  $d = dict['a' => 1];
  echo $d['a'] ?? 0, " ", $d['z'] ?? 0;
}`,
    options: ["1 0", "1 ", "1 null", "Lỗi: key z không tồn tại"],
    answer: 0,
    explanation: {
      vi: "Đọc khoá không tồn tại là lỗi, nhưng `??` chặn lỗi đó và trả về giá trị bên phải.",
      en: "Reading a missing key is an error, but `??` catches it and yields the right-hand value.",
    },
  }),
  q({
    id: "foreach-vec",
    chapter: "statements",
    lesson: "hack/statements/foreach",
    kind: "predict",
    level: 1,
    text: { vi: "Vòng lặp in ra gì?", en: "What does the loop print?" },
    code: `<?hh
function main(): void {
  foreach (vec['x', 'y'] as $i => $item) {
    echo $i, $item;
  }
}`,
    options: ["0x1y", "x0y1", "xy", "01"],
    answer: 0,
    explanation: {
      vi: "Với `vec`, khoá là chỉ số nguyên bắt đầu từ 0. `as $i => $item` lấy cả khoá và giá trị.",
      en: "For a `vec` the key is the integer index starting at 0. `as $i => $item` takes both key and value.",
    },
  }),

  // -------------------------------------------------------------- functions
  q({
    id: "default-arg",
    chapter: "functions",
    lesson: "hack/functions/introduction",
    kind: "predict",
    level: 1,
    text: { vi: "Hai lệnh gọi in ra gì?", en: "What do the two calls print?" },
    code: `<?hh
function greet(string $name, string $greeting = "Hi"): string {
  return $greeting . ", " . $name;
}

function main(): void {
  echo greet("Ada"), "|", greet("Ada", "Hello");
}`,
    options: ["Hi, Ada|Hello, Ada", "Hi, Ada|Hi, Ada", "Hello, Ada|Hello, Ada", "Lỗi thiếu tham số"],
    answer: 0,
    explanation: {
      vi: "Tham số có giá trị mặc định được bỏ qua khi gọi; giá trị thứ hai thay thế mặc định.",
      en: "A parameter with a default can be left out; the second call replaces the default.",
    },
  }),
  q({
    id: "arrow-closure",
    chapter: "functions",
    lesson: "hack/functions/anonymous-functions",
    kind: "predict",
    level: 2,
    text: { vi: "In ra gì?", en: "What is printed?" },
    code: `<?hh
function main(): void {
  $double = ($x) ==> $x * 2;
  echo $double(4), " ", Vec\\map(vec[1, 2], $x ==> $x + 10)[1];
}`,
    options: ["8 12", "8 11", "4 12", "8 2"],
    answer: 0,
    explanation: {
      vi: "Closure mũi tên `==>` là biểu thức, tự bắt biến bên ngoài; `Vec\\map` áp dụng cho từng phần tử, phần tử thứ hai là `12`.",
      en: "An `==>` closure is an expression that captures surrounding variables; `Vec\\map` applies it per item, and the second item becomes `12`.",
    },
  }),
  q({
    id: "recursion-base",
    chapter: "functions",
    lesson: "hack/functions/introduction",
    kind: "predict",
    level: 2,
    text: { vi: "Kết quả của `sum(3)`?", en: "What is `sum(3)`?" },
    code: `<?hh
function sum(int $n): int {
  if ($n === 0) {
    return 0;
  }
  return $n + sum($n - 1);
}

function main(): void {
  echo sum(3);
}`,
    options: ["6", "3", "0", "Vòng lặp vô hạn"],
    answer: 0,
    explanation: {
      vi: "`sum(3) = 3 + 2 + 1 + 0`. Điều kiện dừng ở `$n === 0` chặn đệ quy.",
      en: "`sum(3) = 3 + 2 + 1 + 0`. The base case at `$n === 0` stops the recursion.",
    },
  }),

  // ---------------------------------------------------------------- classes
  q({
    id: "promotion",
    chapter: "classes",
    lesson: "hack/classes/constructors",
    kind: "predict",
    level: 2,
    text: { vi: "In ra gì?", en: "What is printed?" },
    code: `<?hh
class Point {
  public function __construct(public int $x, public int $y) {}
}

function main(): void {
  $p = new Point(3, 4);
  echo $p->x + $p->y;
}`,
    options: ["7", "34", "0", "Lỗi: thuộc tính chưa khai báo"],
    answer: 0,
    explanation: {
      vi: "`public int $x` trong `__construct` vừa khai báo thuộc tính vừa gán giá trị tham số (constructor property promotion).",
      en: "`public int $x` in `__construct` declares the property and assigns the argument (constructor property promotion).",
    },
  }),
  q({
    id: "abstract-interface",
    chapter: "traits-and-interfaces",
    lesson: "hack/traits-and-interfaces/implementing-an-interface",
    kind: "concept",
    level: 2,
    text: {
      vi: "Điều gì **không** thể làm với một `interface` trong Hack?",
      en: "What can you **not** do with an `interface` in Hack?",
    },
    options: [
      "Khai báo method chỉ có chữ ký, không có thân",
      "Cho một lớp `implements` nhiều interface",
      "Tạo đối tượng trực tiếp bằng `new`",
      "Dùng interface làm kiểu tham số",
    ],
    answer: 2,
    explanation: {
      vi: "Interface chỉ là hợp đồng: không có thân method, không thể `new`. Phải có lớp cụ thể.",
      en: "An interface is a contract: it has no method bodies and cannot be instantiated with `new`. A concrete class is needed.",
    },
  }),
  q({
    id: "inheritance-parent",
    chapter: "classes",
    lesson: "hack/classes/inheritance",
    kind: "predict",
    level: 2,
    text: { vi: "In ra gì?", en: "What is printed?" },
    code: `<?hh
class Animal {
  public function __construct(protected string $name) {}
  public function speak(): string {
    return $this->name . " makes a sound";
  }
}

class Dog extends Animal {
  public function speak(): string {
    return $this->name . " barks";
  }
}

function main(): void {
  $a = new Animal("Cat");
  $d = new Dog("Rex");
  echo $a->speak(), " | ", $d->speak();
}`,
    options: [
      "Cat makes a sound | Rex barks",
      "Cat makes a sound | Rex makes a sound",
      "Cat barks | Rex barks",
      "Lỗi: Dog không khai báo __construct",
    ],
    answer: 0,
    explanation: {
      vi: "`Dog` thừa hưởng `__construct` của `Animal` và ghi đè `speak`, nên mỗi đối tượng dùng method của lớp mình.",
      en: "`Dog` inherits `Animal`'s constructor and overrides `speak`, so each object uses its own class's method.",
    },
  }),
  q({
    id: "instanceof",
    chapter: "classes",
    lesson: "hack/classes/inheritance",
    kind: "predict",
    level: 2,
    text: { vi: "Hai dòng in ra gì?", en: "What do the two lines print?" },
    code: `<?hh
interface Shape {}
class Square implements Shape {}

function main(): void {
  $s = new Square();
  echo $s instanceof Shape ? "yes" : "no", " ";
  echo $s instanceof Square ? "yes" : "no";
}`,
    options: ["yes yes", "yes no", "no yes", "no no"],
    answer: 0,
    explanation: {
      vi: "`instanceof` đúng với cả lớp thật và interface mà lớp đó hiện thực.",
      en: "`instanceof` is true for the class and for any interface the class implements.",
    },
  }),

  // ----------------------------------------------------------------- types
  q({
    id: "nullable-type",
    chapter: "types",
    lesson: "hack/types/nullable-types",
    kind: "concept",
    level: 1,
    text: { vi: "`?string` nghĩa là gì?", en: "What does `?string` mean?" },
    options: ["Chỉ chuỗi, không bao giờ null", "`string` hoặc `null`", "Chuỗi tuỳ chọn (optional) trong shape", "Một chuỗi rỗng"],
    answer: 1,
    explanation: {
      vi: "`?T` là viết tắt của `T | null`. Phải kiểm tra `null` trước khi dùng như `string`.",
      en: "`?T` is shorthand for `T | null`. Check for `null` before using the value as a `string`.",
    },
  }),
  q({
    id: "shape-optional",
    chapter: "built-in-types",
    lesson: "hack/built-in-types/shape",
    kind: "predict",
    level: 3,
    text: { vi: "In ra gì?", en: "What is printed?" },
    code: `<?hh
function main(): void {
  $p = shape('x' => 1, 'y' => 2);
  echo $p['x'], " ", $p['z'] ?? -1;
}`,
    options: ["1 -1", "1 null", "1 Lỗi", "Lỗi: shape không có khoá z"],
    answer: 0,
    explanation: {
      vi: "Shape đọc như dict. Khoá không có trong shape là lỗi khi đọc trực tiếp, nhưng `??` trả về `-1`.",
      en: "A shape reads like a dict. A missing field is an error when read directly, but `??` yields `-1`.",
    },
  }),
  q({
    id: "is-operator",
    chapter: "expressions-and-operators",
    lesson: "hack/expressions-and-operators/type-assertions",
    kind: "predict",
    level: 2,
    text: { vi: "In ra gì?", en: "What is printed?" },
    code: `<?hh
function main(): void {
  $x = 5;
  $y = 5.0;
  echo $x is int ? "int" : "other", " ";
  echo $y is float ? "float" : "other", " ";
  echo $y is num ? "num" : "other";
}`,
    options: ["int float num", "int int num", "int other other", "other float num"],
    answer: 0,
    explanation: {
      vi: "`is` kiểm tra kiểu lúc chạy. `5.0` là `float` chứ không phải `int`, nhưng cả hai đều là `num`.",
      en: "`is` checks the runtime type. `5.0` is a `float`, not an `int`, but both are `num`.",
    },
  }),
  q({
    id: "enum-value",
    chapter: "built-in-types",
    lesson: "hack/built-in-types/enum",
    kind: "predict",
    level: 2,
    text: { vi: "In ra gì?", en: "What is printed?" },
    code: `<?hh
enum Color: string {
  Red = 'red';
  Green = 'green';
}

function main(): void {
  echo Color::Red, " ", Color::Green;
}`,
    options: ["Red Green", "red green", "Color::Red Color::Green", "0 1"],
    answer: 1,
    explanation: {
      vi: "Với enum có nền `string`, `Color::Red` là chính chuỗi `'red'`, nên in ra chữ thường.",
      en: "For a string-backed enum, `Color::Red` is the string `'red'`, so the lowercase value prints.",
    },
  }),

  // ------------------------------------------------------------------ async
  q({
    id: "async-not-threads",
    chapter: "asynchronous-operations",
    lesson: "hack/asynchronous-operations/introduction",
    kind: "concept",
    level: 3,
    text: {
      vi: "Async trong HHVM có nghĩa là gì?",
      en: "What does async mean in HHVM?",
    },
    options: [
      "Chạy song song trên nhiều luồng CPU",
      "Một luồng chính, I/O không chặn, các tác vụ xen kẽ nhau",
      "Tự động biến mọi hàm blocking thành không chặn",
      "Chỉ là cú pháp cho callback",
    ],
    answer: 1,
    explanation: {
      vi: "Manual nói rõ: async **không phải** multithreading. Mọi code chạy trên luồng chính; chỉ I/O không chặn. Hàm blocking như `sleep()` không tự đổi.",
      en: "The manual is explicit: async is **not** multithreading. Code runs on the main thread; only I/O does not block. Blocking calls such as `sleep()` are not converted.",
    },
  }),
  q({
    id: "async-syntax",
    chapter: "asynchronous-operations",
    lesson: "hack/asynchronous-operations/awaitables",
    kind: "fill",
    level: 2,
    text: {
      vi: "Điền từ khoá còn thiếu để lấy kết quả từ một `Awaitable`.",
      en: "Fill in the missing keyword that takes the result out of an `Awaitable`.",
    },
    code: `async function fetchIt(): Awaitable<int> {
  return 41;
}

async function main(): Promise<void> {
  $value = ____ fetchIt();
  echo $value + 1;
}`,
    options: ["await", "yield", "async", "return"],
    answer: 0,
    explanation: {
      vi: "`await` lấy giá trị từ `Awaitable`. Bên trong `async` function, nó tạm dừng hàm đó chứ không chặn VM.",
      en: "`await` takes the value out of an `Awaitable`. Inside an `async` function it suspends that function, not the VM.",
    },
  }),

  // --------------------------------------------------------------- generics
  q({
    id: "generics-bound",
    chapter: "generics",
    lesson: "hack/generics/type-constraints",
    kind: "concept",
    level: 3,
    text: { vi: "`function maxOf<T as num>(T $a, T $b): T` cho biết gì về `T`?", en: "What does `function maxOf<T as num>(T $a, T $b): T` say about `T`?" },
    options: [
      "`T` chỉ có thể là `int`",
      "`T` phải là `num` hoặc kiểu con của `num`, ví dụ `int` hay `float`",
      "`T` không bị ràng buộc gì",
      "`T` chỉ dùng ở kiểu trả về",
    ],
    answer: 1,
    explanation: {
      vi: "`as num` là ràng buộc (constraint): mọi kiểu truyền vào phải là `num` hoặc kiểu con, nhờ vậy thân hàm được dùng phép toán số học.",
      en: "`as num` is a constraint: whatever fills `T` must be `num` or a subtype, which is what lets the body use arithmetic.",
    },
  }),
  q({
    id: "variance",
    chapter: "generics",
    lesson: "hack/generics/variance",
    kind: "concept",
    level: 3,
    text: { vi: "Trong `interface Collection<+T>`, dấu `+` nghĩa là gì?", en: "In `interface Collection<+T>`, what does `+` mean?" },
    options: [
      "Hiệp biến (covariant): `Collection<Dog>` là kiểu con của `Collection<Animal>`",
      "Nghịch biến (contravariant)",
      "Bất biến (invariant)",
      "Chỉ để đọc, không dùng được trong code",
    ],
    answer: 0,
    explanation: {
      vi: "`+T` là hiệp biến; `-T` là nghịch biến; không dấu là bất biến. Hiệp biến cho phép dùng collection của kiểu con ở chỗ cần kiểu cha.",
      en: "`+T` is covariant, `-T` contravariant, and no sign is invariant. Covariance lets a collection of a subtype stand in for one of a supertype.",
    },
  }),

  // ------------------------------------------------------------------- XHP
  q({
    id: "xhp-basics",
    chapter: "XHP",
    lesson: "hack/XHP/introduction",
    kind: "concept",
    level: 3,
    text: { vi: "XHP dùng để làm gì?", en: "What is XHP for?" },
    options: [
      "Tạo HTML an toàn, có thể ghép như giá trị",
      "Định nghĩa route cho webserver",
      "Chuyển đổi giữa các kiểu số",
      "Tạo migration cho database",
    ],
    answer: 0,
    explanation: {
      vi: "XHP là cú pháp HTML trong Hack: `$x = <div class=\"a\">hi</div>;`, ghép và lồng được, và tự escape khi in.",
      en: "XHP is HTML syntax inside Hack: `$x = <div class=\"a\">hi</div>;`. It composes and nests, and escapes on render.",
    },
  }),

  // ---------------------------------------------------------------- HHVM
  q({
    id: "hhvm-modes",
    chapter: "basic-usage",
    lesson: "hhvm/basic-usage/introduction",
    kind: "concept",
    level: 1,
    text: { vi: "Hai cách chạy HHVM được manual nêu đầu tiên là gì?", en: "Which two ways of running HHVM does the manual name first?" },
    options: [
      "CLI và server",
      "Server và debugger",
      "CLI và REPL",
      "Docker và CLI",
    ],
    answer: 0,
    explanation: {
      vi: "Phần lớn trường hợp là chạy script ở chế độ CLI, hoặc chạy server để phục vụ request web (Proxygen hay FastCGI).",
      en: "Most use is either running a script in CLI mode or running a server that answers web requests (Proxygen or FastCGI).",
    },
  }),
  q({
    id: "hhvm-config",
    chapter: "configuration",
    lesson: "hhvm/configuration/introduction",
    kind: "concept",
    level: 2,
    text: { vi: "HHVM đọc file cấu hình nào theo mặc định?", en: "Which configuration files does HHVM read by default?" },
    options: [
      "`php.ini` cho CLI và `server.ini` cho server",
      "`hhvm.json` cho cả hai",
      "`.hhconfig` cho cả hai",
      "`config.toml` và `hhvm.yml`",
    ],
    answer: 0,
    explanation: {
      vi: "Manual nêu `php.ini` cho CLI và `server.ini` cho server, thường ở `/etc/hhvm/` trên Linux.",
      en: "The manual names `php.ini` for CLI and `server.ini` for server, normally in `/etc/hhvm/` on Linux.",
    },
  }),
  q({
    id: "hhconfig",
    chapter: "getting-started",
    lesson: "hack/getting-started/quick-start",
    kind: "concept",
    level: 2,
    text: { vi: "File nào đánh dấu gốc của một project Hack?", en: "Which file marks the root of a Hack project?" },
    options: ["`.hhconfig`", "`hhvm.ini`", "`hack.json`", "`composer.json`"],
    answer: 0,
    explanation: {
      vi: "Tạo `.hhconfig` ở thư mục gốc; type checker và LSP dùng nó để biết project bắt đầu từ đâu.",
      en: "Create `.hhconfig` at the project root; the type checker and the LSP use it to know where the project starts.",
    },
  }),

  // ------------------------------------------------------------- pipelines
  q({
    id: "pipe-operator",
    chapter: "expressions-and-operators",
    lesson: "hack/expressions-and-operators/pipe",
    kind: "predict",
    level: 3,
    text: { vi: "In ra gì?", en: "What is printed?" },
    code: `<?hh
function main(): void {
  $r = vec[1, 2, 3]
    |> Vec\\map($$, $x ==> $x * 3)
    |> Vec\\filter($$, $x ==> $x > 3);
  echo implode(",", $r);
}`,
    options: ["3,6,9", "6,9", "6", "1,2,3"],
    answer: 1,
    explanation: {
      vi: "`$$` nhận giá trị của bước trước. Nhân ba được `3, 6, 9`; lọc lớn hơn 3 còn `6, 9`.",
      en: "`$$` carries the previous value. Tripling gives `3, 6, 9`; keeping what is above 3 leaves `6, 9`.",
    },
  }),
  q({
    id: "switch-fall",
    chapter: "statements",
    lesson: "hack/statements/switch",
    kind: "predict",
    level: 3,
    text: { vi: "In ra gì?", en: "What is printed?" },
    code: `<?hh
function main(): void {
  $x = 2;
  switch ($x) {
    case 1:
      echo "one";
      break;
    case 2:
      echo "two";
      break;
    default:
      echo "many";
  }
}`,
    options: ["two", "two many", "one", "many"],
    answer: 0,
    explanation: {
      vi: "`case 2` khớp và `break` kết thúc switch, nên `default` không chạy. Thiếu `break` sẽ rơi xuống nhánh sau.",
      en: "`case 2` matches and `break` leaves the switch, so `default` does not run. Without `break`, execution falls through.",
    },
  }),
  q({
    id: "try-finally",
    chapter: "statements",
    lesson: "hack/statements/try",
    kind: "predict",
    level: 3,
    text: { vi: "In ra gì?", en: "What is printed?" },
    code: `<?hh
function main(): void {
  try {
    throw new Exception("boom");
  } catch (Exception $e) {
    echo "caught " . $e->getMessage();
  } finally {
    echo " finally";
  }
}`,
    options: ["caught boom finally", "caught boom", "finally", "caught Exception finally"],
    answer: 0,
    explanation: {
      vi: "`catch` bắt lỗi và in thông báo; `finally` luôn chạy sau cùng, dù có lỗi hay không.",
      en: "`catch` handles the error and prints its message; `finally` always runs afterwards.",
    },
  }),
];

export const EXAM_KINDS = ["concept", "predict", "fill", "order"];
