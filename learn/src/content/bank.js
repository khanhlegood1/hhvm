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
  q({
    id: "q1-source-code-fundamentals",
    chapter: "source-code-fundamentals",
    lesson: "hack/source-code-fundamentals/scope",
    kind: "predict",
    level: 1,
    text: { vi: "Biến trong khối `{ }` có làm thay đổi biến bên ngoài không?", en: "Does a variable assigned inside a `{ }` block change the outer one?" },
    code: `<?hh
function main(): void {
  $x = 10;
  {
    $x = 20;
  }
  echo $x;
}`,
    options: ["20","10","0","Lỗi: $x không tồn tại"],
    answer: 0,
    explanation: {
      vi: "Hack không có scope theo khối: `{ }` chỉ nhóm lệnh, không tạo biến mới. Phép gán thứ hai sửa chính `$x` của hàm.",
      en: "Hack has no block scope: `{ }` only groups statements. The second assignment writes the same `$x`.",
    },
  }),
  q({
    id: "q2-source-code-fundamentals-constants",
    chapter: "source-code-fundamentals",
    lesson: "hack/source-code-fundamentals/constants",
    kind: "concept",
    level: 2,
    text: { vi: "Hằng số khai báo bằng `const` khác biến ở điểm nào?", en: "How is a constant declared with `const` different from a variable?" },
    options: ["Phải gán một lần, không đổi được sau đó","Chỉ dùng được trong class","Không có kiểu","Chỉ tồn tại lúc biên dịch"],
    answer: 0,
    explanation: {
      vi: "`const` gán đúng một lần; đọc lại thì được, gán lại thì lỗi. Biến `$x` thì đổi được bất cứ lúc nào.",
      en: "A `const` is assigned once; reading it later is fine, assigning it again is an error. A `$x` variable can change at any time.",
    },
  }),
  q({
    id: "q3-statements",
    chapter: "statements",
    lesson: "hack/statements/switch",
    kind: "predict",
    level: 2,
    text: { vi: "Không có `break`, `switch` chạy tiếp thế nào?", en: "Without a `break`, how does `switch` continue?" },
    code: `<?hh
function main(): void {
  $n = 2;
  switch ($n) {
    case 1:
      echo "one ";
    case 2:
      echo "two ";
    case 3:
      echo "three ";
      break;
    default:
      echo "other";
  }
}`,
    options: ["two three ","two ","one two three ","other"],
    answer: 0,
    explanation: {
      vi: "`switch` rơi xuống các `case` phía sau cho tới khi gặp `break`. `case 2` khớp nên in `two `, rồi rơi tiếp vào `case 3`.",
      en: "`switch` falls through to the following cases until a `break`. `case 2` matches, prints `two `, then falls into `case 3`.",
    },
  }),
  q({
    id: "q4-statements",
    chapter: "statements",
    lesson: "hack/statements/do",
    kind: "predict",
    level: 1,
    text: { vi: "Vòng `do { } while` in ra gì?", en: "What does the `do { } while` loop print?" },
    code: `<?hh
function main(): void {
  $i = 0;
  do {
    $i++;
  } while ($i < 3);
  echo $i;
}`,
    options: ["3","2","0","Vòng lặp vô hạn"],
    answer: 0,
    explanation: {
      vi: "`do` chạy thân trước rồi mới kiểm tra điều kiện, nên `$i` tăng tới 3 rồi dừng.",
      en: "`do` runs the body before testing the condition, so `$i` climbs to 3 and stops.",
    },
  }),
  q({
    id: "q5-arrays-and-collections",
    chapter: "arrays-and-collections",
    lesson: "hack/arrays-and-collections/vec-keyset-and-dict",
    kind: "predict",
    level: 2,
    text: { vi: "`keyset` xử lý giá trị trùng thế nào?", en: "How does a `keyset` treat duplicates?" },
    code: `<?hh
function main(): void {
  $k = keyset[1, 1, 2];
  echo count($k);
}`,
    options: ["2","3","1","Lỗi: keyset không nhận số"],
    answer: 0,
    explanation: {
      vi: "`keyset` là tập hợp: mỗi giá trị chỉ giữ một lần, nên `1, 1, 2` còn hai phần tử.",
      en: "A `keyset` is a set: each value is kept once, so `1, 1, 2` has two members.",
    },
  }),
  q({
    id: "q6-arrays-and-collections",
    chapter: "arrays-and-collections",
    lesson: "hack/arrays-and-collections/vec-keyset-and-dict",
    kind: "predict",
    level: 2,
    text: { vi: "Duyệt `dict` bằng `foreach` cho ra gì?", en: "What does iterating a `dict` with `foreach` give you?" },
    code: `<?hh
function main(): void {
  $d = dict["a" => 1, "b" => 2];
  $out = "";
  foreach ($d as $k => $v) {
    $out .= $k . $v;
  }
  echo $out;
}`,
    options: ["a1b2","ab12","12ab","a1 b2"],
    answer: 0,
    explanation: {
      vi: "`foreach ($d as $k => $v)` lần lượt đi qua từng cặp khoá–giá trị theo thứ tự chèn, nên `a1` rồi `b2`.",
      en: "`foreach ($d as $k => $v)` walks key/value pairs in insertion order: `a1`, then `b2`.",
    },
  }),
  q({
    id: "q7-arrays-and-collections",
    chapter: "arrays-and-collections",
    lesson: "hack/arrays-and-collections/vec-keyset-and-dict",
    kind: "concept",
    level: 2,
    text: { vi: "Gán `$y = $x` với `$x` là `vec` thì điều gì xảy ra khi sửa `$y`?", en: "With `$x` a `vec`, what happens to `$x` when you modify `$y = $x`?" },
    code: `<?hh
function main(): void {
  $x = vec[1, 2];
  $y = $x;
  $y[] = 3;
  echo count($x);
}`,
    options: ["2","3","0","Lỗi: vec không gán được"],
    answer: 0,
    explanation: {
      vi: "`vec` là kiểu giá trị: phép gán sao chép. Thêm phần tử vào `$y` không đụng tới `$x`.",
      en: "`vec` is a value type: assignment copies. Appending to `$y` leaves `$x` alone.",
    },
  }),
  q({
    id: "q8-functions",
    chapter: "functions",
    lesson: "hack/functions/introduction",
    kind: "predict",
    level: 1,
    text: { vi: "Gọi hàm không truyền tham số có giá trị mặc định thì sao?", en: "What happens when a parameter with a default is omitted?" },
    code: `<?hh
function greet(string $name = "world"): string {
  return "hi " . $name;
}
function main(): void {
  echo greet();
}`,
    options: ["hi world","hi ","Lỗi: thiếu tham số","hi null"],
    answer: 0,
    explanation: {
      vi: "Tham số có giá trị mặc định được phép bỏ qua; hàm nhận `\"world\"`.",
      en: "A parameter with a default may be left out; the function receives `\"world\"`.",
    },
  }),
  q({
    id: "q9-functions",
    chapter: "functions",
    lesson: "hack/functions/introduction",
    kind: "predict",
    level: 2,
    text: { vi: "Tham số `...$ns` nhận gì?", en: "What does a `...$ns` parameter receive?" },
    code: `<?hh
function total(int ...$ns): int {
  $sum = 0;
  foreach ($ns as $n) $sum += $n;
  return $sum;
}
function main(): void {
  echo total(1, 2, 3);
}`,
    options: ["6","3","1","Lỗi: quá nhiều tham số"],
    answer: 0,
    explanation: {
      vi: "`...$ns` gom mọi đối số còn lại thành một `vec<int>`, nên `$ns` là `vec[1, 2, 3]` và tổng là 6.",
      en: "`...$ns` collects the remaining arguments into a `vec<int>`, so `$ns` is `vec[1, 2, 3]` and the sum is 6.",
    },
  }),
  q({
    id: "q10-classes",
    chapter: "classes",
    lesson: "hack/classes/methods",
    kind: "predict",
    level: 2,
    text: { vi: "Thuộc tính static giữ giá trị giữa các lần gọi không?", en: "Does a static property keep its value between calls?" },
    code: `<?hh
class Counter {
  public static int $n = 0;
  public static function bump(): int {
    return ++self::$n;
  }
}
function main(): void {
  Counter::bump();
  echo Counter::bump();
}`,
    options: ["2","1","0","Lỗi: self không dùng được"],
    answer: 0,
    explanation: {
      vi: "Thuộc tính static thuộc về lớp, không thuộc về đối tượng: lần gọi thứ hai thấy `$n` đã là 1 nên trả về 2.",
      en: "A static property belongs to the class, not an object: the second call sees `$n` already at 1 and returns 2.",
    },
  }),
  q({
    id: "q11-classes",
    chapter: "classes",
    lesson: "hack/classes/inheritance",
    kind: "predict",
    level: 2,
    text: { vi: "Lớp con của lớp `abstract` phải làm gì?", en: "What must a subclass of an `abstract` class do?" },
    code: `<?hh
abstract class Shape {
  abstract public function area(): float;
}
class Square extends Shape {
  public function __construct(private float $side) {}
  public function area(): float { return $this->side * $this->side; }
}
function main(): void {
  $s = new Square(3.0);
  echo $s->area();
}`,
    options: ["9","3","6","Lỗi: lớp abstract không tạo được"],
    answer: 0,
    explanation: {
      vi: "`Square` cài đặt `area()`, nên `new Square(3.0)` hợp lệ; 3×3 là 9. Lớp `abstract` không tạo trực tiếp được, nhưng lớp con cụ thể thì được.",
      en: "`Square` implements `area()`, so `new Square(3.0)` is allowed and 3×3 is 9. The abstract class itself cannot be instantiated, its concrete subclass can.",
    },
  }),
  q({
    id: "q12-traits-and-interfaces",
    chapter: "traits-and-interfaces",
    lesson: "hack/traits-and-interfaces/using-a-trait",
    kind: "predict",
    level: 1,
    text: { vi: "Trait đưa phương thức vào lớp thế nào?", en: "How does a trait put a method into a class?" },
    code: `<?hh
trait Says {
  public function say(): string { return "trait"; }
}
class Uses {
  use Says;
}
function main(): void {
  echo (new Uses())->say();
}`,
    options: ["trait","Lỗi: Uses không có say()","Says","rỗng"],
    answer: 0,
    explanation: {
      vi: "`use Says;` chép thân phương thức vào lớp, nên `Uses` có `say()` như thể tự viết.",
      en: "`use Says;` copies the method body into the class, so `Uses` has `say()` as if it had written it.",
    },
  }),
  q({
    id: "q13-traits-and-interfaces",
    chapter: "traits-and-interfaces",
    lesson: "hack/traits-and-interfaces/implementing-an-interface",
    kind: "concept",
    level: 2,
    text: { vi: "Interface khác trait ở điểm cốt lõi nào?", en: "What is the essential difference between an interface and a trait?" },
    options: ["Interface chỉ là hợp đồng, trait mang theo thân phương thức","Interface nhanh hơn","Trait chỉ dùng cho static","Không khác gì"],
    answer: 0,
    explanation: {
      vi: "Interface chỉ nói lớp phải có gì; trait cho mượn luôn phần cài đặt.",
      en: "An interface only states what a class must provide; a trait lends the implementation itself.",
    },
  }),
  q({
    id: "q14-generics",
    chapter: "generics",
    lesson: "hack/generics/introduction",
    kind: "predict",
    level: 1,
    text: { vi: "Hàm generic dưới đây trả về gì?", en: "What does this generic function return?" },
    code: `<?hh
function first<T>(vec<T> $v): ?T {
  return $v ? $v[0] : null;
}
function main(): void {
  echo first(vec["x", "y"]);
}`,
    options: ["x","y","null","Lỗi: T không xác định"],
    answer: 0,
    explanation: {
      vi: "`T` được suy ra từ đối số là `string`, và `$v[0]` là `\"x\"`.",
      en: "`T` is inferred as `string` from the argument, and `$v[0]` is `\"x\"`.",
    },
  }),
  q({
    id: "q15-readonly",
    chapter: "readonly",
    lesson: "hack/readonly/introduction",
    kind: "predict",
    level: 2,
    text: { vi: "Thuộc tính `readonly` đọc được không?", en: "Can a `readonly` property be read?" },
    code: `<?hh
class Point {
  public function __construct(public readonly int $x) {}
}
function main(): void {
  $p = new Point(4);
  echo $p->x;
}`,
    options: ["4","Lỗi: readonly không đọc được","0","null"],
    answer: 0,
    explanation: {
      vi: "`readonly` cấm ghi sau khi khởi tạo, không cấm đọc. `$p->x` vẫn là 4.",
      en: "`readonly` forbids writing after initialisation, not reading. `$p->x` is still 4.",
    },
  }),
  q({
    id: "q16-asynchronous-operations",
    chapter: "asynchronous-operations",
    lesson: "hack/asynchronous-operations/introduction",
    kind: "predict",
    level: 2,
    text: { vi: "`await` một `Awaitable` đã sẵn sàng cho ra gì?", en: "What does awaiting an `Awaitable` that is already done give you?" },
    code: `<?hh
async function answer(): Awaitable<int> {
  return 42;
}
<<__EntryPoint>>
async function main(): Awaitable<void> {
  $v = await answer();
  echo $v;
}`,
    options: ["42","Awaitable<int>","0","Lỗi: thiếu await"],
    answer: 0,
    explanation: {
      vi: "`async` bọc kết quả trong `Awaitable`; `await` mở nó ra, nên `$v` là `int` 42.",
      en: "`async` wraps the result in an `Awaitable`; `await` unwraps it, so `$v` is the `int` 42.",
    },
  }),
  q({
    id: "q17-statements",
    chapter: "statements",
    lesson: "hack/statements/try",
    kind: "predict",
    level: 2,
    text: { vi: "Khối `finally` chạy khi nào?", en: "When does a `finally` block run?" },
    code: `<?hh
function main(): void {
  try {
    echo "a";
  } finally {
    echo "b";
  }
}`,
    options: ["ab","a","b","Lỗi: thiếu catch"],
    answer: 0,
    explanation: {
      vi: "`finally` chạy sau `try`, dù có lỗi hay không; không bắt buộc phải có `catch`.",
      en: "`finally` runs after `try` whether or not anything was thrown; a `catch` is not required.",
    },
  }),
  q({
    id: "q18-",
    chapter: "XHP",
    lesson: "hack/XHP/introduction",
    kind: "concept",
    level: 3,
    text: { vi: "XHP giải quyết vấn đề gì?", en: "What problem does XHP solve?" },
    options: ["Dựng HTML bằng cú pháp XML có kiểm tra kiểu, thay vì nối chuỗi","Tăng tốc độ mạng","Quản lý gói Composer","Thay thế `async`"],
    answer: 0,
    explanation: {
      vi: "XHP cho phép viết thẻ như `<a href=\"…\">` ngay trong Hack; tag sai tên hoặc thiếu thuộc tính bắt được lúc chạy và lúc kiểm tra kiểu, thay vì lọt qua phép nối chuỗi.",
      en: "XHP lets you write tags such as `<a href=\"…\">` in Hack; wrong tags or missing attributes are caught by the typechecker and at runtime instead of slipping through string concatenation.",
    },
  }),
  q({
    id: "q19-basic-usage",
    chapter: "basic-usage",
    lesson: "hhvm/basic-usage/server",
    kind: "concept",
    level: 1,
    text: { vi: "Chế độ server của HHVM dùng để làm gì?", en: "What is HHVM's server mode for?" },
    options: ["Chạy tiến trình phục vụ nhiều request HTTP liên tục","Chạy script một lần rồi thoát","Biên dịch Hack sang C++","Kiểm tra kiểu tĩnh"],
    answer: 0,
    explanation: {
      vi: "`hhvm -m server` chạy tiến trình thường trú phục vụ request; còn `hhvm foo.hack` là chế độ CLI chạy một lần rồi thoát.",
      en: "`hhvm -m server` runs a long-lived process that serves requests; `hhvm foo.hack` is the CLI mode that exits after one run.",
    },
  }),
  q({
    id: "q20-configuration",
    chapter: "configuration",
    lesson: "hhvm/configuration/introduction",
    kind: "concept",
    level: 2,
    text: { vi: "Tệp `.ini` của HHVM dùng để làm gì?", en: "What is an HHVM `.ini` file for?" },
    options: ["Đặt cấu hình cho runtime, đọc lúc khởi động","Chứa mã nguồn Hack","Khai báo dependency Composer","Mô tả route của Proxygen"],
    answer: 0,
    explanation: {
      vi: "`.ini` giữ các thiết lập như cổng, thư mục gốc, giới hạn bộ nhớ; HHVM đọc lúc khởi động và áp cho cả tiến trình.",
      en: "`.ini` files hold settings such as the port, document root and memory limits; HHVM reads them at startup and applies them to the process.",
    },
  }),
  q({
    id: "q21-expressions-and-operators",
    chapter: "expressions-and-operators",
    lesson: "hack/expressions-and-operators/coalesce",
    kind: "predict",
    level: 1,
    text: { vi: "`??` trả về gì khi biến là `null`?", en: "What does `??` return when the value is `null`?" },
    code: `<?hh
function main(): void {
  $a = null;
  $b = $a ?? "fallback";
  echo $b;
}`,
    options: ["fallback","null","Lỗi: null không dùng được","rỗng"],
    answer: 0,
    explanation: {
      vi: "`??` chỉ lấy vế phải khi vế trái là `null` (hoặc chưa có), nên `$b` là `\"fallback\"`.",
      en: "`??` takes its right side when the left is `null` (or unset), so `$b` is `\"fallback\"`.",
    },
  }),
  q({
    id: "q22-expressions-and-operators",
    chapter: "expressions-and-operators",
    lesson: "hack/expressions-and-operators/string-concatenation",
    kind: "predict",
    level: 1,
    text: { vi: "Chuỗi trong `\"...\"` nội suy biến thế nào?", en: "How does a `\"...\"` string interpolate a variable?" },
    code: `<?hh
function main(): void {
  $name = "Hack";
  echo "Hello, {$name}!";
}`,
    options: ["Hello, Hack!","Hello, {$name}!","Hello, !","Lỗi: { } trong chuỗi"],
    answer: 0,
    explanation: {
      vi: "Trong chuỗi nháy kép, `{$name}` được thay bằng giá trị biến; cặp ngoặc nhọn giúp tách tên biến khỏi chữ xung quanh.",
      en: "Inside a double-quoted string `{$name}` is replaced by the variable's value; the braces separate the name from the surrounding text.",
    },
  }),
  q({
    id: "q23-types",
    chapter: "types",
    lesson: "hack/types/nullable-types",
    kind: "concept",
    level: 2,
    text: { vi: "`?string` nghĩa là gì?", en: "What does `?string` mean?" },
    options: ["`string` hoặc `null`","Chuỗi rỗng","Chuỗi tuỳ chọn khi gọi hàm","Bất kỳ kiểu nào"],
    answer: 0,
    explanation: {
      vi: "Dấu `?` thêm `null` vào kiểu. Muốn dùng giá trị, phải kiểm tra `null` trước — hoặc dùng `??`.",
      en: "The `?` adds `null` to the type. Before using the value you must check for `null`, or use `??`.",
    },
  }),
  q({
    id: "q24-types",
    chapter: "types",
    lesson: "hack/types/type-aliases",
    kind: "concept",
    level: 2,
    text: { vi: "`newtype` khác `type` ở điểm nào?", en: "How does `newtype` differ from `type`?" },
    options: ["`newtype` là kiểu riêng, không lẫn với kiểu gốc","`newtype` nhanh hơn","`type` chỉ dùng trong class","Không khác gì"],
    answer: 0,
    explanation: {
      vi: "`type` chỉ là tên gọi khác của kiểu gốc; `newtype` tạo kiểu mới mà typechecker không cho dùng thay thế lẫn nhau.",
      en: "`type` is just another name for the type; `newtype` creates a distinct type the typechecker will not mix with the original.",
    },
  }),
  q({
    id: "q25-arrays-and-collections",
    chapter: "arrays-and-collections",
    lesson: "hack/arrays-and-collections/vec-keyset-and-dict",
    kind: "predict",
    level: 1,
    text: { vi: "`Vec\\map` biến đổi `vec` thế nào?", en: "How does `Vec\\map` transform a `vec`?" },
    code: `<?hh
use namespace HH\Lib\Vec;
function main(): void {
  $v = Vec\\map(vec[1, 2, 3], $x ==> $x * 2);
  echo implode(",", $v);
}`,
    options: ["2,4,6","1,2,3","2,2,2","Lỗi: map không nhận lambda"],
    answer: 0,
    explanation: {
      vi: "`Vec\\map` trả về `vec` mới cùng độ dài, mỗi phần tử là kết quả của hàm — 1, 2, 3 thành 2, 4, 6.",
      en: "`Vec\\map` returns a new `vec` of the same length, each element the result of the callback: 1, 2, 3 becomes 2, 4, 6.",
    },
  }),
  q({
    id: "q26-expressions-and-operators",
    chapter: "expressions-and-operators",
    lesson: "hack/expressions-and-operators/pipe",
    kind: "predict",
    level: 3,
    text: { vi: "Toán tử `|>` đưa giá trị vào đâu?", en: "Where does the `|>` operator put its value?" },
    code: `<?hh
function add1(int $x): int { return $x + 1; }
function main(): void {
  echo 1 |> add1($$);
}`,
    options: ["2","1","Lỗi: $ không hợp lệ","add1"],
    answer: 0,
    explanation: {
      vi: "`|>` đặt vế trái vào chỗ `$` của vế phải, nên `1 |> add1($)` chính là `add1(1)`.",
      en: "`|>` places the left side wherever `$` appears on the right, so `1 |> add1($)` is `add1(1)`.",
    },
  }),
  q({
    id: "q27-expressions-and-operators",
    chapter: "expressions-and-operators",
    lesson: "hack/expressions-and-operators/ternary",
    kind: "predict",
    level: 1,
    text: { vi: "Toán tử ba ngôi chọn nhánh nào?", en: "Which branch does the ternary pick?" },
    code: `<?hh
function main(): void {
  $n = 0;
  echo $n ? "truthy" : "falsy";
}`,
    options: ["falsy","truthy","0","Lỗi: 0 không dùng làm điều kiện"],
    answer: 0,
    explanation: {
      vi: "`0` là falsy trong Hack, nên biểu thức chọn nhánh sau dấu `:`.",
      en: "`0` is falsy in Hack, so the expression takes the branch after the `:`.",
    },
  }),
  q({
    id: "q28-statements",
    chapter: "statements",
    lesson: "hack/statements/try",
    kind: "predict",
    level: 2,
    text: { vi: "`catch` nhận được gì?", en: "What does a `catch` receive?" },
    code: `<?hh
function main(): void {
  try {
    throw new Exception("boom");
  } catch (Exception $e) {
    echo "caught: " . $e->getMessage();
  }
}`,
    options: ["caught: boom","caught: ","boom","Lỗi: Exception không bắt được"],
    answer: 0,
    explanation: {
      vi: "Đối tượng ngoại lệ được truyền vào biến `$e`; `getMessage()` trả lại chuỗi đã ném.",
      en: "The thrown object arrives in `$e`; `getMessage()` returns the string it was built with.",
    },
  }),
  q({
    id: "q29-generics",
    chapter: "generics",
    lesson: "hack/generics/introduction",
    kind: "concept",
    level: 3,
    text: { vi: "Generic giúp gì cho người đọc chữ ký hàm?", en: "What do generics add to a function signature?" },
    options: ["Nói rõ quan hệ giữa kiểu đầu vào và kiểu trả về","Làm code chạy nhanh hơn","Thay thế interface","Cho phép bỏ qua kiểm tra kiểu"],
    answer: 0,
    explanation: {
      vi: "`function first<T>(vec<T> $v): ?T` nói rằng đầu vào và đầu ra cùng một kiểu `T`; nhờ vậy typechecker giữ được thông tin thay vì thu về `mixed`.",
      en: "`function first<T>(vec<T> $v): ?T` says input and output share the type `T`, so the typechecker keeps that information instead of collapsing to `mixed`.",
    },
  }),
  q({
    id: "q30-",
    chapter: "XHP",
    lesson: "hack/XHP/introduction",
    kind: "concept",
    level: 3,
    text: { vi: "Vì sao XHP an toàn hơn nối chuỗi HTML?", en: "Why is XHP safer than concatenating HTML strings?" },
    options: ["Nội dung được escape đúng ngữ cảnh, tag và thuộc tính được kiểm tra","Nó nén HTML","Nó chạy trên server","Nó tự sinh CSS"],
    answer: 0,
    explanation: {
      vi: "XHP biết đâu là text và đâu là thuộc tính, nên escape đúng chỗ và báo lỗi khi tag/thuộc tính không hợp lệ — nối chuỗi thì không có gì kiểm tra.",
      en: "XHP knows what is text and what is an attribute, escapes each correctly, and rejects unknown tags or attributes; string concatenation checks nothing.",
    },
  }),
];

export const EXAM_KINDS = ["concept", "predict", "fill", "order"];
