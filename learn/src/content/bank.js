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
    options: ["a12b","a3b","a 3 b","a1 + 2b"],
    answer: 1,
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
    options: ["3.5 0.5 72","3 1 72","3.5 1 72","3.5 1 9"],
    answer: 2,
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
    options: ["different strict","different types differ","loose types differ","loose strict"],
    answer: 2,
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
    options: ["4 41","3 41","3 14","4 14"],
    answer: 3,
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
    options: ["Hi, Ada|Hi, Ada","Hello, Ada|Hello, Ada","Lỗi thiếu tham số","Hi, Ada|Hello, Ada"],
    answer: 3,
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
    options: ["Vòng lặp vô hạn","6","0","3"],
    answer: 1,
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
    options: ["no no","no yes","yes no","yes yes"],
    answer: 3,
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
    options: ["`string` hoặc `null`","Chuỗi tuỳ chọn (optional) trong shape","Một chuỗi rỗng","Chỉ chuỗi, không bao giờ null"],
    answer: 0,
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
    options: ["1 null","Lỗi: shape không có khoá z","1 -1","1 Lỗi"],
    answer: 2,
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
    options: ["0 1","Red Green","Color::Red Color::Green","red green"],
    answer: 3,
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
    options: ["yield","return","async","await"],
    answer: 3,
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
    options: ["`composer.json`","`hack.json`","`.hhconfig`","`hhvm.ini`"],
    answer: 2,
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
    options: ["6","3,6,9","1,2,3","6,9"],
    answer: 3,
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
    options: ["many","two","two many","one"],
    answer: 1,
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
    options: ["caught boom","caught Exception finally","caught boom finally","finally"],
    answer: 2,
    explanation: {
      vi: "`catch` bắt lỗi và in thông báo; `finally` luôn chạy sau cùng, dù có lỗi hay không.",
      en: "`catch` handles the error and prints its message; `finally` always runs afterwards.",
    },
  }),
  q({
    id: "scope-blocks",
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
    id: "constants-once",
    chapter: "source-code-fundamentals",
    lesson: "hack/source-code-fundamentals/constants",
    kind: "concept",
    level: 2,
    text: { vi: "Hằng số khai báo bằng `const` khác biến ở điểm nào?", en: "How is a constant declared with `const` different from a variable?" },
    options: ["Chỉ dùng được trong class","Phải gán một lần, không đổi được sau đó","Không có kiểu","Chỉ tồn tại lúc biên dịch"],
    answer: 1,
    explanation: {
      vi: "`const` gán đúng một lần; đọc lại thì được, gán lại thì lỗi. Biến `$x` thì đổi được bất cứ lúc nào.",
      en: "A `const` is assigned once; reading it later is fine, assigning it again is an error. A `$x` variable can change at any time.",
    },
  }),
  q({
    id: "switch-fallthrough",
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
    options: ["two ","other","one two three ","two three "],
    answer: 3,
    explanation: {
      vi: "`switch` rơi xuống các `case` phía sau cho tới khi gặp `break`. `case 2` khớp nên in `two `, rồi rơi tiếp vào `case 3`.",
      en: "`switch` falls through to the following cases until a `break`. `case 2` matches, prints `two `, then falls into `case 3`.",
    },
  }),
  q({
    id: "do-while-count",
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
    id: "keyset-duplicates",
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
    options: ["3","1","2","Lỗi: keyset không nhận số"],
    answer: 2,
    explanation: {
      vi: "`keyset` là tập hợp: mỗi giá trị chỉ giữ một lần, nên `1, 1, 2` còn hai phần tử.",
      en: "A `keyset` is a set: each value is kept once, so `1, 1, 2` has two members.",
    },
  }),
  q({
    id: "dict-iteration",
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
    id: "vec-copy-on-assign",
    chapter: "arrays-and-collections",
    lesson: "hack/arrays-and-collections/vec-keyset-and-dict",
    kind: "predict",
    level: 2,
    text: { vi: "Gán `$y = $x` với `$x` là `vec` thì điều gì xảy ra khi sửa `$y`?", en: "With `$x` a `vec`, what happens to `$x` when you modify `$y = $x`?" },
    code: `<?hh
function main(): void {
  $x = vec[1, 2];
  $y = $x;
  $y[] = 3;
  echo count($x);
}`,
    options: ["3","Lỗi: vec không gán được","0","2"],
    answer: 3,
    explanation: {
      vi: "`vec` là kiểu giá trị: phép gán sao chép. Thêm phần tử vào `$y` không đụng tới `$x`.",
      en: "`vec` is a value type: assignment copies. Appending to `$y` leaves `$x` alone.",
    },
  }),
  q({
    id: "default-parameter",
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
    id: "variadic-sum",
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
    id: "static-property-lifetime",
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
    options: ["0","Lỗi: self không dùng được","2","1"],
    answer: 2,
    explanation: {
      vi: "Thuộc tính static thuộc về lớp, không thuộc về đối tượng: lần gọi thứ hai thấy `$n` đã là 1 nên trả về 2.",
      en: "A static property belongs to the class, not an object: the second call sees `$n` already at 1 and returns 2.",
    },
  }),
  q({
    id: "abstract-subclass",
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
  $s = new Square(2.0);
  echo $s->area();
}`,
    options: ["6","Lỗi: lớp abstract không tạo được","2","4"],
    answer: 3,
    explanation: {
      vi: "`Square` cài đặt `area()`, nên `new Square(2.0)` hợp lệ; 2×2 là 4. Lớp `abstract` không tạo trực tiếp được, nhưng lớp con cụ thể thì được.",
      en: "`Square` implements `area()`, so `new Square(2.0)` is allowed and 2×2 is 4. The abstract class itself cannot be instantiated, its concrete subclass can.",
    },
  }),
  q({
    id: "trait-method",
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
    options: ["rỗng","trait","Lỗi: Uses không có say()","Says"],
    answer: 1,
    explanation: {
      vi: "`use Says;` chép thân phương thức vào lớp, nên `Uses` có `say()` như thể tự viết.",
      en: "`use Says;` copies the method body into the class, so `Uses` has `say()` as if it had written it.",
    },
  }),
  q({
    id: "interface-vs-trait",
    chapter: "traits-and-interfaces",
    lesson: "hack/traits-and-interfaces/implementing-an-interface",
    kind: "concept",
    level: 2,
    text: { vi: "Interface khác trait ở điểm cốt lõi nào?", en: "What is the essential difference between an interface and a trait?" },
    options: ["Interface nhanh hơn","Không khác gì","Interface chỉ là hợp đồng, trait mang theo thân phương thức","Trait chỉ dùng cho static"],
    answer: 2,
    explanation: {
      vi: "Interface chỉ nói lớp phải có gì; trait cho mượn luôn phần cài đặt.",
      en: "An interface only states what a class must provide; a trait lends the implementation itself.",
    },
  }),
  q({
    id: "generic-inference",
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
    options: ["null","y","x","Lỗi: T không xác định"],
    answer: 2,
    explanation: {
      vi: "`T` được suy ra từ đối số là `string`, và `$v[0]` là `\"x\"`.",
      en: "`T` is inferred as `string` from the argument, and `$v[0]` is `\"x\"`.",
    },
  }),
  q({
    id: "readonly-property",
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
    options: ["null","0","4","Lỗi: readonly không đọc được"],
    answer: 2,
    explanation: {
      vi: "`readonly` cấm ghi sau khi khởi tạo, không cấm đọc. `$p->x` vẫn là 4.",
      en: "`readonly` forbids writing after initialisation, not reading. `$p->x` is still 4.",
    },
  }),
  q({
    id: "await-unwraps",
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
    options: ["Awaitable<int>","42","Lỗi: thiếu await","0"],
    answer: 1,
    explanation: {
      vi: "`async` bọc kết quả trong `Awaitable`; `await` mở nó ra, nên `$v` là `int` 42.",
      en: "`async` wraps the result in an `Awaitable`; `await` unwraps it, so `$v` is the `int` 42.",
    },
  }),
  q({
    id: "finally-runs",
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
    options: ["b","a","ab","Lỗi: thiếu catch"],
    answer: 2,
    explanation: {
      vi: "`finally` chạy sau `try`, dù có lỗi hay không; không bắt buộc phải có `catch`.",
      en: "`finally` runs after `try` whether or not anything was thrown; a `catch` is not required.",
    },
  }),
  q({
    id: "xhp-purpose",
    chapter: "XHP",
    lesson: "hack/XHP/introduction",
    kind: "concept",
    level: 3,
    text: { vi: "XHP giải quyết vấn đề gì?", en: "What problem does XHP solve?" },
    options: ["Thay thế `async`","Dựng HTML bằng cú pháp XML có kiểm tra kiểu, thay vì nối chuỗi","Quản lý gói Composer","Tăng tốc độ mạng"],
    answer: 1,
    explanation: {
      vi: "XHP cho phép viết thẻ như `<a href=\"…\">` ngay trong Hack; tag sai tên hoặc thiếu thuộc tính bắt được lúc chạy và lúc kiểm tra kiểu, thay vì lọt qua phép nối chuỗi.",
      en: "XHP lets you write tags such as `<a href=\"…\">` in Hack; wrong tags or missing attributes are caught by the typechecker and at runtime instead of slipping through string concatenation.",
    },
  }),
  q({
    id: "server-mode",
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
    id: "ini-files",
    chapter: "configuration",
    lesson: "hhvm/configuration/introduction",
    kind: "concept",
    level: 2,
    text: { vi: "Tệp `.ini` của HHVM dùng để làm gì?", en: "What is an HHVM `.ini` file for?" },
    options: ["Khai báo dependency Composer","Đặt cấu hình cho runtime, đọc lúc khởi động","Chứa mã nguồn Hack","Mô tả route của Proxygen"],
    answer: 1,
    explanation: {
      vi: "`.ini` giữ các thiết lập như cổng, thư mục gốc, giới hạn bộ nhớ; HHVM đọc lúc khởi động và áp cho cả tiến trình.",
      en: "`.ini` files hold settings such as the port, document root and memory limits; HHVM reads them at startup and applies them to the process.",
    },
  }),
  q({
    id: "coalesce-null",
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
    id: "string-interpolation",
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
    options: ["Hello, {$name}!","Lỗi: { } trong chuỗi","Hello, Hack!","Hello, !"],
    answer: 2,
    explanation: {
      vi: "Trong chuỗi nháy kép, `{$name}` được thay bằng giá trị biến; cặp ngoặc nhọn giúp tách tên biến khỏi chữ xung quanh.",
      en: "Inside a double-quoted string `{$name}` is replaced by the variable's value; the braces separate the name from the surrounding text.",
    },
  }),
  q({
    id: "nullable-type",
    chapter: "types",
    lesson: "hack/types/nullable-types",
    kind: "concept",
    level: 2,
    text: { vi: "`?string` nghĩa là gì?", en: "What does `?string` mean?" },
    options: ["Chuỗi rỗng","Chuỗi tuỳ chọn khi gọi hàm","Bất kỳ kiểu nào","`string` hoặc `null`"],
    answer: 3,
    explanation: {
      vi: "Dấu `?` thêm `null` vào kiểu. Muốn dùng giá trị, phải kiểm tra `null` trước — hoặc dùng `??`.",
      en: "The `?` adds `null` to the type. Before using the value you must check for `null`, or use `??`.",
    },
  }),
  q({
    id: "newtype-vs-type",
    chapter: "types",
    lesson: "hack/types/type-aliases",
    kind: "concept",
    level: 2,
    text: { vi: "`newtype` khác `type` ở điểm nào?", en: "How does `newtype` differ from `type`?" },
    options: ["`newtype` nhanh hơn","`type` chỉ dùng trong class","`newtype` là kiểu riêng, không lẫn với kiểu gốc","Không khác gì"],
    answer: 2,
    explanation: {
      vi: "`type` chỉ là tên gọi khác của kiểu gốc; `newtype` tạo kiểu mới mà typechecker không cho dùng thay thế lẫn nhau.",
      en: "`type` is just another name for the type; `newtype` creates a distinct type the typechecker will not mix with the original.",
    },
  }),
  q({
    id: "vec-map",
    chapter: "arrays-and-collections",
    lesson: "hack/arrays-and-collections/vec-keyset-and-dict",
    kind: "predict",
    level: 1,
    text: { vi: "`Vec\\map` biến đổi `vec` thế nào?", en: "How does `Vec\\map` transform a `vec`?" },
    code: `<?hh
use namespace HH\\Lib\\Vec;
function main(): void {
  $v = Vec\\map(vec[1, 2, 3], $x ==> $x * 2);
  echo implode(",", $v);
}`,
    options: ["2,2,2","1,2,3","Lỗi: map không nhận lambda","2,4,6"],
    answer: 3,
    explanation: {
      vi: "`Vec\\map` trả về `vec` mới cùng độ dài, mỗi phần tử là kết quả của hàm — 1, 2, 3 thành 2, 4, 6.",
      en: "`Vec\\map` returns a new `vec` of the same length, each element the result of the callback: 1, 2, 3 becomes 2, 4, 6.",
    },
  }),
  q({
    id: "pipe-operator",
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
    options: ["Lỗi: $ không hợp lệ","2","add1","1"],
    answer: 1,
    explanation: {
      vi: "`|>` đặt vế trái vào chỗ `$` của vế phải, nên `1 |> add1($)` chính là `add1(1)`.",
      en: "`|>` places the left side wherever `$` appears on the right, so `1 |> add1($)` is `add1(1)`.",
    },
  }),
  q({
    id: "ternary-falsy",
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
    options: ["Lỗi: 0 không dùng làm điều kiện","0","truthy","falsy"],
    answer: 3,
    explanation: {
      vi: "`0` là falsy trong Hack, nên biểu thức chọn nhánh sau dấu `:`.",
      en: "`0` is falsy in Hack, so the expression takes the branch after the `:`.",
    },
  }),
  q({
    id: "catch-message",
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
    options: ["Lỗi: Exception không bắt được","boom","caught: ","caught: boom"],
    answer: 3,
    explanation: {
      vi: "Đối tượng ngoại lệ được truyền vào biến `$e`; `getMessage()` trả lại chuỗi đã ném.",
      en: "The thrown object arrives in `$e`; `getMessage()` returns the string it was built with.",
    },
  }),
  q({
    id: "generic-signature",
    chapter: "generics",
    lesson: "hack/generics/introduction",
    kind: "concept",
    level: 3,
    text: { vi: "Generic giúp gì cho người đọc chữ ký hàm?", en: "What do generics add to a function signature?" },
    options: ["Làm code chạy nhanh hơn","Cho phép bỏ qua kiểm tra kiểu","Thay thế interface","Nói rõ quan hệ giữa kiểu đầu vào và kiểu trả về"],
    answer: 3,
    explanation: {
      vi: "`function first<T>(vec<T> $v): ?T` nói rằng đầu vào và đầu ra cùng một kiểu `T`; nhờ vậy typechecker giữ được thông tin thay vì thu về `mixed`.",
      en: "`function first<T>(vec<T> $v): ?T` says input and output share the type `T`, so the typechecker keeps that information instead of collapsing to `mixed`.",
    },
  }),
  q({
    id: "xhp-escaping",
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
  q({
    id: "heredoc-interpolation",
    chapter: "source-code-fundamentals",
    lesson: "hack/source-code-fundamentals/literals",
    kind: "predict",
    level: 2,
    text: { vi: "Heredoc nội suy biến thế nào?", en: "How does a heredoc interpolate a variable?" },
    code: `<?hh
function main(): void {
  $v = 7;
  echo <<<TXT
value: $v
TXT;
}`,
    options: ["value: 7","value: $v","value: ","Lỗi: heredoc không nội suy"],
    answer: 0,
    explanation: {
      vi: "Heredoc (`<<<TXT`) hoạt động như chuỗi nháy kép: `$v` được thay bằng 7. Nowdoc (`<<<'TXT'`) mới giữ nguyên `$v`.",
      en: "A heredoc (`<<<TXT`) behaves like a double-quoted string: `$v` becomes 7. A nowdoc (`<<<'TXT'`) would keep the literal `$v`.",
    },
  }),
  q({
    id: "shapes-sum",
    chapter: "built-in-types",
    lesson: "hack/built-in-types/shape",
    kind: "predict",
    level: 1,
    text: { vi: "Shape truy cập trường thế nào?", en: "How do you read a shape field?" },
    code: `<?hh
function main(): void {
  $p = shape("x" => 1, "y" => 2);
  echo $p["x"] + $p["y"];
}`,
    options: ["12","Lỗi: shape không dùng [] được","3","0"],
    answer: 2,
    explanation: {
      vi: "Shape là mảng có khoá cố định: `$p[\"x\"]` là 1, `$p[\"y\"]` là 2, tổng là 3.",
      en: "A shape is an array with fixed keys: `$p[\"x\"]` is 1, `$p[\"y\"]` is 2, so the sum is 3.",
    },
  }),
  q({
    id: "enum-values",
    chapter: "built-in-types",
    lesson: "hack/built-in-types/enum",
    kind: "predict",
    level: 2,
    text: { vi: "In một `enum` có giá trị cho ra gì?", en: "What does printing a backed enum give you?" },
    code: `<?hh
enum Color: string {
  RED = "red";
  BLUE = "blue";
}
function main(): void {
  echo Color::BLUE;
}`,
    options: ["Color::BLUE","Lỗi: enum không in được","blue","BLUE"],
    answer: 2,
    explanation: {
      vi: "Enum có giá trị (`: string`) in ra đúng giá trị đã khai báo, nên `Color::BLUE` là `blue`.",
      en: "A backed enum (`: string`) prints the value it was declared with, so `Color::BLUE` is `blue`.",
    },
  }),
  q({
    id: "nullable-ternary",
    chapter: "types",
    lesson: "hack/types/nullable-types",
    kind: "predict",
    level: 2,
    text: { vi: "Hàm xử lý `?string` in ra gì?", en: "What does this `?string` function print?" },
    code: `<?hh
function len(?string $s): int {
  return $s === null ? 0 : strlen($s);
}
function main(): void {
  echo len(null) . "," . len("abc");
}`,
    options: ["Lỗi: strlen(null)","0,3","3,0","0,0"],
    answer: 1,
    explanation: {
      vi: "`len(null)` đi nhánh `0`, `len(\"abc\")` đếm được 3 ký tự. Kiểm tra `null` trước khi dùng là cách Hack buộc phải làm với `?T`.",
      en: "`len(null)` takes the `0` branch, `len(\"abc\")` counts 3 characters. Checking for `null` before use is what Hack requires of `?T`.",
    },
  }),
  q({
    id: "named-arguments",
    chapter: "functions",
    lesson: "hack/functions/named-parameters",
    kind: "predict",
    level: 3,
    text: { vi: "Đối số có tên thay đổi thứ tự tham số thế nào?", en: "How do named arguments change parameter order?" },
    code: `<?hh
function greet(string $name, string $greeting = "hi"): string {
  return $greeting . " " . $name;
}
function main(): void {
  echo greet(name: "kim", greeting: "yo");
}`,
    options: ["hi kim","yo kim","Lỗi: sai thứ tự tham số","kim yo"],
    answer: 1,
    explanation: {
      vi: "Đối số có tên khớp theo tên tham số chứ không theo vị trí, nên `greeting: \"yo\"` vào đúng chỗ dù được viết sau.",
      en: "Named arguments bind by parameter name, not by position, so `greeting: \"yo\"` lands in the right slot even though it comes second.",
    },
  }),
  q({
    id: "inout-write-back",
    chapter: "functions",
    lesson: "hack/functions/inout-parameters",
    kind: "predict",
    level: 3,
    text: { vi: "`inout` cho hàm sửa biến của nơi gọi không?", en: "Does `inout` let a function change the caller's variable?" },
    code: `<?hh
function bump(inout int $n): void {
  $n++;
}
function main(): void {
  $x = 1;
  bump(inout $x);
  echo $x;
}`,
    options: ["0","Lỗi: inout cần biến hằng","2","1"],
    answer: 2,
    explanation: {
      vi: "`inout` truyền tham chiếu tới biến của nơi gọi: `$n++` trong hàm làm `$x` thành 2. Nơi gọi cũng phải viết `inout`.",
      en: "`inout` passes a reference to the caller's variable: `$n++` inside the function makes `$x` 2. The call site must write `inout` too.",
    },
  }),
  q({
    id: "match-arms",
    chapter: "expressions-and-operators",
    lesson: "hack/statements/switch",
    kind: "predict",
    level: 2,
    text: { vi: "`match` chọn nhánh nào?", en: "Which arm does `match` pick?" },
    code: `<?hh
function size(int $n): string {
  return match ($n) { 1, 2 => "small", default => "large" };
}
function main(): void {
  echo size(1) . " " . size(5);
}`,
    options: ["small small","Lỗi: match cần break","large large","small large"],
    answer: 3,
    explanation: {
      vi: "`match` lấy nhánh khớp đầu tiên và trả về giá trị của nó; một nhánh có thể nhận nhiều điều kiện (`1, 2`). Không có rơi nhánh như `switch`.",
      en: "`match` takes the first matching arm and returns its value; one arm can list several conditions (`1, 2`). There is no fall-through like `switch`.",
    },
  }),
  q({
    id: "vec-map-hsl",
    chapter: "arrays-and-collections",
    lesson: "hack/arrays-and-collections/vec-keyset-and-dict",
    kind: "predict",
    level: 2,
    text: { vi: "`Vec\\map` trả về gì?", en: "What does `Vec\\map` return?" },
    code: `<?hh
use namespace HH\\Lib\\Vec;
function main(): void {
  $v = Vec\\map(vec[1, 2, 3], $x ==> $x * 2);
  echo implode(",", $v);
}`,
    options: ["2,4,6","1,2,3","2,2,2","Lỗi: map cần hai tham số"],
    answer: 0,
    explanation: {
      vi: "`Vec\\map` trả về `vec` mới cùng độ dài, mỗi phần tử là kết quả của hàm: 1, 2, 3 thành 2, 4, 6.",
      en: "`Vec\\map` returns a new `vec` of the same length, each element the callback's result: 1, 2, 3 becomes 2, 4, 6.",
    },
  }),
  q({
    id: "vec-reduce-hsl",
    chapter: "arrays-and-collections",
    lesson: "hack/arrays-and-collections/mutating-values",
    kind: "predict",
    level: 3,
    text: { vi: "`Vec\\reduce` cộng dồn thế nào?", en: "How does `Vec\\reduce` accumulate?" },
    code: `<?hh
use namespace HH\\Lib\\Vec;
function main(): void {
  echo Vec\\reduce(vec[1, 2, 3], ($acc, $n) ==> $acc + $n, 0);
}`,
    options: ["6","3","0","Lỗi: reduce cần closure"],
    answer: 0,
    explanation: {
      vi: "`reduce` bắt đầu từ 0, rồi cộng dồn từng phần tử: 0+1, 1+2, 3+3 = 6. Tham số là `($acc, $phần_tử)`.",
      en: "`reduce` starts from 0 and folds each element in: 0+1, 1+2, 3+3 = 6. The callback takes `($acc, $element)`.",
    },
  }),
  q({
    id: "generator-values",
    chapter: "expressions-and-operators",
    lesson: "hack/expressions-and-operators/yield",
    kind: "predict",
    level: 3,
    text: { vi: "Hàm `yield` cho ra gì khi duyệt?", en: "What does a yielding function produce when iterated?" },
    code: `<?hh
function squares(): Generator<int, int, void> {
  foreach (vec[1, 2, 3] as $v) yield $v * $v;
}
function main(): void {
  foreach (squares() as $s) echo $s . ",";
}`,
    options: ["9,4,1,","1,2,3,","Lỗi: Generator không duyệt được","1,4,9,"],
    answer: 3,
    explanation: {
      vi: "`yield` đưa từng giá trị ra ngoài theo thứ tự; bình phương của 1, 2, 3 là 1, 4, 9.",
      en: "`yield` hands values out one at a time, in order; the squares of 1, 2, 3 are 1, 4, 9.",
    },
  }),
  q({
    id: "vec-sort-returns",
    chapter: "arrays-and-collections",
    lesson: "hack/arrays-and-collections/mutating-values",
    kind: "predict",
    level: 3,
    text: { vi: "`Vec\\sort` trả về gì?", en: "What does `Vec\\sort` return?" },
    code: `<?hh
use namespace HH\\Lib\\Vec;
function main(): void {
  $sorted = Vec\\sort(vec[3, 1, 2]);
  echo implode(",", $sorted);
}`,
    options: ["1,2,3","3,1,2","","Lỗi: Vec\\sort sửa tại chỗ"],
    answer: 0,
    explanation: {
      vi: "`Vec\\sort` không sửa `vec` gốc (`vec` là kiểu giá trị), nó trả về một `vec` mới đã sắp xếp.",
      en: "`Vec\\sort` does not change the original `vec` (a `vec` is a value type); it returns a new, sorted one.",
    },
  }),
  q({
    id: "dict-get-default",
    chapter: "arrays-and-collections",
    lesson: "hack/arrays-and-collections/vec-keyset-and-dict",
    kind: "predict",
    level: 2,
    text: { vi: "`Dict\\get` với khoá không có thì sao?", en: "What does `Dict\\get` do for a missing key?" },
    code: `<?hh
use namespace HH\\Lib\\Dict;
function main(): void {
  $d = dict["a" => 1];
  echo Dict\\get($d, "b", 9);
}`,
    options: ["Lỗi: khoá không tồn tại","1","9","null"],
    answer: 2,
    explanation: {
      vi: "`Dict\\get($d, $k, $default)` trả về giá trị mặc định khi khoá chưa có, thay vì ném lỗi như `$d[$k]`.",
      en: "`Dict\\get($d, $k, $default)` returns the default when the key is absent, instead of throwing like `$d[$k]`.",
    },
  }),
  q({
    id: "float-division",
    chapter: "expressions-and-operators",
    lesson: "hack/expressions-and-operators/arithmetic",
    kind: "predict",
    level: 1,
    text: { vi: "`/` với hai số nguyên cho kết quả gì?", en: "What does `/` give for two ints?" },
    code: `<?hh
function main(): void {
  echo 7 / 2;
}`,
    options: ["4","3","Lỗi: chia không hết","3.5"],
    answer: 3,
    explanation: {
      vi: "`/` trong Hack luôn trả về `float` khi không chia hết, nên 7/2 là 3.5. Muốn chia nguyên thì dùng `intdiv()`.",
      en: "`/` in Hack returns a `float` when the division is not exact, so 7/2 is 3.5. For integer division use `intdiv()`.",
    },
  }),
  q({
    id: "cast-string-bool",
    chapter: "expressions-and-operators",
    lesson: "hack/expressions-and-operators/casting",
    kind: "predict",
    level: 3,
    text: { vi: "Chuỗi `\"0\"` ép sang `bool` là gì?", en: "What is the string `\"0\"` cast to `bool`?" },
    code: `<?hh
function main(): void {
  var_dump((bool) "0");
}`,
    options: ["Lỗi: không ép được","bool(true)","bool(\"0\")","bool(false)"],
    answer: 3,
    explanation: {
      vi: "`\"0\"` là một trong số ít giá trị falsy của Hack (cùng với `0`, `0.0`, `\"\"`, `null`, mảng rỗng). `\"0.0\"` thì lại truthy.",
      en: "`\"0\"` is one of Hack's few falsy values (with `0`, `0.0`, `\"\"`, `null`, and empty containers). `\"0.0\"` is truthy.",
    },
  }),
  q({
    id: "nested-foreach-sum",
    chapter: "statements",
    lesson: "hack/statements/foreach",
    kind: "predict",
    level: 2,
    text: { vi: "Hai vòng `foreach` lồng nhau cộng được bao nhiêu?", en: "What do two nested `foreach` loops add up to?" },
    code: `<?hh
function main(): void {
  $m = dict["a" => vec[1, 2], "b" => vec[3]];
  $sum = 0;
  foreach ($m as $row) {
    foreach ($row as $n) $sum += $n;
  }
  echo $sum;
}`,
    options: ["5","3","6","Lỗi: dict chứa vec"],
    answer: 2,
    explanation: {
      vi: "Vòng ngoài đi qua hai giá trị `vec[1, 2]` và `vec[3]`; vòng trong cộng từng số: 1+2+3 = 6.",
      en: "The outer loop walks the two values `vec[1, 2]` and `vec[3]`; the inner one adds each number: 1+2+3 = 6.",
    },
  }),
  q({
    id: "attr-metadata",
    chapter: "attributes",
    lesson: "hack/attributes/introduction",
    kind: "predict",
    level: 2,
    text: {"vi":"Hai attribute `<<__Memoize, __Deprecated(...)>>` trên cùng một method có chặn chương trình chạy không?","en":"Do two attributes on one method, `<<__Memoize, __Deprecated(...)>>`, stop the program from running?"},
    code: "<?hh\nclass OtherClass {\n  <<__Memoize, __Deprecated(\"Use FooClass methods instead\")>>\n  public function addOne(int $x): int { return $x + 1; }\n}\nfunction main(): void {\n  echo (new OtherClass())->addOne(41);\n}",
    options: ["42","41","Lỗi lúc chạy vì `__Deprecated`","Lỗi vì hai attribute cạnh nhau"],
    answer: 0,
    explanation: {"vi":"Attribute chỉ gắn metadata cho định nghĩa. `__Memoize` cho kết quả 42 như bình thường, còn `__Deprecated` chỉ là cảnh báo cho typechecker (và IDE), không dừng chương trình.","en":"Attributes only attach metadata to a definition. `__Memoize` returns 42 as usual, and `__Deprecated` is just a hint for the typechecker (and IDE), not a runtime stop."},
  }),
  q({
    id: "attr-purpose",
    chapter: "attributes",
    lesson: "hack/attributes/introduction",
    kind: "concept",
    level: 1,
    text: {"vi":"Attribute như `<<__Memoize>>` hay `<<__Deprecated>>` dùng để làm gì?","en":"What are attributes such as `<<__Memoize>>` or `<<__Deprecated>>` for?"},
    options: ["Gắn metadata cho một định nghĩa để đổi hành vi của runtime hoặc typechecker","Khai báo một biến toàn cục mới","Tạo một comment HTML trong trang","Bật chế độ kiểm tra kiểu chặt hơn cho riêng biểu thức đó"],
    answer: 0,
    explanation: {"vi":"Attribute gắn metadata lên định nghĩa: một số attribute có sẵn như `__Memoize` đổi hành vi runtime, số khác như `__Deprecated` chỉ ảnh hưởng typechecker. Bạn cũng tự định nghĩa được attribute bằng cách implement `HH\\ClassAttribute` và đọc lại qua reflection.","en":"Attributes attach metadata to a definition: built-ins such as `__Memoize` change runtime behaviour, while `__Deprecated` only affects the typechecker. You can define your own by implementing `HH\\ClassAttribute` and read them back with reflection."},
  }),
  q({
    id: "context-empty-list",
    chapter: "contexts-and-capabilities",
    lesson: "hack/contexts-and-capabilities/introduction",
    kind: "predict",
    level: 2,
    text: {"vi":"Hàm có danh sách context rỗng `[]` vẫn chạy được không?","en":"Does a function with an empty context list `[]` still run?"},
    code: "<?hh\nfunction empty_context()[]: void {\n  echo \"ran\";\n}\nfunction main(): void {\n  empty_context();\n}",
    options: ["","Lỗi vì hàm không có capability nào","Lỗi: context `[]` không hợp lệ","ran"],
    answer: 3,
    explanation: {"vi":"Context chỉ giới hạn những gì hàm được làm (như `echo` cần capability `IO`). Ở đây hàm không làm gì cần capability nên `[]` hợp lệ; typechecker mới là nơi bắt lỗi, runtime vẫn chạy.","en":"A context limits what the function may do (for instance `echo` needs the `IO` capability). This body needs no capability, so `[]` is legal; the typechecker is what enforces it, and the runtime still runs the call."},
  }),
  q({
    id: "context-io-capability",
    chapter: "contexts-and-capabilities",
    lesson: "hack/contexts-and-capabilities/available-contexts-and-capabilities",
    kind: "concept",
    level: 2,
    text: {"vi":"Hàm khai báo `[]` (không capability) mà gọi `echo` thì typechecker báo gì?","en":"A function declared `[]` (no capabilities) calls `echo`: what does the typechecker report?"},
    options: ["Không báo gì, vì `echo` không cần capability","Thiếu capability `WriteProperty`","Lỗi cú pháp vì `echo` không phải biểu thức","Thiếu capability `IO`, vì `echo` và `print` cần nó"],
    answer: 3,
    explanation: {"vi":"Trang Available Contexts & Capabilities ghi rõ `IO` là capability cho `echo`/`print`; `WriteProperty` dành cho việc sửa thuộc tính của object. Context là cam kết ở mức typechecker, nên vi phạm là lỗi tĩnh.","en":"The Available Contexts & Capabilities page states that `IO` gates `echo`/`print`, while `WriteProperty` gates mutating object properties. Contexts are a typechecker-level promise, so a violation is a static error."},
  }),
  q({
    id: "reified-box",
    chapter: "reified-generics",
    lesson: "hack/reified-generics/reified-generics",
    kind: "predict",
    level: 2,
    text: {"vi":"Lớp `Box<reify T>` nhận giá trị gì cũng được, miễn là đúng kiểu đã chỉ định khi `new`. Đoạn này in gì?","en":"`Box<reify T>` accepts any value as long as `new` names the matching type. What does this print?"},
    code: "<?hh\nclass Box<reify T> {\n  public T $value;\n  public function __construct(T $v) {\n    $this->value = $v;\n  }\n}\nfunction main(): void {\n  $b = new Box<int>(5);\n  $c = new Box<string>(\"hi\");\n  echo $b->value . $c->value;\n}",
    options: ["5hi","hi5","Lỗi: `Box` không có tham số kiểu","55"],
    answer: 0,
    explanation: {"vi":"Tham số kiểu được viết ngay sau tên lớp khi `new`: `Box<int>` và `Box<string>` là hai thể hiện khác nhau, cùng in ra `5` rồi `hi`, nối thành `5hi`. `reify` giữ thông tin kiểu lại để runtime kiểm tra được.","en":"Type arguments go right after the class name at `new`: `Box<int>` and `Box<string>` are distinct instantiations printing `5` then `hi`, so `5hi`. `reify` keeps the type information so the runtime can check it."},
  }),
  q({
    id: "reified-purpose",
    chapter: "reified-generics",
    lesson: "hack/reified-generics/introduction",
    kind: "concept",
    level: 2,
    text: {"vi":"Vì sao Hack thêm `reify` cho generic?","en":"Why does Hack offer `reify` on generics?"},
    options: ["Để giữ thông tin kiểu lại cho runtime, vì generic thường bị xoá (erasure) khi chạy","Để generic chạy nhanh hơn nhờ bỏ hết kiểm tra","Để khai báo generic mà không cần typechecker","Để thay thế hoàn toàn `newtype`"],
    answer: 0,
    explanation: {"vi":"Generic của Hack mặc định bị xoá khi chạy, nên runtime không kiểm tra được `C<int>` với `C<string>`. `reify` là lựa chọn từng chỗ (opt-in) để giữ kiểu lại và kiểm tra lúc chạy, trong khi code không cần thì vẫn dùng erasure cho nhanh.","en":"Hack generics are erased at runtime by default, so the runtime cannot tell `C<int>` from `C<string>`. `reify` is opt-in, keeping the type around for runtime checks while code that does not need it keeps using erasure for speed."},
  }),
  q({
    id: "unsafe-cast-passthrough",
    chapter: "silencing-errors",
    lesson: "hack/silencing-errors/introduction",
    kind: "predict",
    level: 2,
    text: {"vi":"`HH\\FIXME\\UNSAFE_CAST` chỉ nói với typechecker. Đoạn này in gì?","en":"`HH\\FIXME\\UNSAFE_CAST` only talks to the typechecker. What does this print?"},
    code: "<?hh\nfunction main(): void {\n  $n = HH\\FIXME\\UNSAFE_CAST<string, int>(\"5\", \"it really is a number\");\n  echo $n + 1;\n}",
    options: ["5","6","Lỗi: không ép được `string` sang `int`","51"],
    answer: 1,
    explanation: {"vi":"`UNSAFE_CAST` không có tác dụng lúc chạy: giá trị `\"5\"` đi qua nguyên vẹn. Phép cộng `\"5\" + 1` vẫn ra `6` nhờ Hack ép số trong ngữ cảnh số học — nhưng nó chỉ an toàn vì chuỗi thật sự là số.","en":"`UNSAFE_CAST` has no runtime effect: the value `\"5\"` passes through untouched. `\"5\" + 1` still gives `6` because the numeric string is coerced in arithmetic — safe here only because the string really is a number."},
  }),
  q({
    id: "fixme-comment-scope",
    chapter: "silencing-errors",
    lesson: "hack/silencing-errors/introduction",
    kind: "concept",
    level: 2,
    text: {"vi":"Comment `/* HH_FIXME[4110] */` tắt lỗi trong phạm vi nào?","en":"What does a `/* HH_FIXME[4110] */` comment silence?"},
    options: ["Không tắt gì cả, chỉ là ghi chú","Mọi lỗi trong cả hàm chứa nó","Các lỗi cùng loại trên dòng ngay sau comment đó","Mọi lỗi trong cả file"],
    answer: 2,
    explanation: {"vi":"`HH_FIXME` phải đặt ngay trước dòng gây lỗi và chỉ tắt các lỗi liên quan trên dòng đó. Nó không đổi kiểu, không có tác dụng lúc chạy, và chỉ nhận mã lỗi thật sự có tác dụng — mã không tắt được gì sẽ bị bỏ qua.","en":"`HH_FIXME` must sit immediately before the offending line and only silences the related errors on that line. It does not change types, has no runtime effect, and only counts when the code is real — a suppression that silences nothing is ignored."},
  }),
  q({
    id: "memoize-attribute",
    chapter: "memoization-options",
    lesson: "hack/memoization-options/introduction",
    kind: "predict",
    level: 2,
    text: {"vi":"`<<__Memoize>>` nhớ kết quả theo tham số. Gọi `twice(4)` hai lần thì in gì?","en":"`<<__Memoize>>` remembers results per argument. Two calls to `twice(4)` print what?"},
    code: "<?hh\nclass Calc {\n  <<__Memoize>>\n  public function twice(int $n): int {\n    return $n * 2;\n  }\n}\nfunction main(): void {\n  $calc = new Calc();\n  echo $calc->twice(4);\n  echo $calc->twice(4);\n}",
    options: ["4","88","8","Lỗi: `__Memoize` không dùng được trên method"],
    answer: 1,
    explanation: {"vi":"Lần đầu tính `4 * 2 = 8`, lần sau lấy từ cache và trả về đúng `8`; hai lần in cạnh nhau thành `88`. `__Memoize` dùng được trên cả hàm và method.","en":"The first call computes `4 * 2 = 8`, the second is served from the cache and still returns `8`; printed back to back that is `88`. `__Memoize` works on functions and methods alike."},
  }),
  q({
    id: "memoize-ic-cache",
    chapter: "memoization-options",
    lesson: "hack/memoization-options/introduction",
    kind: "concept",
    level: 3,
    text: {"vi":"`<<__Memoize(#KeyedByIC)>>` giải quyết vấn đề gì?","en":"What problem does `<<__Memoize(#KeyedByIC)>>` solve?"},
    options: ["Hàm memoize bị gọi trước khi lớp được khai báo","Cache bị “nhiễm” khi cùng một hàm được gọi dưới các Implicit Context khác nhau","Hai thread cùng ghi vào một biến `static`","Cache tràn bộ nhớ khi hàm có quá nhiều tham số"],
    answer: 1,
    explanation: {"vi":"Nếu cache không phân biệt Implicit Context, kết quả tính dưới context này có thể bị trả cho caller dùng context khác — “memoization cache poisoning”. `#KeyedByIC` đưa IC vào khoá cache; hàm phụ thuộc IC (hoặc có context `[zoned]`) buộc phải dùng nó.","en":"Without IC in the key, a result computed under one Implicit Context can be handed to a caller using a different one — memoization cache poisoning. `#KeyedByIC` puts the IC into the cache key; functions that depend on the IC (or use the `[zoned]` context) are required to use it."},
  }),
  q({
    id: "module-internal",
    chapter: "modules",
    lesson: "hack/modules/using-internal",
    kind: "concept",
    level: 2,
    text: {"vi":"Trong hệ module, một symbol `internal` nghĩa là gì?","en":"In the module system, what does marking a symbol `internal` mean?"},
    options: ["Chỉ code nằm trong cùng module mới được tham chiếu tới nó","Chỉ chính lớp đó dùng được, kể cả subclass","Chỉ dùng được trong file khai báo nó","Nó bị xoá khỏi bản build production"],
    answer: 0,
    explanation: {"vi":"`internal` là mức hiển thị theo module: code ngoài module không được tham chiếu tới symbol đó, kể cả trong type hint, `new`, `is`/`as` hay `::class`. Symbol không đánh dấu gì là `public`, tức API công khai của module.","en":"`internal` is module-level visibility: code outside the module may not reference the symbol, including in type hints, `new`, `is`/`as` or `::class`. A symbol with no marker is `public`, part of the module's public API."},
  }),
  q({
    id: "module-definition-syntax",
    chapter: "modules",
    lesson: "hack/modules/defining-modules",
    kind: "concept",
    level: 1,
    text: {"vi":"Cú pháp nào khai báo một module mới?","en":"Which syntax declares a new module?"},
    options: ["`new module foo {}`","`module foo {}`","`module new foo;`","`namespace foo module;`"],
    answer: 0,
    explanation: {"vi":"Module khai báo bằng `new module foo {}` và mỗi module chỉ có đúng một định nghĩa. Thân module hiện đang rỗng; module nằm ở namespace riêng nên không đụng tên với class hay hàm.","en":"A module is declared with `new module foo {}` and may be defined only once. Module bodies are currently empty, and module names live in their own namespace so they do not clash with classes or functions."},
  }),
  q({
    id: "packages-transitive-deployment",
    chapter: "packages",
    lesson: "hack/packages/deployments",
    kind: "concept",
    level: 2,
    text: {"vi":"Một deployment trong `PACKAGES.toml` phải chứa những package nào?","en":"Which packages must a deployment in `PACKAGES.toml` list?"},
    options: ["Mọi package mà nó dùng, kể cả các phụ thuộc bắc cầu","Chỉ những package có chữ `test` trong tên","Đúng một package duy nhất","Chỉ package được nêu trực tiếp trong `include_paths`"],
    answer: 0,
    explanation: {"vi":"Deployment phải đóng theo phụ thuộc (transitively closed): nếu `app` phụ thuộc `utils` mà `utils` phụ thuộc `core` thì danh sách phải là `[\"app\", \"utils\", \"core\"]`. Thiếu một phụ thuộc bắc cầu là lỗi cấu hình.","en":"A deployment must be transitively closed: if `app` depends on `utils` and `utils` on `core`, the list has to be `[\"app\", \"utils\", \"core\"]`. Leaving out a transitive dependency is a configuration error."},
  }),
  q({
    id: "packages-toml-file",
    chapter: "packages",
    lesson: "hack/packages/introduction",
    kind: "concept",
    level: 1,
    text: {"vi":"Cấu hình package nằm ở file nào?","en":"Which file holds the package configuration?"},
    options: ["`PACKAGES.toml` ở gốc codebase","`.hhconfig`","`composer.json`","`hhvm.ini`"],
    answer: 0,
    explanation: {"vi":"`PACKAGES.toml` đặt cạnh `.hhconfig` ở gốc codebase, gồm mục `[packages]` (nhóm file theo `include_paths`, khai báo `includes`) và `[deployments]` (chọn package nào được build và chạy cùng nhau).","en":"`PACKAGES.toml` sits next to `.hhconfig` at the root of the codebase, with a `[packages]` section (grouping files by `include_paths` and declaring `includes`) and a `[deployments]` section (choosing which packages are built and run together)."},
  }),
  q({
    id: "expr-tree-not-executed",
    chapter: "expression-trees",
    lesson: "hack/expression-trees/introduction",
    kind: "concept",
    level: 2,
    text: {"vi":"Code nằm trong dấu backtick của expression tree, ví dụ ``MyDsl`1 + 2` ``, được xử lý thế nào?","en":"Code inside an expression tree's backticks, such as ``MyDsl`1 + 2` ``, is handled how?"},
    options: ["Không được thực thi; nó được biến thành lời gọi visitor trên DSL","Được chạy lúc biên dịch rồi thay bằng hằng số","Được chạy y như code Hack bình thường","Bị bỏ qua hoàn toàn và trả về `null`"],
    answer: 0,
    explanation: {"vi":"Expression tree **không chạy** đoạn code đó. Hack biến nó thành chuỗi lời gọi visitor như `visitBinop`, `visitInt` để DSL tự quyết định ý nghĩa — nhờ vậy vẫn có tô màu cú pháp, typecheck và gợi ý code.","en":"Expression trees do **not** execute the code. Hack turns it into visitor calls such as `visitBinop` and `visitInt`, letting the DSL decide what it means — which is why you still get syntax highlighting, type checking and completion."},
  }),
  q({
    id: "readonly-deep",
    chapter: "readonly",
    lesson: "hack/readonly/introduction",
    kind: "concept",
    level: 2,
    text: {"vi":"Một giá trị `readonly` có hai ràng buộc chính nào?","en":"What are the two main constraints on a `readonly` value?"},
    options: ["Không sửa được thuộc tính, và mọi thuộc tính lồng bên trong cũng readonly","Chỉ áp dụng cho biến `static`, không áp dụng cho tham số","Chỉ đọc được một lần rồi bị xoá","Phải là `int` hoặc `string`, không được là object"],
    answer: 0,
    explanation: {"vi":"`readonly` mang hai ý: **readonlyness** — không mutate được thuộc tính của object — và **deepness** — thuộc tính lồng nhau cũng readonly theo. Nó áp được cho biến, tham số, thuộc tính và cả kiểu trả về.","en":"`readonly` carries two ideas: **readonlyness** — object properties cannot be mutated — and **deepness** — nested properties are readonly too. It applies to locals, parameters, properties and return types."},
  }),
  q({
    id: "readonly-param-read",
    chapter: "readonly",
    lesson: "hack/readonly/syntax",
    kind: "predict",
    level: 2,
    text: {"vi":"Tham số `readonly` chỉ cấm ghi; đọc vẫn được. Đoạn này in gì?","en":"A `readonly` parameter forbids writes but still allows reads. What does this print?"},
    code: "<?hh\nclass P {\n  public function __construct(public int $x) {}\n}\nfunction read_it(readonly P $p): int {\n  return $p->x;\n}\nfunction main(): void {\n  echo read_it(new P(9));\n}",
    options: ["0","9","Lỗi: không đọc được thuộc tính `readonly`","Lỗi: `readonly` chỉ dùng cho biến"],
    answer: 1,
    explanation: {"vi":"`readonly` cấm **ghi**, không cấm đọc: hàm nhận tham số readonly vẫn đọc `$p->x` và trả về `9`. Nhờ vậy hàm không thể vô tình sửa object của caller.","en":"`readonly` forbids **writing**, not reading: a readonly parameter still lets the body read `$p->x` and return `9`. That is how the callee cannot accidentally mutate the caller's object."},
  }),
  q({
    id: "install-prebuilt-packages",
    chapter: "installation",
    lesson: "hhvm/installation/linux",
    kind: "concept",
    level: 1,
    text: {"vi":"Trên Linux, cách cài HHVM được khuyến nghị là gì?","en":"On Linux, what is the recommended way to install HHVM?"},
    options: ["Chỉ chạy được trong Docker, không cài trực tiếp","Dùng gói dựng sẵn (prebuilt) cho Debian/Ubuntu","Luôn build từ source để có bản mới nhất","Cài qua `pip`"],
    answer: 1,
    explanation: {"vi":"Tài liệu khuyên dùng gói dựng sẵn vì dễ và ổn định hơn; build từ source chỉ nên làm khi bạn cần tính năng chưa có trong gói. Lệnh cài dùng `apt-get`, thêm repository của HHVM rồi `apt-get install hhvm`.","en":"The docs recommend prebuilt packages as easier and more stable; build from source only when you need a feature not in a release. Installation uses `apt-get`, adding the HHVM repository and then `apt-get install hhvm`."},
  }),
  q({
    id: "install-docker-image",
    chapter: "installation",
    lesson: "hhvm/installation/docker",
    kind: "concept",
    level: 1,
    text: {"vi":"Image Docker chính thức của HHVM được publish ở đâu?","en":"Where are HHVM's official Docker images published?"},
    options: ["Chỉ trên ghcr.io","Không có image Docker chính thức","Docker Hub","npm registry"],
    answer: 2,
    explanation: {"vi":"Image được publish lên Docker Hub để chạy HHVM trong container. Bản docs cũ (trước khi chuyển sang Docusaurus) thì có ảnh riêng trên GHCR.","en":"Images are published to Docker Hub for running HHVM in a container. The older documentation site (before the Docusaurus move) has its own images on GHCR."},
  }),
  q({
    id: "install-release-cadence",
    chapter: "installation",
    lesson: "hhvm/installation/release-schedule",
    kind: "concept",
    level: 2,
    text: {"vi":"HHVM phát hành bản mới với nhịp nào?","en":"How often does HHVM release?"},
    options: ["Không có lịch cố định","Hai tuần một lần, phần lớn bản được hỗ trợ 6 tuần","Mỗi năm một bản LTS duy nhất","Mỗi ngày một bản, hỗ trợ 1 năm"],
    answer: 1,
    explanation: {"vi":"HHVM phát hành hai tuần một lần, lấy từ nightly build gần nhất; phần lớn bản chỉ được hỗ trợ 6 tuần, còn các bản LTS thì theo lịch riêng trên trang Release Schedule.","en":"HHVM releases every two weeks, promoting a recent nightly; most releases are supported for 6 weeks, while LTS releases follow their own schedule on the Release Schedule page."},
  }),
  q({
    id: "repo-authoritative-what",
    chapter: "advanced-usage",
    lesson: "hhvm/advanced-usage/repo-authoritative",
    kind: "concept",
    level: 2,
    text: {"vi":"Chế độ repo-authoritative khác cách chạy mặc định ở điểm nào?","en":"How does repo-authoritative mode differ from the default run mode?"},
    options: ["Chỉ dùng được với PHP, không dùng được với Hack","Mỗi request tạo một tiến trình HHVM mới","Code được thông dịch từng dòng, không biên dịch","Code được biên dịch sẵn vào một repo trước khi chạy, thay vì nạp và biên dịch lúc chạy"],
    answer: 3,
    explanation: {"vi":"Mặc định HHVM nạp và biên dịch file khi cần, nên `require` một file mới vẫn tạo được subclass mới. Repo-authoritative dựng repo trước (ví dụ `hhvm --hphp --input-dir /path`) rồi deploy, đổi linh hoạt lấy tối ưu.","en":"By default HHVM loads and compiles files on demand, so requiring a new file can still summon new subclasses. Repo-authoritative builds the repo ahead of time (for example `hhvm --hphp --input-dir /path`) and deploys it, trading flexibility for optimisation."},
  }),
  q({
    id: "server-modes",
    chapter: "advanced-usage",
    lesson: "hhvm/advanced-usage/introduction",
    kind: "concept",
    level: 1,
    text: {"vi":"Hai cách chạy HHVM được nhắc ngay từ đầu là gì?","en":"What are the two ways of running HHVM mentioned first?"},
    options: ["Docker và Kubernetes","Command-line để chạy script, và server để phục vụ request","REPL và JIT","Daemon và cron"],
    answer: 1,
    explanation: {"vi":"HHVM chạy script ở chế độ command-line, hoặc chạy như server phục vụ web request; các chế độ nâng cao như daemon, admin server, FastCGI là tuỳ chọn thêm.","en":"HHVM either runs scripts in command-line mode or serves web requests as a server; advanced modes such as daemon, admin server and FastCGI are optional extras."},
  }),
  q({
    id: "admin-server-role",
    chapter: "advanced-usage",
    lesson: "hhvm/advanced-usage/admin-server",
    kind: "concept",
    level: 2,
    text: {"vi":"Admin server của HHVM dùng để làm gì?","en":"What is HHVM's admin server for?"},
    options: ["Chạy các bài test tự động","Biên dịch repo-authoritative","Phục vụ các request web của người dùng","Cho quản trị viên truy vấn và điều khiển tiến trình HHVM đang chạy"],
    answer: 3,
    explanation: {"vi":"Admin server là kênh riêng, tách khỏi server chính: quản trị viên dùng nó để xem trạng thái và điều khiển tiến trình HHVM, không phải để phục vụ người dùng cuối.","en":"The admin server is a separate channel from the main server: administrators use it to inspect and control the HHVM process, not to serve end users."},
  }),
  q({
    id: "extensions-loaded",
    chapter: "extensions",
    lesson: "hhvm/extensions/introduction",
    kind: "concept",
    level: 1,
    text: {"vi":"Làm sao biết một extension có sẵn trong HHVM đang chạy?","en":"How do you check whether an extension is available in a running HHVM?"},
    options: ["Chạy `hhvm --version`","Gọi `get_loaded_extensions()`","Xem `.hhconfig`","Đọc file `composer.json`"],
    answer: 1,
    explanation: {"vi":"`get_loaded_extensions()` liệt kê các extension tích hợp sẵn; HHVM cũng cho nạp thêm extension động. Lưu ý tài liệu của các extension này trỏ về PHP và HHVM đã dần tách khỏi PHP, nên tính năng mới của PHP có thể không có.","en":"`get_loaded_extensions()` lists the built-in extensions, and HHVM can also load extensions dynamically. Note that these extensions are documented against PHP and HHVM has drifted away from it, so newer PHP features may be missing."},
  }),
  q({
    id: "experimental-opt-in",
    chapter: "experimental-features",
    lesson: "hack/experimental-features/introduction",
    kind: "concept",
    level: 2,
    text: {"vi":"Muốn dùng một tính năng thử nghiệm của Hack thì phải làm gì?","en":"What must you do to use an experimental Hack feature?"},
    options: ["Đổi phần mở rộng file thành `.exphack`","Khai báo `use experimental;` ở đầu file","Thêm attribute `<<file:__EnableUnstableFeatures('tên_tính_năng')>>` vào file","Chạy HHVM với cờ `--experimental`"],
    answer: 2,
    explanation: {"vi":"Tính năng thử nghiệm phải bật rõ ràng bằng attribute `__EnableUnstableFeatures` ở cấp file, kèm tên tính năng. Tài liệu khuyên không dùng trước khi tính năng được công bố chính thức.","en":"An experimental feature must be explicitly enabled with the file-level `__EnableUnstableFeatures` attribute naming the feature. The docs advise against using them before they are formally announced."},
  }),
  q({
    id: "contributing-code-samples",
    chapter: "contributing",
    lesson: "hack/contributing/code-samples",
    kind: "concept",
    level: 1,
    text: {"vi":"Code mẫu trong tài liệu này được kiểm tra thế nào?","en":"How are the code samples in this documentation checked?"},
    options: ["Không được kiểm tra gì cả","Chỉ được đọc bằng mắt khi review","Chúng được typecheck và chạy tự động để chắc chắn đúng","Chỉ được kiểm tra cú pháp bằng regex"],
    answer: 2,
    explanation: {"vi":"Mọi code mẫu đều được typecheck và thực thi tự động; ví dụ đánh dấu `no-extract` thì không chạy, còn `error` thì phải gây lỗi. Đây cũng là lý do những đoạn snippet trong ứng dụng này được chạy thử trước khi đưa vào ngân hàng câu hỏi.","en":"Every sample is type checked and executed automatically; `no-extract` samples are not run and `error` samples must fail. That is the same discipline this app uses: a snippet goes into the bank only after the interpreter has run it."},
  }),
  q({
    id: "contributing-site-build",
    chapter: "contributing",
    lesson: "hack/contributing/introduction",
    kind: "concept",
    level: 1,
    text: {"vi":"Trang tài liệu này được dựng bằng công cụ nào, và chạy local ra sao?","en":"What builds this documentation site, and how do you run it locally?"},
    options: ["Jekyll; chạy `bundle exec jekyll serve`","Docusaurus; vào `website/`, chạy `yarn install` rồi `yarn start`","Không có bản chạy local","MkDocs; chạy `mkdocs serve`"],
    answer: 1,
    explanation: {"vi":"Site dùng Docusaurus: trong thư mục `website/` chạy `yarn install` và `yarn start` để mở server ở cổng 3000, có hot reload khi sửa nội dung. Cần Node.js v20 trở lên.","en":"The site is built with Docusaurus: inside `website/`, `yarn install` then `yarn start` serves on port 3000 with live reload as you edit. Node.js v20 or above is required."},
  }),
  q({
    id: "contributing-writing-content",
    chapter: "contributing",
    lesson: "hack/contributing/writing-content",
    kind: "concept",
    level: 2,
    text: {"vi":"Website tài liệu chia nội dung thành ba phần nào?","en":"Which three sections does the documentation site split its content into?"},
    options: ["Docs, Blog và Changelog","Language, Library và Tools","Beginner, Intermediate và Advanced","Hack, HHVM và Contributing"],
    answer: 3,
    explanation: {"vi":"Nội dung chia làm ba phần: **Hack** (ngôn ngữ), **HHVM** (hướng dẫn sử dụng HHVM) và **Contributing** (cách đóng góp cho chính trang tài liệu).","en":"Content is split into **Hack** (the language), **HHVM** (the user guide) and **Contributing** (how to contribute to the documentation site itself)."},
  }),
];

export const EXAM_KINDS = ["concept", "predict", "fill", "order"];
