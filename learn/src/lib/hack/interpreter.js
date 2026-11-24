// A small Hack interpreter, written for the playground in this folder.
//
// HHVM itself is a C++ virtual machine and cannot run in a browser tab. This
// file runs the part of Hack that introductory snippets use, so that the
// playground can execute code instead of only displaying it: values, strings,
// vec / dict / keyset, loops, functions, closures, classes, inheritance,
// interfaces, enums, shapes and exceptions.
//
// It is not HHVM and does not try to be. Type declarations are parsed and then
// ignored, as they are at runtime in HHVM; a type error is a type checker error,
// not a runtime error. Output and error messages follow HHVM's format
// ("Fatal error: Uncaught ...") but wording can differ.
//
// The entry point is `runHack(source, options)`, a pure function: no globals are
// read or written, and the caller decides what to do with the result.

const MAX_STEPS = 3_000_000;
const MAX_DEPTH = 200;
const MAX_OUTPUT = 200_000;
const MAX_COLLECTION = 200_000;

// ---------------------------------------------------------------------------
// Lexer
// ---------------------------------------------------------------------------

const PUNCT = [
  "<<=", ">>=", "===", "!==", "<=>", "**=", "?->", "==>", "...", "<<", ">>", "<=", ">=", "==", "!=",
  "&&", "||", "??=", "**", "++", "--", "+=", "-=", "*=", "/=", ".=", "%=", "&=", "|=", "^=", "=>",
  "|?>", "->", "::", "??", "|>", ":::", "#[",
];

const KEYWORDS = new Set([
  "function", "class", "interface", "trait", "extends", "implements", "return", "if", "else",
  "elseif", "while", "for", "foreach", "as", "echo", "print", "new", "true", "false", "null",
  "namespace", "use", "abstract", "final", "public", "private", "protected", "static", "const",
  "instanceof", "switch", "case", "default", "break", "continue", "do", "try", "catch", "finally",
  "throw", "enum", "async", "await", "yield", "inout", "shape", "vec", "dict", "keyset", "tuple",
  "type", "newtype", "required", "optional", "readonly", "matches", "super", "self", "parent",
  "this", "include", "require", "insteadof", "list", "and", "or", "xor", "goto", "global",
]);

class HackError extends Error {
  constructor(message, line = 0) {
    super(message);
    this.line = line;
  }
}

// Normalise one line of source: drop `<?hh`, drop `//` comments that are not
// inside a string, keep everything else verbatim so column details survive.
const tokenize = (source) => {
  const tokens = [];
  let i = 0;
  let line = 1;

  const push = (type, value, extra = {}) => tokens.push({ type, value, line, ...extra });

  while (i < source.length) {
    const ch = source[i];

    if (ch === "\n") {
      line += 1;
      i += 1;
      continue;
    }
    if (ch === " " || ch === "\t" || ch === "\r") {
      i += 1;
      continue;
    }

    if (source.startsWith("<?hh", i) || source.startsWith("<?php", i)) {
      i += source.startsWith("<?hh", i) ? 4 : 5;
      continue;
    }

    // Comments
    if (ch === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "#" && source[i + 1] !== "[") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "/" && source[i + 1] === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
        if (source[i] === "\n") line += 1;
        i += 1;
      }
      i += 2;
      continue;
    }

    // Attributes: <<__EntryPoint>>, <<Attr('x')>> — skipped, they have no
    // effect on the code this interpreter runs.
    if (ch === "<" && source[i + 1] === "<" && /[A-Za-z_\\]/.test(source[i + 2] || "")) {
      let depth = 0;
      let j = i;
      while (j < source.length) {
        if (source.startsWith("<<", j)) {
          depth += 1;
          j += 2;
          continue;
        }
        if (source.startsWith(">>", j) && !(source[j] === ">" && source[j + 1] === "=")) {
          depth -= 1;
          j += 2;
          if (depth <= 0) break;
          continue;
        }
        if (source[j] === "\n") line += 1;
        j += 1;
      }
      i = j;
      continue;
    }

    // Strings
    if (source.startsWith('"""', i)) {
      const end = source.indexOf('"""', i + 3);
      if (end === -1) throw new HackError("unterminated heredoc", line);
      const body = source.slice(i + 3, end);
      line += (body.match(/\n/g) || []).length;
      push("string", body, { interp: true });
      i = end + 3;
      continue;
    }
    if (source.startsWith("<<<", i)) {
      // `<<<ID` and `<<<   ID` are both Heredocs; PHP allows space after `<<<`.
      const header = source.slice(i).match(/^<<<[ \t]*(['"]?)([A-Za-z_]\w*)\1\r?\n/);
      if (!header) throw new HackError("invalid heredoc", line);
      const marker = header[2];
      // Nowdoc (`<<<'ID'`) keeps `$var` literal; heredoc interpolates it.
      const interpolate = header[1] !== "'";
      const after = i + header[0].length;
      const close = source.slice(after).search(new RegExp(`\\n[ \\t]*${marker};?`));
      if (close === -1) throw new HackError(`unterminated heredoc ${marker}`, line);
      const body = source.slice(after, after + close);
      line += (body.match(/\n/g) || []).length + 1;
      push("string", body, { interp: interpolate });
      const rest = source.slice(after + close + 1).match(new RegExp(`[ \\t]*${marker}`));
      i = after + close + 1 + rest[0].length;
      // The `;` after the marker ends the statement; keep it as a token so
      // `$x = <<<ID ... ID;` parses like any other assignment.
      if (source[i] === ";") {
        push("punct", ";");
        i += 1;
      }
      continue;
    }
    if (ch === "'") {
      let j = i + 1;
      let out = "";
      while (j < source.length && source[j] !== "'") {
        if (source[j] === "\\") {
          const next = source[j + 1];
          out += next === "'" ? "'" : next === "\\" ? "\\" : `\\${next}`;
          j += 2;
          continue;
        }
        if (source[j] === "\n") line += 1;
        out += source[j];
        j += 1;
      }
      if (j >= source.length) throw new HackError("unterminated string", line);
      push("string", out, { interp: false });
      i = j + 1;
      continue;
    }
    if (ch === '"' || ch === "`") {
      let j = i + 1;
      let out = "";
      while (j < source.length && source[j] !== ch) {
        if (source[j] === "\\" && source[j + 1] !== undefined) {
          out += source[j] + source[j + 1];
          j += 2;
          continue;
        }
        if (source[j] === "\n") line += 1;
        out += source[j];
        j += 1;
      }
      if (j >= source.length) throw new HackError("unterminated string", line);
      push("string", out, { interp: true });
      i = j + 1;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(source[i + 1] || ""))) {
      const match = source.slice(i).match(/^(0[xX][0-9a-fA-F]+|0[bB][01]+|\d+\.\d+(?:[eE][-+]?\d+)?|\.\d+(?:[eE][-+]?\d+)?|\d+(?:[eE][-+]?\d+)?)/);
      const text = match[0];
      if (/^0[xX]/.test(text)) push("number", parseInt(text.slice(2), 16));
      else if (/^0[bB]/.test(text)) push("number", parseInt(text.slice(2), 2));
      else push("number", Number(text));
      i += text.length;
      continue;
    }

    // Identifiers, including namespaces (HH\Lib\...) and a leading backslash.
    const ident = source.slice(i).match(/^\\?[A-Za-z_][A-Za-z0-9_]*(?:\\[A-Za-z_][A-Za-z0-9_]*)*/);
    if (ident) {
      push("ident", ident[0]);
      i += ident[0].length;
      continue;
    }

    // Variables
    if (ch === "$") {
      const variable = source.slice(i).match(/^\$[A-Za-z_][A-Za-z0-9_]*/);
      if (variable) {
        push("var", variable[0].slice(1));
        i += variable[0].length;
        continue;
      }
      if (source[i + 1] === "$") {
        push("punct", "$$");
        i += 2;
        continue;
      }
      throw new HackError("unexpected '$'", line);
    }

    // Pipeline placeholder
    if (source.startsWith("$$", i)) {
      push("punct", "$$");
      i += 2;
      continue;
    }

    if (ch === "\\") {
      push("punct", "\\");
      i += 1;
      continue;
    }

    const punct = PUNCT.find((candidate) => source.startsWith(candidate, i));
    if (punct) {
      push("punct", punct);
      i += punct.length;
      continue;
    }
    if ("(){}[];,:?.+-*/%<>=!&|^~@".includes(ch)) {
      push("punct", ch);
      i += 1;
      continue;
    }

    throw new HackError(`unexpected character '${ch}'`, line);
  }

  push("eof", "");
  return tokens;
};

// ---------------------------------------------------------------------------
// Parser — produces a plain-object AST.
// ---------------------------------------------------------------------------

const BINARY_PRECEDENCE = {
  "??": 0,
  "||": 1, "&&": 2, "|": 3, "^": 4, "&": 5,
  "==": 6, "!=": 6, "===": 6, "!==": 6, "<=>": 6,
  "<": 7, ">": 7, "<=": 7, ">=": 7,
  "|>": 8, "|?>": 8,
  "<<": 9, ">>": 9,
  "+": 10, "-": 10, ".": 10,
  "*": 11, "/": 11, "%": 11,
  "**": 12,
};

const ASSIGN_OPS = new Set(["=", "+=", "-=", "*=", "/=", ".=", "%=", "**=", "??=", "<<=", ">>=", "&=", "|=", "^="]);

const TYPE_END = new Set([")", "{", "}", ";", ",", ">", ">>", "=", "=>", "&&", "||", "|>", "]", ":"]);
const TYPE_SKIP = new Set([
  "null", "bool", "int", "float", "num", "string", "arraykey", "void", "mixed", "nonnull", "nothing",
  "noreturn", "resource", "dynamic", "this", "shape", "vec", "dict", "keyset", "tuple", "required",
  "optional", "array", "varray", "darray", "async", "const", "self", "parent", "static", "?",
]);

class Parser {
  constructor(tokens, options = {}) {
    this.tokens = tokens;
    this.pos = 0;
    this.loopDepth = 0;
    this.noAs = false;
    // Tolerant mode keeps going through syntax the interpreter has no use for
    // (contexts, type constants, `as` casts). It is on for the playground so a
    // page of the manual can always be run; the test suite turns it off to
    // catch accidental grammar changes.
    this.tolerant = options.tolerant !== false;
    this.skipped = 0;
  }

  emptyStatement(line = this.token.line) {
    return { type: "Empty", line };
  }

  get token() {
    return this.tokens[this.pos];
  }

  peek(offset = 1) {
    return this.tokens[Math.min(this.pos + offset, this.tokens.length - 1)];
  }

  // The identifier just before the current position, used for `const T NAME =`.
  previousIdent() {
    let index = this.pos - 1;
    while (index >= 0 && this.tokens[index].type !== "ident") index -= 1;
    return index >= 0 ? this.tokens[index].value : "";
  }

  at(type, value) {
    const token = this.token;
    return token.type === type && (value === undefined || token.value === value);
  }

  atPunct(value) {
    return this.at("punct", value);
  }

  atIdent(value) {
    return this.at("ident", value);
  }

  next() {
    const token = this.tokens[this.pos];
    this.pos += 1;
    return token;
  }

  expectPunct(value) {
    if (!this.atPunct(value)) {
      throw new HackError(`expected '${value}' but found '${this.token.value || this.token.type}'`, this.token.line);
    }
    return this.next();
  }

  expectIdent(value) {
    if (!this.atIdent(value)) {
      throw new HackError(`expected '${value}' but found '${this.token.value || this.token.type}'`, this.token.line);
    }
    return this.next();
  }

  accept(type, value) {
    if (this.at(type, value)) {
      this.next();
      return true;
    }
    return false;
  }

  // -- statements -----------------------------------------------------------

  parseProgram() {
    const body = [];
    while (!this.at("eof")) {
      const before = this.pos;
      try {
        body.push(this.parseStatement());
      } catch (error) {
        if (!this.tolerant || !this.skipToStatementEnd(before, error)) throw error;
      }
    }
    return { type: "Program", body, line: 1 };
  }

  // Move past a declaration that cannot be parsed: to the end of the
  // statement, or to the end of the block it opened. Only used in tolerant
  // mode, and never inside a function body, so that errors in user code still
  // surface with the right line.
  skipToStatementEnd(from, error) {
    if (!(error instanceof HackError)) return false;
    this.pos = from;
    let depth = 0;
    while (!this.at("eof")) {
      if (this.atPunct("{")) depth += 1;
      if (this.atPunct("}")) {
        if (depth === 0) return false; // do not swallow the closing brace
        depth -= 1;
        this.next();
        if (depth === 0) {
          this.skipped += 1;
          return true;
        }
        continue;
      }
      if (this.atPunct(";") && depth === 0) {
        this.next();
        this.skipped += 1;
        return true;
      }
      this.next();
    }
    return false;
  }

  parseBlock() {
    const line = this.token.line;
    this.expectPunct("{");
    const body = [];
    while (!this.atPunct("}")) {
      if (this.at("eof")) throw new HackError("unexpected end of file, expected '}'", this.token.line);
      body.push(this.parseStatement());
    }
    this.next();
    return { type: "Block", body, line };
  }

  parseStatement() {
    const token = this.token;
    const line = token.line;

    if (this.accept("punct", ";")) return { type: "Empty", line };
    if (this.atPunct("{")) return this.parseBlock();

    if (token.type === "ident") {
      switch (token.value) {
        case "namespace": {
          this.next();
          const name = [];
          while (!this.atPunct(";") && !this.atPunct("{") && !this.at("eof")) name.push(this.next().value);
          if (this.atPunct("{")) {
            const block = this.parseBlock();
            return { type: "Namespace", name: name.join(""), body: block.body, line };
          }
          this.expectPunct(";");
          return { type: "Empty", line };
        }
        case "use": {
          this.next();
          const names = [];
          if (this.atIdent("namespace")) this.next();
          while (!this.atPunct(";") && !this.at("eof")) names.push(this.next().value);
          this.expectPunct(";");
          return { type: "Use", names, line };
        }
        case "const": {
          this.next();
          const entries = [];
          let name = "";
          while (!this.atPunct("=") && !this.at("eof")) {
            const part = this.next();
            if (part.type === "ident" && part.value !== "const") name = part.value;
          }
          for (;;) {
            this.expectPunct("=");
            entries.push({ name, value: this.parseExpression() });
            if (!this.accept("punct", ",")) break;
            while (!this.atPunct("=") && !this.at("eof")) {
              const part = this.next();
              if (part.type === "ident") name = part.value;
            }
          }
          this.expectPunct(";");
          return { type: "ConstDecl", entries, line };
        }
        case "type":
        case "newtype":
        case "context":
        case "case":
        case "module":
        case "package":
        case "require":
        case "internal": {
          // Declarations that only the type checker uses, plus `context` names.
          this.next();
          while (!this.atPunct(";") && this.atPunct("::") === false && !this.at("eof")) {
            if (this.atPunct("{")) {
              // A block of the same kind (`package foo { ... }`).
              const block = this.parseBlock();
              return { type: "Block", body: block.body, line };
            }
            if (this.atPunct("=")) {
              // `case type X = ...;`
              this.next();
              while (!this.atPunct(";") && !this.at("eof")) {
                if (this.atPunct(",")) {
                  this.next();
                  continue;
                }
                if (this.atPunct("{")) return this.emptyStatement(line);
                this.next();
              }
              break;
            }
            this.next();
          }
          this.accept("punct", ";");
          return this.emptyStatement(line);
        }
        case "abstract":
        case "final":
        case "readonly": {
          const modifier = this.next().value;
          if (this.atIdent("class")) return this.parseClass(modifier);
          return { type: "Empty", line };
        }
        case "class":
        case "interface":
        case "trait":
          return this.parseClass(null);
        case "enum":
          return this.parseEnum();
        case "function":
          return this.parseFunctionDeclaration();
        case "async":
          if (this.peek().type === "ident" && this.peek().value === "function") {
            this.next();
            return this.parseFunctionDeclaration(true);
          }
          break;
        case "public":
        case "private":
        case "protected":
        case "static":
        case "final": {
          const modifier = this.next().value;
          if (this.atIdent("class")) return this.parseClass(modifier);
          if (this.atIdent("function") || this.atIdent("async")) return this.parseModifierFunction(modifier);
          if (!this.tolerant) {
            throw new HackError(`unexpected '${modifier}'`, line);
          }
          this.accept("punct", ";");
          return this.emptyStatement(line);
        }
        case "echo":
        case "print": {
          this.next();
          const values = [this.parseExpression()];
          while (this.accept("punct", ",")) values.push(this.parseExpression());
          this.expectPunct(";");
          return { type: "Echo", values, line };
        }
        case "return": {
          this.next();
          const value = this.atPunct(";") ? null : this.parseExpression();
          this.expectPunct(";");
          return { type: "Return", value, line };
        }
        case "if":
          return this.parseIf();
        case "while": {
          this.next();
          const test = this.parseParenExpression();
          const body = this.parseStatement();
          return { type: "While", test, body, line };
        }
        case "do": {
          this.next();
          const body = this.parseStatement();
          this.expectIdent("while");
          const test = this.parseParenExpression();
          this.expectPunct(";");
          return { type: "DoWhile", test, body, line };
        }
        case "for": {
          this.next();
          this.expectPunct("(");
          const init = [];
          while (!this.atPunct(";")) {
            init.push(this.parseExpression());
            if (!this.accept("punct", ",")) break;
          }
          this.expectPunct(";");
          const test = [];
          while (!this.atPunct(";")) {
            test.push(this.parseExpression());
            if (!this.accept("punct", ",")) break;
          }
          this.expectPunct(";");
          const update = [];
          while (!this.atPunct(")")) {
            update.push(this.parseExpression());
            if (!this.accept("punct", ",")) break;
          }
          this.expectPunct(")");
          const body = this.parseStatement();
          return { type: "For", init, test, update, body, line };
        }
        case "foreach": {
          this.next();
          this.expectPunct("(");
          const savedAs = this.noAs;
          this.noAs = true;
          const subject = this.parseExpression();
          this.noAs = savedAs;
          this.expectIdent("as");
          let key = null;
          let byRef = this.accept("punct", "&");
          let value = this.parseExpression();
          if (this.accept("punct", "=>")) {
            key = value;
            byRef = this.accept("punct", "&");
            value = this.parseExpression();
          }
          this.expectPunct(")");
          const body = this.parseStatement();
          return { type: "Foreach", subject, key, value, byRef, body, line };
        }
        case "switch":
          return this.parseSwitch();
        case "break":
        case "continue": {
          this.next();
          const level = this.atPunct(";") ? null : this.parseExpression();
          this.expectPunct(";");
          return { type: token.value === "break" ? "Break" : "Continue", level, line };
        }
        case "try":
          return this.parseTry();
        case "throw": {
          this.next();
          const value = this.parseExpression();
          this.expectPunct(";");
          return { type: "Throw", value, line };
        }
        case "static": {
          // `static $x = 0;` inside a function (rare) — treat as assignment.
          if (this.peek().type === "var") {
            this.next();
            const name = this.next().value;
            let value = null;
            if (this.accept("punct", "=")) value = this.parseExpression();
            this.expectPunct(";");
            return { type: "VarDecl", name, value, line };
          }
          break;
        }
        default:
          break;
      }
    }

    const expression = this.parseExpression();
    this.expectPunct(";");
    return { type: "ExpressionStatement", expression, line };
  }

  parseParenExpression() {
    this.expectPunct("(");
    const value = this.parseExpression();
    this.expectPunct(")");
    return value;
  }

  parseIf() {
    const line = this.token.line;
    this.expectIdent("if");
    const test = this.parseParenExpression();
    const consequent = this.parseStatement();
    let alternate = null;
    if (this.atIdent("elseif")) {
      alternate = this.parseIfFrom("elseif");
    } else if (this.atIdent("else")) {
      this.next();
      alternate = this.parseStatement();
    }
    return { type: "If", test, consequent, alternate, line };
  }

  parseIfFrom(keyword) {
    const line = this.token.line;
    this.expectIdent(keyword);
    const test = this.parseParenExpression();
    const consequent = this.parseStatement();
    let alternate = null;
    if (this.atIdent("elseif")) alternate = this.parseIfFrom("elseif");
    else if (this.atIdent("else")) {
      this.next();
      alternate = this.parseStatement();
    }
    return { type: "If", test, consequent, alternate, line };
  }

  parseSwitch() {
    const line = this.token.line;
    this.expectIdent("switch");
    const subject = this.parseParenExpression();
    this.expectPunct("{");
    const cases = [];
    while (!this.atPunct("}")) {
      let test = null;
      if (this.accept("ident", "case")) {
        test = this.parseExpression();
        if (!this.accept("punct", ":")) this.expectPunct(";");
      } else if (this.accept("ident", "default")) {
        if (!this.accept("punct", ":")) this.expectPunct(";");
      } else {
        throw new HackError("expected 'case' or 'default'", this.token.line);
      }
      const body = [];
      while (!this.atIdent("case") && !this.atIdent("default") && !this.atPunct("}")) {
        if (this.at("eof")) throw new HackError("unexpected end of switch", this.token.line);
        body.push(this.parseStatement());
      }
      cases.push({ test, body });
    }
    this.next();
    return { type: "Switch", subject, cases, line };
  }

  parseTry() {
    const line = this.token.line;
    this.expectIdent("try");
    const block = this.parseStatement();
    const catches = [];
    let finalizer = null;
    while (this.atIdent("catch")) {
      this.next();
      this.expectPunct("(");
      const handlers = [];
      do {
        while (this.atPunct("\\")) this.next();
        const name = this.next().value;
        handlers.push(name);
      } while (this.accept("punct", "|"));
      const variable = this.token.type === "var" ? this.next().value : null;
      this.expectPunct(")");
      const body = this.parseStatement();
      catches.push({ handlers, variable, body });
    }
    if (this.atIdent("finally")) {
      this.next();
      finalizer = this.parseStatement();
    }
    if (catches.length === 0 && !finalizer) {
      throw new HackError("try without catch or finally", line);
    }
    return { type: "Try", block, catches, finalizer, line };
  }

  // -- declarations ---------------------------------------------------------

  // Consume a type annotation and leave the position on the declaration that
  // follows it. Types are not used at runtime, so reading them is enough.
  skipType(fromIdent) {
    let depth = 0;
    const start = this.pos;
    if (fromIdent && this.atPunct("?")) this.next();
    if (fromIdent && this.token.type === "ident") this.next();
    while (!this.at("eof")) {
      const token = this.token;

      if (depth === 0) {
        if (token.type === "var") return;
        if (token.type === "string" || token.type === "number") return;
        if (TYPE_END.has(token.value) && token.type !== "ident") return;
        if (token.type === "ident" && token.value === "as") return;
      }

      if (token.type === "punct") {
        if (token.value === "?") {
          this.next();
          continue;
        }
        if (token.value === "::") {
          // `this::T`, `C::T` — a type constant used as a type.
          this.next();
          if (this.token.type === "ident") this.next();
          continue;
        }
        if (token.value === "<" || token.value === "(") {
          if (depth === 0 && this.pos === start) {
            // A bracket that is not attached to a name: `(int, string)`.
          } else if (depth === 0 && this.tokens[this.pos - 1].value === "?" ) {
            this.next();
            continue;
          }
          depth += 1;
          this.next();
          continue;
        }
        if (token.value === ">" || token.value === ")" || token.value === "]" || token.value === "}" || token.value === ">>") {
          depth -= 1;
          this.next();
          if (depth <= 0) return;
          continue;
        }
        if (depth === 0 && [",", "=", "=>", ";", "|", "&"].includes(token.value)) return;
      }

      this.next();
    }
  }

  parseParams() {
    this.expectPunct("(");
    const params = [];
    while (!this.atPunct(")")) {
      let promoted = null;
      while (this.token.type === "ident" && ["public", "private", "protected", "readonly"].includes(this.token.value)) {
        const modifier = this.next().value;
        if (modifier !== "readonly") promoted = modifier;
        else promoted = promoted || "public";
      }
      if (this.atPunct("...")) {
        this.next();
        const names = [];
        while (!this.atPunct(")")) names.push(this.next().value);
        params.push({ variadic: true, name: names.join(""), type: null, byRef: false });
        break;
      }
      let type = null;
      this.accept("ident", "inout");
      if (this.token.type === "var") {
        // untyped
      } else {
        const start = this.pos;
        this.skipType(true);
        type = this.tokens.slice(start, this.pos).map((t) => t.value).join("");
      }
      if (this.accept("punct", "&")) {
        // by-ref parameter: the slice above may have consumed it; handled below
      }
      if (this.atPunct("...")) {
        this.next();
      }
      if (this.token.type !== "var") {
        // Type was consumed and the next token is not a variable: tolerate.
        if (this.atPunct(",")) {
          this.next();
          continue;
        }
        throw new HackError("expected a parameter name", this.token.line);
      }
      const name = this.next().value;
      let defaultValue = null;
      if (this.accept("punct", "=")) {
        // Skip the default without running it; defaults are evaluated separately.
        defaultValue = this.parseExpression();
      }
      params.push({ name, type, defaultValue, variadic: false, byRef: false, promoted });
      if (!this.accept("punct", ",")) break;
    }
    this.expectPunct(")");
    return params;
  }

  parseReturnType() {
    if (this.atPunct(":")) {
      this.next();
      this.skipType(true);
      while (this.atPunct("[")) this.skipType(false); // `int[]`, `vec<int>[]`
    }
  }

  // `[defaults, write_props]` — a context list. The interpreter has no
  // capabilities, so the list is read and dropped.
  skipContexts() {
    this.expectPunct("[");
    let depth = 1;
    while (depth > 0 && !this.at("eof")) {
      if (this.atPunct("[")) depth += 1;
      if (this.atPunct("]")) depth -= 1;
      this.next();
    }
  }

  parseModifierFunction(modifier) {
    let isAsync = false;
    if (this.atIdent("async")) {
      isAsync = true;
      this.next();
    }
    return this.parseFunctionDeclaration(isAsync);
  }

  parseFunctionDeclaration(isAsync = false) {
    const line = this.token.line;
    this.expectIdent("function");
    if (this.accept("punct", "&")) {
      // returns by reference; irrelevant here
    }
    const name = this.next().value;
    if (this.atPunct("<")) this.skipType(false);
    const params = this.parseParams();
    if (this.atPunct("[")) this.skipContexts();
    this.parseReturnType();
    if (this.atPunct("[")) this.skipContexts();
    const saved = this.loopDepth;
    this.loopDepth = 0;
    const body = this.parseBlock();
    this.loopDepth = saved;
    return {
      type: "FunctionDeclaration",
      name: name.replace(/^\\/, ""),
      params,
      body,
      isAsync,
      isMethod: false,
      line,
    };
  }

  parseClass(modifier) {
    const line = this.token.line;
    const kind = this.next().value; // class | interface | trait
    const name = this.next().value;
    let parent = null;
    const interfaces = [];
    if (this.accept("ident", "extends")) {
      parent = this.next().value;
      if (kind !== "class") {
        while (this.accept("punct", ",")) interfaces.push(this.next().value);
      }
    }
    if (this.accept("ident", "implements")) {
      do {
        interfaces.push(this.next().value);
      } while (this.accept("punct", ","));
    }
    this.expectPunct("{");

    const methods = [];
    const properties = [];
    const constants = [];
    const traits = [];
    let currentModifiers = new Set();

    while (!this.atPunct("}")) {
      if (this.at("eof")) throw new HackError(`unexpected end of file in ${kind} ${name}`, this.token.line);
      const token = this.token;

      // A property whose type starts with '?' (`private ?int $x`), or has no
      // type at all (`public $x`). Both start with a token that is not a name.
      if (this.atPunct("?") || token.type === "var") {
        this.skipType(false);
        const propName = this.next().value;
        let defaultValue = null;
        if (this.accept("punct", "=")) defaultValue = this.parseExpression();
        this.expectPunct(";");
        properties.push({
          name: propName,
          defaultValue,
          isStatic: currentModifiers.has("static"),
          visibility: currentModifiers.has("private") ? "private" : currentModifiers.has("protected") ? "protected" : "public",
        });
        currentModifiers = new Set();
        continue;
      }

      if (token.type === "ident") {
        if (["public", "private", "protected", "static", "abstract", "final", "readonly"].includes(token.value)) {
          currentModifiers.add(this.next().value);
          continue;
        }
        if (token.value === "const") {
          this.next();
          if (this.atIdent("type")) {
            // `const type T = ...` is a type constant: no runtime value.
            this.next();
            while (!this.atPunct(";") && !this.at("eof")) this.next();
            this.accept("punct", ";");
            currentModifiers = new Set();
            continue;
          }
          while (!this.atPunct("=") && !this.at("eof")) this.next(); // the type
          let constName = this.previousIdent();
          for (;;) {
            this.expectPunct("=");
            constants.push({ name: constName, value: this.parseExpression() });
            if (!this.accept("punct", ",")) break;
            constName = "";
            while (!this.atPunct("=") && !this.at("eof")) {
              const part = this.next();
              if (part.type === "ident") constName = part.value;
            }
          }
          this.expectPunct(";");
          currentModifiers = new Set();
          continue;
        }
        if (token.value === "async" && this.peek().value === "function") {
          this.next();
        }
        if (token.value === "function" || token.value === "async") {
          this.next();
          this.accept("punct", "&");
          const methodName = this.next().value;
          if (this.atPunct("<")) this.skipType(false);
          const params = this.parseParams();
          if (this.atPunct("[")) this.skipContexts();
          this.parseReturnType();
          if (this.atPunct("[")) this.skipContexts();
          let body = null;
          if (this.atPunct("{")) {
            const saved = this.loopDepth;
            this.loopDepth = 0;
            body = this.parseBlock();
            this.loopDepth = saved;
          } else {
            this.expectPunct(";");
          }
          methods.push({
            name: methodName,
            params,
            body,
            isStatic: currentModifiers.has("static"),
            isAbstract: !body,
            line,
          });
          currentModifiers = new Set();
          continue;
        }
        if (token.value === "use") {
          this.next();
          do {
            const parts = [];
            while (this.atPunct("\\")) this.next();
            if (this.at("eof") || this.atPunct(";") || this.atPunct("{")) break;
            parts.push(this.next().value);
            while (!this.atPunct(",") && !this.atPunct(";") && !this.atPunct("{") && !this.at("eof")) {
              parts.push(this.next().value);
            }
            traits.push(parts.join("").replace(/^\\/, ""));
          } while (this.accept("punct", ","));
          while (!this.atPunct(";") && !this.atPunct("{") && !this.at("eof")) this.next();
          if (this.atPunct("{")) {
            let depth = 0;
            do {
              if (this.atPunct("{")) depth += 1;
              if (this.atPunct("}")) depth -= 1;
              this.next();
            } while (depth > 0 && !this.at("eof"));
          } else {
            this.expectPunct(";");
          }
          continue;
        }
        if (token.value === "type" || token.value === "newtype") {
          // `const type T`, `abstract const type T` — type constants have no
          // runtime value, and no `=` is guaranteed.
          this.next();
          while (!this.atPunct(";") && !this.atPunct("=") && !this.at("eof")) this.next();
          if (this.accept("punct", "=")) this.skipExpression();
          this.accept("punct", ";");
          continue;
        }
        // Property with a type, e.g. `public int $value = 0;` — the type ends
        // at the variable, which is the one token this series always has.
        if (this.atPunct("?") || this.token.type === "var" || this.peek().type === "var") {
          this.skipType(false); // the type — the '?' is a separator, not a name
          const propName = this.next().value;
          let defaultValue = null;
          if (this.accept("punct", "=")) defaultValue = this.parseExpression();
          this.expectPunct(";");
          properties.push({
            name: propName,
            defaultValue,
            isStatic: currentModifiers.has("static"),
            visibility: currentModifiers.has("private") ? "private" : currentModifiers.has("protected") ? "protected" : "public",
          });
          currentModifiers = new Set();
          continue;
        }
        this.skipType(true);
        if (this.atPunct("=")) {
          this.next();
          this.skipExpression();
        }
        this.expectPunct(";");
        currentModifiers = new Set();
        continue;
      }

      if (token.type === "var") {
        const propName = this.next().value;
        let defaultValue = null;
        if (this.accept("punct", "=")) defaultValue = this.parseExpression();
        properties.push({
          name: propName,
          defaultValue,
          isStatic: currentModifiers.has("static"),
          visibility: currentModifiers.has("private") ? "private" : currentModifiers.has("protected") ? "protected" : "public",
        });
        this.expectPunct(";");
        currentModifiers = new Set();
        continue;
      }

      throw new HackError(`unexpected '${token.value}' in ${kind} ${name}`, token.line);
    }
    this.next();

    return {
      type: "ClassDeclaration",
      kind,
      name,
      parent,
      interfaces,
      methods,
      properties,
      constants,
      traits,
      isAbstract: modifier === "abstract",
      line,
    };
  }

  // Skip an expression without building it (property defaults, etc).
  skipExpression() {
    const save = this.tokens;
    this.tokens = save;
    let depth = 0;
    while (!this.at("eof")) {
      const token = this.token;
      if (token.type === "punct") {
        if (["(", "[", "{"].includes(token.value)) depth += 1;
        if ([")", "]", "}"].includes(token.value)) {
          if (depth === 0) return;
          depth -= 1;
        }
        if (depth === 0 && [",", ";"].includes(token.value)) return;
      }
      this.next();
    }
  }

  parseEnum() {
    const line = this.token.line;
    this.expectIdent("enum");
    if (this.atIdent("class")) this.next();
    const name = this.next().value;
    this.parseReturnType();
    while (this.atIdent("as") || this.atIdent("implements") || this.atIdent("extends")) {
      this.next();
      this.skipType(false);
      while (this.accept("punct", ",")) this.skipType(true);
    }
    this.expectPunct("{");
    const cases = [];
    while (!this.atPunct("}") && !this.at("eof")) {
      if (this.accept("punct", ",") || this.accept("punct", ";")) continue;
      if (this.token.type !== "ident") {
        this.next();
        continue;
      }
      const caseName = this.next().value;
      let value = null;
      if (this.accept("punct", "=")) value = this.parseExpression();
      cases.push({ name: caseName, value });
    }
    this.expectPunct("}");
    return { type: "EnumDeclaration", name, cases, line };
  }

  // -- expressions ----------------------------------------------------------

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    const left = this.parseTernary();
    const token = this.token;
    if (token.type === "punct" && ASSIGN_OPS.has(token.value)) {
      if (!["Variable", "Index", "Property", "StaticProperty", "ArrayLiteral", "ListPattern"].includes(left.type)) {
        // `Vec\sort(&$v)` style by-ref calls land here; fall through to error.
        throw new HackError(`cannot assign to ${left.type}`, token.line);
      }
      this.next();
      const value = this.parseAssignment();
      return { type: "Assignment", operator: token.value, target: left, value, line: token.line };
    }
    return left;
  }

  parseTernary() {
    const test = this.parseBinary(0);
    if (this.atPunct("?")) {
      this.next();
      if (this.atPunct(":")) {
        this.next();
        const alternate = this.parseAssignment();
        return { type: "Ternary", test, consequent: null, alternate, line: test.line };
      }
      const consequent = this.parseAssignment();
      this.expectPunct(":");
      const alternate = this.parseAssignment();
      return { type: "Ternary", test, consequent, alternate, line: test.line };
    }
    if (this.at("punct", "?:")) {
      this.next();
      const alternate = this.parseAssignment();
      return { type: "Ternary", test, consequent: null, alternate, line: test.line };
    }
    return test;
  }

  parseBinary(minPrecedence) {
    let left = this.parseUnary();
    for (;;) {
      const token = this.token;
      if (token.type === "ident" && token.value === "is") {
        this.next();
        const start = this.pos;
        this.skipType(false);
        // `?` after a type opens a ternary, never another type.
        while (this.pos > start && this.tokens[this.pos - 1].value === "?") this.pos -= 1;
        left = {
          type: "TypeTest",
          value: left,
          typeText: this.tokens.slice(start, this.pos).map((part) => part.value).join(""),
          line: token.line,
        };
        continue;
      }
      if (token.type === "ident" && (token.value === "instanceof" || token.value === "and" || token.value === "or" || token.value === "xor" || token.value === "as")) {
        if (token.value === "instanceof") {
          this.next();
          let name = "";
          while (this.atPunct("\\")) this.next();
          name += this.next().value;
          while (this.atPunct("\\")) {
            this.next();
            name += `\\${this.next().value}`;
          }
          if (this.atPunct("<")) this.skipType(false);
          left = { type: "InstanceOf", value: left, className: name, line: token.line };
          continue;
        }
        if (token.value === "as") {
          if (this.noAs) break;
          // `$x as Foo` is a type assertion with no runtime effect. Parse the
          // type, and carry on in case the value is used in a bigger expression.
          this.next();
          this.skipType(false);
          left = { type: "Cast", to: "as", value: left, line: token.line };
          continue;
        }
        const ops = { and: "&&", or: "||", xor: "xor" };
        const precedence = token.value === "or" ? 1 : token.value === "xor" ? 2 : 2;
        if (precedence < minPrecedence) break;
        this.next();
        const right = this.parseBinary(precedence + 1);
        left = { type: "Binary", operator: ops[token.value], left, right, line: token.line };
        continue;
      }
      if (token.type !== "punct" || !(token.value in BINARY_PRECEDENCE)) break;
      const precedence = BINARY_PRECEDENCE[token.value];
      if (precedence < minPrecedence) break;
      this.next();
      const right = this.parseBinary(precedence + 1);
      left = { type: "Binary", operator: token.value, left, right, line: token.line };
    }
    return left;
  }

  parseUnary() {
    const token = this.token;
    if (token.type === "punct") {
      if (token.value === "!") {
        this.next();
        return { type: "Unary", operator: "!", value: this.parseUnary(), line: token.line };
      }
      if (token.value === "-") {
        this.next();
        return { type: "Unary", operator: "-", value: this.parseUnary(), line: token.line };
      }
      if (token.value === "+") {
        this.next();
        return { type: "Unary", operator: "+", value: this.parseUnary(), line: token.line };
      }
      if (token.value === "~") {
        this.next();
        return { type: "Unary", operator: "~", value: this.parseUnary(), line: token.line };
      }
      if (token.value === "@") {
        this.next();
        return this.parseUnary();
      }
      if (token.value === "&") {
        this.next();
        return { type: "Ref", value: this.parseUnary(), line: token.line };
      }
      if (token.value === "++" || token.value === "--") {
        this.next();
        return { type: "PreIncDec", operator: token.value, target: this.parseUnary(), line: token.line };
      }
      if (token.value === "(" && this.peek().type === "ident" && ["int", "float", "string", "bool", "vec", "dict", "keyset", "array", "num"].includes(this.peek().value) && this.peek(2).value === ")") {
        this.next();
        const cast = this.next().value;
        this.next();
        return { type: "Cast", to: cast, value: this.parseUnary(), line: token.line };
      }
      if (token.value === "(" && this.peek().type === "ident" && /^\\?[A-Z]/.test(this.peek().value) && this.peek(2).value === ")") {
        this.next();
        const cast = this.next().value;
        this.next();
        return { type: "Cast", to: "object", className: cast, value: this.parseUnary(), line: token.line };
      }
      if (token.value === "(" && this.peek().type === "ident" && this.peek(2).value === ")" && ["object", "arraykey"].includes(this.peek().value)) {
        this.next();
        const cast = this.next().value;
        this.next();
        return { type: "Cast", to: cast, value: this.parseUnary(), line: token.line };
      }
    }
    if (token.type === "ident" && (token.value === "print" || token.value === "await")) {
      // `await` resolves its operand immediately: every awaitable here is ready.
      this.next();
      return { type: "Await", value: this.parseUnary(), line: token.line };
    }
    if (token.type === "ident" && token.value === "new") {
      return this.parsePostfix(this.parseNew());
    }
    if (token.type === "ident" && (token.value === "clone")) {
      this.next();
      return { type: "Clone", value: this.parseUnary(), line: token.line };
    }
    if (token.type === "ident" && token.value === "nameof") {
      this.next();
      const parts = [];
      while (this.atPunct("\\")) this.next();
      if (this.token.type === "ident") parts.push(this.next().value);
      while (!this.atPunct(";") && !this.atPunct(")") && !this.atPunct(",") && !this.atPunct("]") && !this.at("eof")) {
        parts.push(this.next().value);
      }
      return { type: "Literal", value: parts.join(""), line: token.line };
    }
    if (token.type === "ident" && token.value === "yield") {
      this.next();
      if (this.atPunct(";") || this.atPunct(")")) return { type: "Literal", value: null, line: token.line };
      return { type: "Yield", value: this.parseAssignment(), line: token.line };
    }
    return this.parsePostfix(this.parsePrimary());
  }

  parseNew() {
    const line = this.token.line;
    this.expectIdent("new");
    let className = "";
    while (this.atPunct("\\")) this.next();
    className += this.next().value;
    while (this.atPunct("\\")) {
      this.next();
      className += `\\${this.next().value}`;
    }
    // Generic arguments: `new Vector<int>()`
    if (this.atPunct("<")) this.skipType(false);
    const args = this.atPunct("(") ? this.parseArgs() : [];
    return { type: "New", className, args, line };
  }

  parseArgs() {
    this.expectPunct("(");
    const args = [];
    while (!this.atPunct(")")) {
      if (this.atPunct("...")) {
        this.next();
        args.push({ spread: true, value: this.parseExpression() });
      } else if (this.token.type === "ident" && this.peek().type === "punct" && this.peek().value === ":") {
        // Named argument: `foo(bar: 1)`
        const name = this.next().value;
        this.next();
        args.push({ name, value: this.parseExpression() });
      } else {
        args.push({ value: this.parseExpression() });
      }
      if (!this.accept("punct", ",")) break;
    }
    this.expectPunct(")");
    return args;
  }

  parsePrimary() {
    const token = this.token;
    const line = token.line;

    if (token.type === "number") {
      this.next();
      return { type: "Literal", value: token.value, line };
    }
    if (token.type === "string") {
      this.next();
      return { type: "StringLiteral", raw: token.value, interp: token.interp, line };
    }
    if (token.type === "var") {
      this.next();
      return { type: "Variable", name: token.value, line };
    }
    if (token.type === "punct") {
      if (token.value === "(") {
        this.next();
        const value = this.parseExpression();
        this.expectPunct(")");
        return value;
      }
      if (token.value === "[") {
        return this.parseArrayLiteral("array");
      }
      if (token.value === "$$") {
        this.next();
        return { type: "Variable", name: "$$", line };
      }
      throw new HackError(`unexpected '${token.value}'`, line);
    }
    if (token.type === "ident") {
      switch (token.value) {
        case "const":
          throw new HackError("unexpected 'const' in an expression", line);
        case "true":
          this.next();
          return { type: "Literal", value: true, line };
        case "false":
          this.next();
          return { type: "Literal", value: false, line };
        case "null":
          this.next();
          return { type: "Literal", value: null, line };
        case "vec":
        case "dict":
        case "keyset":
          if (this.peek().value === "[" || this.peek().value === "(") {
            this.next();
            return this.parseArrayLiteral(token.value);
          }
          break;
        case "shape":
          return this.parseShape();
        case "tuple":
          if (this.peek().value === "(") break;
          this.next();
          return this.parseArrayLiteral("vec");
        case "function": {
          this.next();
          const isAsync = false;
          this.accept("punct", "&");
          const params = this.parseParams();
          if (this.atIdent("use")) {
            this.next();
            this.expectPunct("(");
            while (!this.atPunct(")")) this.next();
            this.expectPunct(")");
          }
          if (this.atPunct("[")) this.skipContexts();
          this.parseReturnType();
          if (this.atPunct("[")) this.skipContexts();
          const saved = this.loopDepth;
          this.loopDepth = 0;
          const body = this.parseBlock();
          this.loopDepth = saved;
          return { type: "Closure", params, body, isAsync, line };
        }
        case "async": {
          if (this.peek().value === "function" || (this.peek().value === "(" )) {
            this.next();
            if (this.atIdent("function")) {
              this.next();
              const params = this.parseParams();
              if (this.atIdent("use")) {
                this.next();
                this.expectPunct("(");
                while (!this.atPunct(")")) this.next();
                this.expectPunct(")");
              }
              this.parseReturnType();
              const body = this.parseBlock();
              return { type: "Closure", params, body, isAsync: true, line };
            }
            // `async { ... }` blocks run inline.
            const block = this.parseBlock();
            return { type: "AsyncBlock", body: block, line };
          }
          break;
        }
        case "list":
          if (this.peek().value === "(") {
            this.next();
            return this.parseListPattern();
          }
          break;
        case "matches":
          // `$x is T` — parsed as `is` binary below; standalone `matches` is not runtime.
          break;
        default:
          break;
      }

      // Names that are not keywords: constants, class names, function calls,
      // `Foo::bar`, `self`, `parent`, `static`.
      this.next();
      let name = token.value;
      // `HH\Lib\Str\join(...)` and `\strlen(...)` arrive as one identifier.
      return { type: "Name", name: name.replace(/^\\/, ""), line };
    }

    throw new HackError(`unexpected '${token.value || token.type}'`, line);
  }

  parseShape() {
    const line = this.token.line;
    this.expectIdent("shape");
    this.expectPunct("(");
    const fields = [];
    while (!this.atPunct(")")) {
      this.accept("punct", "?");
      const keyToken = this.next();
      const key = typeof keyToken.value === "string" ? keyToken.value : String(keyToken.value);
      this.expectPunct("=>");
      const value = this.parseExpression();
      fields.push({ key, value });
      if (!this.accept("punct", ",")) break;
    }
    this.expectPunct(")");
    return { type: "Shape", fields, line };
  }

  parseArrayLiteral(kind) {
    const line = this.token.line;
    const close = this.atPunct("(") ? ")" : "]";
    this.next();
    const entries = [];
    while (!this.atPunct(close)) {
      if (this.atPunct("...")) {
        this.next();
        entries.push({ spread: true, value: this.parseExpression() });
      } else {
        const first = this.parseExpression();
        if (this.accept("punct", "=>")) {
          entries.push({ key: first, value: this.parseExpression() });
        } else {
          entries.push({ value: first });
        }
      }
      if (!this.accept("punct", ",")) break;
    }
    this.expectPunct(close);
    return { type: "ArrayLiteral", kind, entries, line };
  }

  parseListPattern() {
    const line = this.token.line;
    this.expectPunct("(");
    const items = [];
    while (!this.atPunct(")")) {
      const first = this.parseExpression();
      if (this.accept("punct", "=>")) {
        items.push({ key: first, value: this.parseExpression() });
      } else {
        items.push({ value: first });
      }
      if (!this.accept("punct", ",")) break;
    }
    this.expectPunct(")");
    return { type: "ListPattern", items, line };
  }

  parsePostfix(expression) {
    let value = expression;
    for (;;) {
      const token = this.token;
      if (token.type !== "punct") break;

      if (token.value === "->" || token.value === "?->") {
        this.next();
        const nullable = token.value === "?->";
        const prop = this.next();
        const name = prop.type === "var" ? prop.value : String(prop.value);
        value = { type: "Property", object: value, name, nullable, line: token.line };
        continue;
      }
      if (token.value === "::") {
        this.next();
        const member = this.next();
        if (member.type === "var") {
          value = { type: "StaticProperty", className: value, name: member.value, line: token.line };
        } else if (member.type === "ident" && member.value === "class") {
          value = { type: "ClassNameOf", target: value, line: token.line };
        } else {
          value = { type: "StaticName", className: value, name: String(member.value), line: token.line };
        }
        continue;
      }
      if (token.value === "(") {
        const args = this.parseArgs();
        value = { type: "Call", callee: value, args, line: token.line };
        continue;
      }
      if (token.value === "[") {
        this.next();
        if (this.atPunct("]")) {
          this.next();
          value = { type: "Index", target: value, index: null, append: true, line: token.line };
          continue;
        }
        const index = this.parseExpression();
        this.expectPunct("]");
        value = { type: "Index", target: value, index, line: token.line };
        continue;
      }
      if (token.value === "++" || token.value === "--") {
        this.next();
        value = { type: "PostIncDec", operator: token.value, target: value, line: token.line };
        continue;
      }
      if (token.value === "==>") {
        this.next();
        const body = this.parseAssignment();
        value = { type: "ArrowFunction", params: [value], body, line: token.line };
        continue;
      }
      break;
    }

    // `($x, $y) ==> ...` — a parenthesised list of parameters, a common form.
    return value;
  }
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

class HVec {
  constructor(items = []) {
    this.items = items;
  }
}

class HDict {
  constructor(entries = []) {
    // entries: array of [key, value]; keys are normalized
    this.map = new Map();
    for (const [key, value] of entries) this.set(key, value);
  }

  static normalizeKey(key) {
    if (typeof key === "boolean") return key ? 1 : 0;
    if (typeof key === "number") return Number.isInteger(key) ? key : key;
    if (key === null) return "";
    if (typeof key === "string") {
      if (/^-?(0|[1-9]\d*)$/.test(key)) return Number(key);
      return key;
    }
    throw new Error("Invalid array key");
  }

  set(key, value) {
    this.map.set(HDict.normalizeKey(key), value);
  }

  get(key) {
    return this.map.get(HDict.normalizeKey(key));
  }

  has(key) {
    return this.map.has(HDict.normalizeKey(key));
  }

  entries() {
    return [...this.map.entries()];
  }

  get size() {
    return this.map.size;
  }
}

class HKeyset {
  constructor(items = []) {
    this.map = new Map();
    for (const item of items) this.add(item);
  }

  add(item) {
    const key = HDict.normalizeKey(item);
    this.map.set(key, key);
  }

  has(item) {
    return this.map.has(HDict.normalizeKey(item));
  }

  items() {
    return [...this.map.values()];
  }

  get size() {
    return this.map.size;
  }
}

class HObject {
  constructor(className) {
    this.className = className;
    this.props = new Map();
  }
}

class HClass {
  constructor(decl) {
    this.decl = decl;
    this.name = decl.name;
    this.isInterface = decl.kind === "interface";
    this.isTrait = decl.kind === "trait";
  }
}

class HEnum {
  constructor(name, cases) {
    this.name = name;
    this.cases = cases;
  }
}

class HCatchable extends Error {
  constructor(message, line = 0, className = "Exception") {
    super(message);
    this.line = line;
    this.className = className;
    this.props = new Map();
  }
}

class ExitSignal extends Error {}

// ---------------------------------------------------------------------------
// Runtime helpers
// ---------------------------------------------------------------------------

const isInt = (value) => Number.isInteger(value);
const isVec = (value) => value instanceof HVec;
const isDict = (value) => value instanceof HDict;
const isKeyset = (value) => value instanceof HKeyset;
const isCollection = (value) => isVec(value) || isDict(value) || isKeyset(value);

const typeName = (value) => {
  if (value === null) return "null";
  if (value === true || value === false) return "bool";
  if (typeof value === "number") return isInt(value) ? "int" : "float";
  if (typeof value === "string") return "string";
  if (value instanceof HVec) return "vec";
  if (value instanceof HDict) return "dict";
  if (value instanceof HKeyset) return "keyset";
  if (value instanceof HClass) return "class";
  if (value instanceof HObject) return `object(${value.className})`;
  if (value instanceof HEnum) return "enum";
  if (value instanceof Function) return "function";
  return "mixed";
};

const toStr = (value, nested = false) => {
  if (value === null) return "";
  if (value === true) return "1";
  if (value === false) return "";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return String(value);
    if (!Number.isFinite(value)) return Number.isNaN(value) ? "NAN" : value > 0 ? "INF" : "-INF";
    return String(value);
  }
  if (typeof value === "string") return value;
  if (value instanceof HVec) return `vec[${value.items.map((item) => repr(item)).join(", ")}]`;
  if (value instanceof HDict) {
    return `dict[${value.entries().map(([key, item]) => `${repr(key)} => ${repr(item)}`).join(", ")}]`;
  }
  if (value instanceof HKeyset) return `keyset[${value.items().map((item) => repr(item)).join(", ")}]`;
  if (value instanceof HObject) return `object(${value.className})`;
  if (value instanceof HClass) return `class ${value.name}`;
  if (value instanceof HEnum) return value.name;
  if (value instanceof Function) return "Closure";
  return String(value);
};

const repr = (value) => {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === true) return "true";
  if (value === false) return "false";
  if (value === null) return "null";
  if (typeof value === "number") return Object.is(value, -0) ? "-0.0" : String(value);
  if (isVec(value)) return `vec[${value.items.map((item) => repr(item)).join(", ")}]`;
  if (isDict(value)) return `dict[${value.entries().map(([key, item]) => `${repr(key)} => ${repr(item)}`).join(", ")}]`;
  if (isKeyset(value)) return `keyset[${value.items().map((item) => repr(item)).join(", ")}]`;
  if (value instanceof HObject) return toStr(value);
  return toStr(value);
};

const toBool = (value) => {
  if (value === null || value === false) return false;
  if (value === true) return true;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value !== "" && value !== "0";
  if (isCollection(value)) {
    if (isVec(value)) return value.items.length > 0;
    if (isDict(value)) return value.size > 0;
    return value.size > 0;
  }
  return true;
};

// Arithmetic on a collection is a type error in Hack; report it instead of
// letting JavaScript's toString turn it into a number.
const toNumOp = (value, line) => {
  if (isCollection(value)) {
    throw new HCatchable(`Invalid operand type: ${typeName(value)}`, line);
  }
  return toNum(value);
};

const toNum = (value) => {
  if (typeof value === "number") return value;
  if (value === null) return 0;
  if (value === true) return 1;
  if (value === false) return 0;
  if (typeof value === "string") {
    const match = value.match(/^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/);
    return match ? Number(match[0]) : 0;
  }
  if (isVec(value)) return value.items.length;
  if (isDict(value) || isKeyset(value)) return value.size;
  throw new HCatchable(`Object of class ${typeName(value)} could not be converted to number`, 0);
};

const strictEquals = (a, b) => {
  if (typeof a === "number" && typeof b === "number") return a === b;
  if (typeof a === "string" && typeof b === "string") return a === b;
  if (typeof a === "boolean" && typeof b === "boolean") return a === b;
  if (a === null || b === null) return a === null && b === null;
  return a === b;
};

const looseEquals = (a, b) => {
  if (a === null && b === null) return true;
  if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
    if (isVec(a) && isVec(b)) return a.items.length === b.items.length && a.items.every((item, index) => looseEquals(item, b.items[index]));
    return a === b;
  }
  const numeric = (value) => typeof value === "number" || typeof value === "boolean" || value === null || (typeof value === "string" && /^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/.test(value));
  if (numeric(a) && numeric(b)) return toNum(a) === toNum(b);
  if (typeof a === "string" || typeof b === "string") return toStr(a) === toStr(b);
  return a === b;
};

const compareValues = (a, b) => {
  if (typeof a === "number" && typeof b === "number") return a < b ? -1 : a > b ? 1 : 0;
  if (typeof a === "string" && typeof b === "string") return a < b ? -1 : a > b ? 1 : 0;
  if (typeof a === "boolean" || typeof b === "boolean" || a === null || b === null) {
    return toNum(a) < toNum(b) ? -1 : toNum(a) > toNum(b) ? 1 : 0;
  }
  return toStr(a) < toStr(b) ? -1 : toStr(a) > toStr(b) ? 1 : 0;
};

// ---------------------------------------------------------------------------
// Interpreter
// ---------------------------------------------------------------------------

const BREAK = { signal: "break" };
const CONTINUE = { signal: "continue" };

class Interpreter {
  constructor(source, options = {}) {
    this.options = options;
    this.output = "";
    this.steps = 0;
    this.depth = 0;
    this.functions = new Map();
    this.classes = new Map();
    this.enums = new Map();
    this.constants = new Map();
    this.globals = Object.create(null);
    this.entryPoint = null;
    this.pending = [];
    this.statics = new Map();
    this.pipelineValue = undefined;
    this.currentObject = null;
    this.currentClass = null;
  }

  // -- errors -------------------------------------------------------------

  fail(message, line = 0) {
    throw new HCatchable(message, line);
  }

  write(text) {
    if (this.output.length + text.length > MAX_OUTPUT) {
      throw new HCatchable(`Output exceeded ${MAX_OUTPUT} characters`, 0);
    }
    this.output += text;
  }

  tick(node) {
    this.steps += 1;
    if (this.steps > (this.options.maxSteps || MAX_STEPS)) {
      throw new HackError(
        `Executing this code exceeded ${(this.options.maxSteps || MAX_STEPS).toLocaleString("en")} steps. ` +
          "The playground stops programs that never finish.",
        node && node.line,
      );
    }
  }

  // -- program ------------------------------------------------------------

  run(ast) {
    // Declarations first: HHVM resolves functions and classes before it runs
    // the script body, so callers may appear above definitions.
    for (const statement of ast.body) {
      if (statement.type === "ClassDeclaration") this.declareClass(statement);
      if (statement.type === "EnumDeclaration") this.declareEnum(statement);
    }
    for (const statement of ast.body) {
      if (statement.type === "FunctionDeclaration") this.declareFunction(statement);
    }

    // Top-level statements run in order. A `main` function marked with
    // `<<__EntryPoint>>` runs after them, like HHVM does.
    for (const statement of ast.body) {
      if (statement.type === "FunctionDeclaration" || statement.type === "ClassDeclaration" || statement.type === "EnumDeclaration") continue;
      if (statement.type === "Namespace") {
        const result = this.execBlockBody(statement.body, this.globals);
        if (result instanceof ExitSignal) throw result;
        continue;
      }
      const result = this.exec(statement, this.globals, {});
      if (result instanceof ExitSignal) throw result;
    }

    const entry = this.entryPoint || this.functions.get("main");
    if (entry && !this.options.noEntryPoint) {
      this.callFunction(entry, [], null, 0);
    }
    return this.output;
  }

  declareFunction(decl) {
    const name = decl.name.toLowerCase();
    this.functions.set(name, decl);
    const simple = name.split("\\").pop();
    if (!this.functions.has(simple)) this.functions.set(simple, decl);
    if (decl.attrs && decl.attrs.includes("__EntryPoint")) this.entryPoint = decl;
  }

  declareClass(decl) {
    const cls = new HClass(decl);
    this.classes.set(decl.name.toLowerCase(), cls);
    this.classes.set(decl.name, cls);
    // Register before using so that a method calling another method of the
    // same class finds the object's class while the declaration is read.

    for (const constant of decl.constants) {
      this.constants.set(`${decl.name}::${constant.name}`, true);
    }
  }

  declareEnum(decl) {
    const instance = new HEnum(decl.name, decl.cases);
    this.enums.set(decl.name, instance);
    this.enums.set(decl.name.toLowerCase(), instance);
  }

  findClass(name) {
    const clean = String(name).replace(/^\\/, "");
    return this.classes.get(clean) || this.classes.get(clean.toLowerCase()) || null;
  }

  classChain(cls) {
    const chain = [];
    let current = cls;
    const seen = new Set();
    while (current && !seen.has(current.name)) {
      seen.add(current.name);
      chain.push(current);
      current = current.decl.parent ? this.findClass(current.decl.parent) : null;
    }
    return chain;
  }

  findMethod(cls, methodName) {
    const lower = methodName.toLowerCase();
    for (const link of this.classChain(cls)) {
      for (const method of link.decl.methods) {
        if (method.name.toLowerCase() === lower) return method;
      }
      // Interface defaults are not run; interfaces declare signatures.
    }
    // Traits used by the class
    for (const traitName of cls.decl.traits || []) {
      const trait = this.findClass(traitName);
      if (trait) {
        for (const method of trait.decl.methods) {
          if (method.name.toLowerCase() === lower) return method;
        }
      }
    }
    return null;
  }

  findProperty(cls, propName) {
    for (const link of this.classChain(cls)) {
      for (const property of link.decl.properties) {
        if (property.name === propName) return property;
      }
    }
    return null;
  }

  isSubclassOf(cls, targetName) {
    const target = String(targetName).toLowerCase();
    for (const link of this.classChain(cls)) {
      if (link.name.toLowerCase() === target) return true;
      if ((link.decl.interfaces || []).some((name) => name.toLowerCase() === target)) return true;
    }
    return false;
  }

  instantiate(cls, args, line) {
    if (cls.isInterface) this.fail(`Cannot instantiate interface ${cls.name}`, line);
    if (cls.isTrait) this.fail(`Cannot instantiate trait ${cls.name}`, line);
    if (cls.decl.isAbstract) this.fail(`Cannot instantiate abstract class ${cls.name}`, line);

    const object = new HObject(cls.name);
    // Defaults: properties declared by the class, then its parents.
    for (const link of this.classChain(cls).reverse()) {
      for (const property of link.decl.properties) {
        if (property.isStatic) continue;
        const value = property.defaultValue ? this.eval(property.defaultValue, this.globals, {}) : null;
        object.props.set(property.name, value);
      }
    }
    const ctor = this.findMethod(cls, "__construct");
    if (ctor) {
      this.callMethod(cls, object, ctor, args, line);
    } else if (args.length > 0) {
      this.fail(`Too many arguments for ${cls.name}::__construct()`, line);
    }
    return object;
  }

  callMethod(cls, object, method, args, line) {
    if (method.isAbstract || !method.body) {
      this.fail(`Cannot call abstract method ${cls.name}::${method.name}()`, line);
    }
    const scope = Object.create(null);
    let argIndex = 0;
    for (const param of method.params) {
      if (param.variadic) {
        scope[param.name] = new HVec(args.slice(argIndex));
        argIndex = args.length;
        break;
      }
      let value = argIndex < args.length ? args[argIndex] : undefined;
      if (value === undefined) {
        if (param.defaultValue) value = this.eval(param.defaultValue, this.globals, {});
        else this.fail(`Too few arguments for ${cls.name}::${method.name}()`, line);
      }
      scope[param.name] = value;
      if (param.promoted && method.name === "__construct") object.props.set(param.name, value);
      argIndex += 1;
    }
    if (!method.params.some((param) => param.variadic) && args.length > argIndex) {
      this.fail(`Too many arguments for ${cls.name}::${method.name}()`, line);
    }
    scope.this = object;
    scope.__class = cls;

    this.depth += 1;
    if (this.depth > (this.options.maxDepth || MAX_DEPTH)) {
      this.fail(`Stack depth exceeded ${this.options.maxDepth || MAX_DEPTH}: the recursion never stops`, line);
    }
    const previousObject = this.currentObject;
    const previousClass = this.currentClass;
    this.currentObject = object;
    this.currentClass = cls.name;
    try {
      const result = this.execBlockBody(method.body.body, scope);
      if (result instanceof ExitSignal) throw result;
      if (result === BREAK || result === CONTINUE) {
        this.fail(`Cannot break/continue in ${cls.name}::${method.name}()`, line);
      }
      if (result && result.signal === "return") return result.value;
      return result === undefined ? null : result;
    } catch (error) {
      if (error instanceof HCatchable && !error.line) error.line = line;
      throw error;
    } finally {
      this.depth -= 1;
      this.currentObject = previousObject;
      this.currentClass = previousClass;
    }
  }

  callFunction(decl, args, thisArg, line) {
    if (this.depth > (this.options.maxDepth || MAX_DEPTH)) {
      this.fail(`Stack depth exceeded ${this.options.maxDepth || MAX_DEPTH}: the recursion never stops`, line);
    }
    const scope = Object.create(null);
    let argIndex = 0;
    for (const param of decl.params) {
      if (param.variadic) {
        scope[param.name] = new HVec(args.slice(argIndex));
        argIndex = args.length;
        break;
      }
      let value = argIndex < args.length ? args[argIndex] : undefined;
      if (value === undefined) {
        if (param.defaultValue) value = this.eval(param.defaultValue, this.globals, {});
        else this.fail(`Too few arguments for ${decl.name}()`, line);
      }
      scope[param.name] = value;
      argIndex += 1;
    }
    if (!decl.params.some((param) => param.variadic) && args.length > argIndex) {
      this.fail(`Too many arguments for ${decl.name}()`, line);
    }

    this.depth += 1;
    try {
      const result = this.execBlockBody(decl.body.body, scope);
      if (result instanceof ExitSignal) throw result;
      if (result === BREAK || result === CONTINUE) {
        this.fail(`Cannot break/continue outside a loop in ${decl.name}()`, line);
      }
      if (result && result.signal === "return") return result.value;
      return result === undefined ? null : result;
    } finally {
      this.depth -= 1;
    }
  }

  callClosure(node, args, scope, line) {
    const local = Object.create(null);
    let argIndex = 0;
    for (const param of node.params) {
      let value = argIndex < args.length ? args[argIndex] : undefined;
      if (value === undefined && param.defaultValue) value = this.eval(param.defaultValue, scope, {});
      if (value === undefined) this.fail("Too few arguments for closure", line);
      local[param.name] = value;
      argIndex += 1;
    }
    const body = node.body.type === "Block" ? node.body.body : [{ type: "Return", value: node.body, line }];
    this.depth += 1;
    try {
      const result = this.execBlockBody(body, local);
      if (result instanceof ExitSignal) throw result;
      if (result && result.signal === "return") return result.value;
      return result === undefined ? null : result;
    } finally {
      this.depth -= 1;
    }
  }

  // -- statements ---------------------------------------------------------

  execBlockBody(body, scope) {
    for (const statement of body) {
      const result = this.exec(statement, scope, {});
      if (result !== undefined) return result;
    }
    return undefined;
  }

  hoistFunctions(body) {
    for (const statement of body) {
      if (statement.type === "FunctionDeclaration") this.declareFunction(statement);
    }
  }

  exec(node, scope, env) {
    this.tick(node);
    switch (node.type) {
      case "Empty":
        return undefined;
      case "Block":
        this.hoistFunctions(node.body);
        return this.execBlockBody(node.body, scope);
      case "ExpressionStatement":
        this.eval(node.expression, scope, env);
        return undefined;
      case "Echo": {
        for (const value of node.values) this.write(toStr(this.eval(value, scope, env)));
        return undefined;
      }
      case "FunctionDeclaration":
        this.declareFunction(node);
        return undefined;
      case "ClassDeclaration":
        this.declareClass(node);
        return undefined;
      case "EnumDeclaration":
        this.declareEnum(node);
        return undefined;
      case "ConstDecl": {
        for (const entry of node.entries) {
          this.constants.set(entry.name, this.eval(entry.value, scope, env));
        }
        return undefined;
      }
      case "Use":
      case "Namespace":
        return undefined;
      case "Return":
        return { signal: "return", value: node.value ? this.eval(node.value, scope, env) : null };
      case "If":
        if (toBool(this.eval(node.test, scope, env))) return this.exec(node.consequent, scope, env);
        if (node.alternate) return this.exec(node.alternate, scope, env);
        return undefined;
      case "While": {
        for (;;) {
          this.tick(node);
          if (!toBool(this.eval(node.test, scope, env))) break;
          const result = this.exec(node.body, scope, env);
          if (result === BREAK) break;
          if (result === CONTINUE) continue;
          if (result !== undefined) return result;
        }
        return undefined;
      }
      case "DoWhile": {
        for (;;) {
          const result = this.exec(node.body, scope, env);
          if (result === BREAK) break;
          if (result !== undefined && result !== CONTINUE) return result;
          if (!toBool(this.eval(node.test, scope, env))) break;
        }
        return undefined;
      }
      case "For": {
        for (const init of node.init) this.eval(init, scope, env);
        for (;;) {
          this.tick(node);
          if (node.test.length && !toBool(this.eval(node.test[node.test.length - 1], scope, env))) break;
          const result = this.exec(node.body, scope, env);
          if (result === BREAK) break;
          if (result !== undefined && result !== CONTINUE) return result;
          for (const update of node.update) this.eval(update, scope, env);
        }
        return undefined;
      }
      case "Foreach": {
        const subject = this.eval(node.subject, scope, env);
        const pairs = [];
        if (isVec(subject)) subject.items.forEach((item, index) => pairs.push([index, item]));
        else if (isDict(subject)) pairs.push(...subject.entries());
        else if (isKeyset(subject)) subject.items().forEach((item) => pairs.push([item, item]));
        else if (typeof subject === "string") [...subject].forEach((ch, index) => pairs.push([index, ch]));
        else if (subject === null) this.fail("foreach() argument must be of type vec, dict, keyset or string", node.line);
        else if (subject instanceof HObject) this.fail("Object iteration is not supported here", node.line);
        else this.fail(`Invalid operand type for foreach: ${typeName(subject)}`, node.line);

        for (const [key, value] of pairs) {
          this.tick(node);
          if (node.key) this.assign(node.key, key, scope, env);
          this.assign(node.value, value, scope, env);
          const result = this.exec(node.body, scope, env);
          if (result === BREAK) break;
          if (result === CONTINUE) continue;
          if (result !== undefined) return result;
        }
        return undefined;
      }
      case "Switch": {
        const subject = this.eval(node.subject, scope, env);
        let matched = false;
        for (const branch of node.cases) {
          if (!matched && branch.test && looseEquals(subject, this.eval(branch.test, scope, env))) matched = true;
          if (!matched && branch.test === null && !matched) {
            // `default` only runs when nothing matched; decide after the loop.
            continue;
          }
          if (matched) {
            const result = this.execBlockBody(branch.body, scope);
            if (result === BREAK) return undefined;
            if (result === CONTINUE) return undefined;
            if (result !== undefined) return result;
          }
        }
        if (!matched) {
          const fallback = node.cases.find((branch) => branch.test === null);
          if (fallback) {
            const result = this.execBlockBody(fallback.body, scope);
            if (result === BREAK || result === CONTINUE) return undefined;
            if (result !== undefined) return result;
          }
        }
        return undefined;
      }
      case "Break":
        return BREAK;
      case "Continue":
        return CONTINUE;
      case "Try": {
        let pending;
        try {
          const result = this.exec(node.block, scope, env);
          if (result === BREAK || result === CONTINUE || (result && result.signal === "return")) pending = result;
          else if (result !== undefined) {
            if (node.finalizer) this.exec(node.finalizer, scope, env);
            return result;
          }
        } catch (error) {
          if (error instanceof ExitSignal) throw error;
          const catchable = error instanceof HCatchable ? error : new HCatchable(String((error && error.message) || error), node.line);
          let handled = false;
          for (const branch of node.catches) {
            const matches = branch.handlers.some((handler) => {
              const target = handler.replace(/^\\/, "").toLowerCase();
              if (["exception", "throwable", "hh\\exception"].includes(target)) return true;
              return catchable.className.toLowerCase() === target;
            });
            if (!matches) continue;
            handled = true;
            if (branch.variable) scope[branch.variable] = catchable;
            const result = this.execBlockBody(branch.body.body, scope);
            if (result === BREAK || result === CONTINUE || (result && result.signal === "return")) pending = result;
            break;
          }
          if (!handled) {
            if (node.finalizer) this.exec(node.finalizer, scope, env);
            throw error;
          }
        }
        // `finally` runs once, after either path.
        if (node.finalizer) {
          const finalResult = this.exec(node.finalizer, scope, env);
          if (finalResult === BREAK || finalResult === CONTINUE || (finalResult && finalResult.signal === "return")) {
            return finalResult;
          }
        }
        return pending;
      }
      case "Throw": {
        const value = this.eval(node.value, scope, env);
        if (value instanceof HCatchable) throw value;
        if (value instanceof HObject) {
          const message = value.props.get("message");
          const error = new HCatchable(message === undefined ? "" : toStr(message), node.line, value.className);
          error.props = value.props;
          throw error;
        }
        this.fail("Can only throw objects", node.line);
        return undefined;
      }
      case "VarDecl":
        if (!(node.name in scope)) {
          scope[node.name] = node.value ? this.eval(node.value, scope, env) : null;
        }
        return undefined;
      default:
        this.eval(node, scope, env);
        return undefined;
    }
  }

  // -- assignment ---------------------------------------------------------

  assign(target, value, scope, env) {
    switch (target.type) {
      case "Variable":
        if (target.name === "$$") {
          this.pipelineValue = value;
          return value;
        }
        scope[target.name] = value;
        return value;
      case "Index":
        return this.assignIndex(target, value, scope, env);
      case "Property": {
        const object = this.eval(target.object, scope, env);
        if (object === null && target.nullable) return value;
        if (!(object instanceof HObject)) this.fail(`Cannot access property on ${typeName(object)}`, target.line);
        object.props.set(target.name, value);
        return value;
      }
      case "StaticProperty": {
        const name = this.eval(target.className, scope, env);
        const key = `${typeof name === "string" ? name : target.className.name}::${target.name}`;
        this.statics.set(key, value);
        return value;
      }
      case "ArrayLiteral": {
        // Destructuring: [$a, $b] = $vec
        if (!isVec(value)) this.fail("Cannot destructure a non-vec value", target.line);
        target.entries.forEach((entry, index) => {
          this.assign(entry.value, value.items[index] ?? null, scope, env);
        });
        return value;
      }
      case "ListPattern": {
        target.items.forEach((item, index) => {
          const element = item.key
            ? this.index(value, this.eval(item.key, scope, env), target.line)
            : this.index(value, index, target.line);
          this.assign(item.value, element, scope, env);
        });
        return value;
      }
      default:
        this.fail("Cannot assign to this expression", target.line);
        return value;
    }
  }

  assignIndex(target, value, scope, env) {
    const container = this.eval(target.target, scope, env);
    const index = target.append ? container.items ? container.items.length : 0 : this.eval(target.index, scope, env);
    if (isVec(container)) {
      if (!isInt(index)) this.fail("Vec keys must be int", target.line);
      if (index === container.items.length) container.items.push(value);
      else container.items[index] = value;
      return value;
    }
    if (isDict(container)) {
      container.set(index, value);
      return value;
    }
    if (isKeyset(container)) {
      container.add(index);
      return value;
    }
    if (typeof container === "string") {
      if (!isInt(index)) this.fail("String keys must be int", target.line);
      const chars = [...container];
      chars[index] = toStr(value);
      const name = target.target.type === "Variable" ? target.target.name : null;
      if (name) scope[name] = chars.join("");
      return value;
    }
    if (container instanceof HObject && index instanceof HObject) {
      this.fail("Object keys are not supported", target.line);
    }
    this.fail(`Cannot assign an index on ${typeName(container)}`, target.line);
    return value;
  }

  // -- indexing -----------------------------------------------------------

  index(container, index, line) {
    if (container === null) return null;
    if (isVec(container)) {
      if (!isInt(index)) this.fail("Vec keys must be int", line);
      if (index < 0 || index >= container.items.length) {
        this.fail(`Index out of bounds: ${index} is not in the range 0..${container.items.length - 1}`, line);
      }
      return container.items[index];
    }
    if (isDict(container)) {
      const key = HDict.normalizeKey(index);
      if (!container.map.has(key)) {
        const hint = isInt(key)
          ? `Dict key ${key} was not found`
          : `Dict key "${key}" was not found`;
        this.fail(hint, line);
      }
      return container.map.get(key);
    }
    if (isKeyset(container)) {
      if (!container.has(index)) this.fail(`Keyset element ${repr(index)} was not found`, line);
      return index;
    }
    if (typeof container === "string") {
      if (!isInt(index)) this.fail("String keys must be int", line);
      const chars = [...container];
      if (index < 0 || index >= chars.length) {
        this.fail(`Index out of bounds: ${index} is not in the range 0..${chars.length - 1}`, line);
      }
      return chars[index];
    }
    if (container instanceof HObject) {
      return this.getProperty(container, null, index, line);
    }
    this.fail(`Cannot index into ${typeName(container)}`, line);
    return null;
  }

  getProperty(object, cls, name, line) {
    if (!(object instanceof HObject)) this.fail(`Cannot access property '${name}' on ${typeName(object)}`, line);
    if (object.props.has(name)) return object.props.get(name);
    const clsObj = cls || this.findClass(object.className);
    const property = clsObj ? this.findProperty(clsObj, name) : null;
    if (property && property.defaultValue) {
      const value = this.eval(property.defaultValue, this.globals, {});
      object.props.set(name, value);
      return value;
    }
    this.fail(`Undefined property: ${object.className}::$${name}`, line);
    return null;
  }

  // -- expressions --------------------------------------------------------

  eval(node, scope, env) {
    this.tick(node);
    switch (node.type) {
      case "Literal":
        return node.value;
      case "StringLiteral":
        return node.interp ? this.interpolate(node.raw, scope, env, node.line) : node.raw;
      case "Variable": {
        if (node.name === "$$") return this.pipelineValue;
        if (node.name in scope) return scope[node.name];
        if (node.name === "this") this.fail("$this is not available here", node.line);
        // Undefined variables are an error in Hack, unlike PHP.
        this.fail(`Undefined variable: $${node.name}`, node.line);
        return null;
      }
      case "Name":
        return this.resolveName(node.name, node.line);
      case "Shape": {
        const dict = new HDict();
        for (const field of node.fields) dict.set(field.key, this.eval(field.value, scope, env));
        return dict;
      }
      case "ArrayLiteral":
        return this.arrayLiteral(node, scope, env);
      case "Binary":
        return this.binary(node, scope, env);
      case "Unary": {
        const value = this.eval(node.value, scope, env);
        switch (node.operator) {
          case "!":
            return !toBool(value);
          case "-":
            return -toNum(value);
          case "+":
            return toNum(value);
          case "~":
            return ~Math.trunc(toNum(value));
          default:
            return value;
        }
      }
      case "Cast": {
        const value = this.eval(node.value, scope, env);
        if (node.to === "as") return value;
        switch (node.to) {
          case "int":
            return Math.trunc(toNum(value));
          case "float":
            return toNum(value);
          case "string":
            return toStr(value);
          case "bool":
            return toBool(value);
          case "vec":
            return isVec(value) ? value : new HVec(this.toItems(value));
          case "dict":
            return this.toDict(value);
          case "keyset":
            return new HKeyset(this.toItems(value));
          case "array":
            return this.toDict(value);
          case "object":
            return value;
          default:
            return value;
        }
      }
      case "Ternary": {
        const test = this.eval(node.test, scope, env);
        if (node.consequent === null) return toBool(test) ? test : this.eval(node.alternate, scope, env);
        return toBool(test) ? this.eval(node.consequent, scope, env) : this.eval(node.alternate, scope, env);
      }
      case "Assignment":
        return this.assignment(node, scope, env);
      case "Index": {
        const container = this.eval(node.target, scope, env);
        const index = this.eval(node.index, scope, env);
        return this.index(container, index, node.line);
      }
      case "Property": {
        const object = this.eval(node.object, scope, env);
        if (object === null && node.nullable) return null;
        return this.getProperty(object, null, node.name, node.line);
      }
      case "Call":
        return this.call(node, scope, env);
      case "CallMethod":
        return this.callMethodNode(node, scope, env);
      case "New":
        return this.construct(node, scope, env);
      case "Closure":
        return (args) => this.callClosure(node, args, scope, node.line);
      case "ArrowFunction": {
        // `$x ==> expr` has one parameter; `($x, $y) ==> expr` arrives as a
        // CallExpression whose callee is a parenthesised tuple.
        const params = node.params.length === 1 && node.params[0].type === "Variable" ? node.params : node.params;
        const self = this;
        return (args) => {
          const local = Object.create(scope);
          params.forEach((param, index) => {
            local[param.name] = args[index];
          });
          return self.eval(node.body, local, {});
        };
      }
      case "TypeTest":
        return this.typeTest(this.eval(node.value, scope, env), node.typeText);
      case "InstanceOf": {
        const value = this.eval(node.value, scope, env);
        if (!(value instanceof HObject)) return false;
        if (["hh\\this", "this"].includes(node.className.toLowerCase())) return value.className === this.currentClass;
        const cls = this.findClass(value.className);
        return cls ? this.isSubclassOf(cls, node.className) : value.className.toLowerCase() === node.className.toLowerCase();
      }
      case "Clone": {
        const value = this.eval(node.value, scope, env);
        if (value instanceof HObject) {
          const copy = new HObject(value.className);
          copy.props = new Map(value.props);
          return copy;
        }
        return value;
      }
      case "Await":
        return this.eval(node.value, scope, env);
      case "Yield":
        return this.eval(node.value, scope, env);
      case "AsyncBlock":
        return this.execBlockBody(node.body.body, scope) ?? null;
      case "Ref":
        return this.eval(node.value, scope, env);
      case "PreIncDec": {
        const current = toNum(this.eval(node.target, scope, env));
        const next = current + (node.operator === "++" ? 1 : -1);
        this.assign(node.target, next, scope, env);
        return next;
      }
      case "PostIncDec": {
        const current = this.eval(node.target, scope, env);
        const next = toNum(current) + (node.operator === "++" ? 1 : -1);
        this.assign(node.target, next, scope, env);
        return current;
      }
      case "StaticName": {
        const className = node.className.type === "Name" ? node.className.name : null;
        if (className) {
          if (this.enums.has(className)) {
            const enumValue = this.enums.get(className);
            const found = enumValue.cases.find((entry) => entry.name === node.name);
            if (found) return found.value !== null ? this.eval(found.value, this.globals, {}) : found.name;
          }
          const cls = this.findClass(className);
          const key = `${className}::${node.name}`;
          if (this.constants.has(key)) return this.constants.get(key);
          if (cls) {
            for (const link of this.classChain(cls)) {
              for (const constant of link.decl.constants) {
                if (constant.name === node.name) return this.eval(constant.value, this.globals, {});
              }
            }
            const method = this.findMethod(cls, node.name);
            if (method) {
              const staticMethod = { ...method };
              return (args) => this.callStatic(cls, staticMethod, args, node.line);
            }
          }
          if (node.name === "class") return className;
          if (this.enums.has(className)) {
            const enumValue = this.enums.get(className);
            const found = enumValue.cases.find((entry) => entry.name === node.name);
            if (found) return found.value !== null ? this.eval(found.value, this.globals, {}) : found.name;
          }
        }
        // Fluent static call on a class name we do not know yet: keep the name.
        const receiver = this.eval(node.className, scope, env);
        if (typeof receiver === "string") {
          const cls = this.findClass(receiver);
          if (cls) {
            const method = this.findMethod(cls, node.name);
            if (method) return (args) => this.callStatic(cls, method, args, node.line);
          }
        }
        this.fail(`Call to undefined method/constant: ${node.name}`, node.line);
        return null;
      }
      case "ClassNameOf": {
        if (node.target.type === "Name") {
          if (["self", "static"].includes(node.target.name)) return this.currentClass || "";
          if (node.target.name === "parent") {
            const cls = this.findClass(this.currentClass || "");
            return cls && cls.decl.parent ? cls.decl.parent : "";
          }
          return node.target.name.replace(/^\\/, "");
        }
        const value = this.eval(node.target, scope, env);
        return value instanceof HObject ? value.className : typeName(value);
      }
      case "StaticProperty": {
        const className = node.className.type === "Name" ? node.className.name : null;
        const key = `${className}::${node.name}`;
        if (this.statics.has(key)) return this.statics.get(key);
        if (className) {
          const cls = this.findClass(className);
          const property = cls ? this.findProperty(cls, node.name) : null;
          if (property && property.defaultValue) {
            const value = this.eval(property.defaultValue, this.globals, {});
            this.statics.set(key, value);
            return value;
          }
        }
        return null;
      }
      case "ListPattern":
      case "Empty":
        return null;
      default:
        this.fail(`Cannot evaluate ${node.type}`, node.line);
        return null;
    }
  }

  // `is` at runtime: the interpreter checks the runtime type only, which is
  // what HHVM can check. `int is num` is true because an int is a num.
  typeTest(value, typeText) {
    const name = String(typeText).replace(/^\?/, "").toLowerCase();
    const base = name.replace(/<.*$/, "");
    switch (base) {
      case "int":
        return isInt(value);
      case "float":
        return typeof value === "number";
      case "num":
      case "arraykey":
        return typeof value === "number" || typeof value === "string";
      case "string":
        return typeof value === "string";
      case "bool":
        return typeof value === "boolean";
      case "null":
        return value === null;
      case "nonnull":
        return value !== null;
      case "mixed":
      case "dynamic":
        return true;
      case "vec":
        return isVec(value);
      case "dict":
        return isDict(value);
      case "keyset":
        return isKeyset(value);
      case "shape":
        return isDict(value);
      case "object":
        return value instanceof HObject;
      default: {
        if (value instanceof HObject) {
          const cls = this.findClass(value.className);
          return cls ? this.isSubclassOf(cls, base) : value.className.toLowerCase() === base;
        }
        return typeName(value).startsWith(base);
      }
    }
  }

  toItems(value) {
    if (isVec(value)) return value.items;
    if (isDict(value)) return [...value.map.values()];
    if (isKeyset(value)) return value.items();
    if (typeof value === "string") return [...value];
    if (value === null) return [];
    return [value];
  }

  toDict(value) {
    if (isDict(value)) return value;
    if (isVec(value)) return new HDict(value.items.map((item, index) => [index, item]));
    if (isKeyset(value)) return new HDict(value.items().map((item) => [item, item]));
    if (value === null) return new HDict();
    return new HDict([[0, value]]);
  }

  arrayLiteral(node, scope, env) {
    if (node.kind === "vec") {
      const items = [];
      for (const entry of node.entries) {
        if (entry.spread) items.push(...this.toItems(this.eval(entry.value, scope, env)));
        else items.push(this.eval(entry.value, scope, env));
      }
      return new HVec(items);
    }
    if (node.kind === "keyset") {
      const items = [];
      for (const entry of node.entries) {
        if (entry.spread) items.push(...this.toItems(this.eval(entry.value, scope, env)));
        else items.push(this.eval(entry.value, scope, env));
      }
      return new HKeyset(items);
    }
    const dict = new HDict();
    let nextIndex = 0;
    for (const entry of node.entries) {
      if (entry.spread) {
        const source = this.eval(entry.value, scope, env);
        for (const [key, value] of source instanceof HDict ? source.entries() : this.toItems(source).map((item, index) => [index, item])) {
          dict.set(key, value);
          if (typeof key === "number" && key >= nextIndex) nextIndex = Math.floor(key) + 1;
        }
        continue;
      }
      const value = this.eval(entry.value, scope, env);
      if (entry.key) {
        const key = this.eval(entry.key, scope, env);
        dict.set(key, value);
        if (typeof HDict.normalizeKey(key) === "number" && key >= nextIndex) nextIndex = Math.floor(key) + 1;
      } else {
        dict.set(nextIndex, value);
        nextIndex += 1;
      }
    }
    if (node.kind === "array") return dict;
    return dict;
  }

  assignment(node, scope, env) {
    if (node.operator === "=") {
      const value = this.eval(node.value, scope, env);
      return this.assign(node.target, value, scope, env);
    }
    if (node.operator === "??=") {
      const current = this.readSoft(node.target, scope, env);
      if (current !== undefined && current !== null) return current;
      const value = this.eval(node.value, scope, env);
      return this.assign(node.target, value, scope, env);
    }
    if (node.operator === ".=") {
      const current = this.eval(node.target, scope, env);
      const value = toStr(current) + toStr(this.eval(node.value, scope, env));
      return this.assign(node.target, value, scope, env);
    }
    const current = toNum(this.eval(node.target, scope, env));
    const right = this.eval(node.value, scope, env);
    const amount = toNum(right);
    let value;
    switch (node.operator) {
      case "+=":
        value = current + amount;
        break;
      case "-=":
        value = current - amount;
        break;
      case "*=":
        value = current * amount;
        break;
      case "/=":
        value = divide(current, amount);
        break;
      case "%=":
        value = modulo(current, amount, node.line);
        break;
      case "**=":
        value = current ** amount;
        break;
      case "<<=":
        value = current << amount;
        break;
      case ">>=":
        value = current >> amount;
        break;
      case "&=":
        value = current & amount;
        break;
      case "|=":
        value = current | amount;
        break;
      case "^=":
        value = current ^ amount;
        break;
      default:
        value = right;
    }
    return this.assign(node.target, value, scope, env);
  }

  readSoft(target, scope, env) {
    try {
      return this.eval(target, scope, env);
    } catch (error) {
      if (error instanceof HCatchable) return undefined;
      throw error;
    }
  }

  binary(node, scope, env) {
    const op = node.operator;

    if (op === "&&") {
      return toBool(this.eval(node.left, scope, env)) ? toBool(this.eval(node.right, scope, env)) : false;
    }
    if (op === "||") {
      return toBool(this.eval(node.left, scope, env)) ? true : toBool(this.eval(node.right, scope, env));
    }
    if (op === "??") {
      let left;
      try {
        left = this.eval(node.left, scope, env);
      } catch (error) {
        if (error instanceof HCatchable) left = undefined;
        else throw error;
      }
      return left === undefined || left === null ? this.eval(node.right, scope, env) : left;
    }
    if (op === "|>" || op === "|?>") {
      const left = this.eval(node.left, scope, env);
      if (op === "|?>" && left === null) return null;
      const previous = this.pipelineValue;
      this.pipelineValue = left;
      try {
        return this.eval(node.right, scope, env);
      } finally {
        this.pipelineValue = previous;
      }
    }

    const left = this.eval(node.left, scope, env);
    const right = this.eval(node.right, scope, env);

    switch (op) {
      case "+": {
        if (isVec(left) && isVec(right)) return new HVec([...left.items, ...right.items]);
        if (isDict(left) && isDict(right)) return new HDict([...left.entries(), ...right.entries()]);
        return toNumOp(left, node.line) + toNumOp(right, node.line);
      }
      case "-":
        return toNumOp(left, node.line) - toNumOp(right, node.line);
      case "*":
        return toNumOp(left, node.line) * toNumOp(right, node.line);
      case "/":
        return divide(toNumOp(left, node.line), toNumOp(right, node.line));
      case "%":
        return modulo(toNumOp(left, node.line), toNumOp(right, node.line), node.line);
      case "**":
        return toNumOp(left, node.line) ** toNumOp(right, node.line);
      case ".":
        return toStr(left) + toStr(right);
      case "==":
        return looseEquals(left, right);
      case "!=":
        return !looseEquals(left, right);
      case "===":
        return strictEquals(left, right);
      case "!==":
        return !strictEquals(left, right);
      case "<":
        return compareValues(left, right) < 0;
      case ">":
        return compareValues(left, right) > 0;
      case "<=":
        return compareValues(left, right) <= 0;
      case ">=":
        return compareValues(left, right) >= 0;
      case "<=>":
        return compareValues(left, right);
      case "&":
        return Math.trunc(toNum(left)) & Math.trunc(toNum(right));
      case "|":
        return Math.trunc(toNum(left)) | Math.trunc(toNum(right));
      case "^":
        return Math.trunc(toNum(left)) ^ Math.trunc(toNum(right));
      case "<<":
        return Math.trunc(toNum(left)) << Math.trunc(toNum(right));
      case ">>":
        return Math.trunc(toNum(left)) >> Math.trunc(toNum(right));
      case "xor":
        return toBool(left) !== toBool(right);
      default:
        this.fail(`Unsupported operator ${op}`, node.line);
        return null;
    }
  }

  interpolate(raw, scope, env, line) {
    // "a $x b {$y} c ${z}" — escapes are resolved first, one character at a
    // time, so `\\$` stays a literal dollar and `\\n` is a newline.
    const escapes = { n: "\n", t: "\t", r: "\r", '"': '"', "\\": "\\", "$": "\u0000" };
    let text = "";
    for (let index = 0; index < raw.length; index += 1) {
      const ch = raw[index];
      if (ch === "\\" && raw[index + 1] !== undefined && escapes[raw[index + 1]] !== undefined) {
        text += escapes[raw[index + 1]];
        index += 1;
        continue;
      }
      text += ch;
    }
    let out = "";
    let i = 0;
    while (i < text.length) {
      const ch = text[i];
      if (ch === "\u0000") {
        out += "$";
        i += 1;
        continue;
      }
      if (ch === "$" && text[i + 1] === "$") {
        out += toStr(this.pipelineValue);
        i += 2;
        continue;
      }
      if (ch === "{" && text[i + 1] === "$") {
        const end = text.indexOf("}", i);
        if (end !== -1) {
          const expression = text.slice(i + 1, end);
          out += toStr(this.eval(new Parser(tokenize(`${expression};`)).parseExpression(), scope, env));
          i = end + 1;
          continue;
        }
      }
      if (ch === "$") {
        const match = text.slice(i).match(/^\$([A-Za-z_][A-Za-z0-9_]*)(\[[^\]]+\]|->[A-Za-z_]\w*)?/);
        if (match) {
          const name = match[1];
          if (!(name in scope)) this.fail(`Undefined variable: $${name}`, line);
          let value = scope[name];
          if (match[2]) {
            const accessor = match[2];
            if (accessor.startsWith("[")) {
              const inner = accessor.slice(1, -1).trim();
              const key = /^\d+$/.test(inner) ? Number(inner) : inner.replace(/^['"]|['"]$/g, "");
              value = this.index(value, key, line);
            } else {
              value = this.getProperty(value, null, accessor.slice(2), line);
            }
          }
          out += toStr(value);
          i += match[0].length;
          continue;
        }
      }
      out += ch;
      i += 1;
    }
    return out;
  }

  resolveName(name, line) {
    const clean = name.replace(/^\\/, "");
    if (["null", "true", "false"].includes(clean)) return clean === "null" ? null : clean === "true";
    if (clean === "PHP_EOL") return "\n";
    if (clean === "INF") return Infinity;
    if (clean === "NAN") return NaN;
    if (clean === "M_PI") return Math.PI;
    if (this.constants.has(clean)) return this.constants.get(clean);

    const lower = clean.toLowerCase();
    const cleanKey = lower.split(/[\\/]+/).filter(Boolean).join(BS);

    if (this.enums.has(clean)) return this.enums.get(clean);

    // Enum member: `Color::Red` is parsed as StaticName, but bare enum names
    // used as values also resolve here.
    const builtin =
      NORMALIZED_FUNCTIONS[cleanKey] ||
      NORMALIZED_FUNCTIONS[`hh${BS}lib${BS}${cleanKey}`] ||
      NORMALIZED_FUNCTIONS[`hh${BS}${cleanKey}`] ||
      NORMALIZED_FUNCTIONS[lower.split("\\").pop()];
    if (builtin) return (args) => builtin(this, args, line);

    if (this.functions.has(lower)) {
      const decl = this.functions.get(lower);
      return (args) => this.callFunction(decl, args, null, line);
    }

    const cls = this.findClass(clean);
    if (cls) return clean;

    this.fail(`Undefined constant or function: ${clean}`, line);
    return null;
  }

  call(node, scope, env) {
    const callee = node.callee;
    const args = this.evalArgs(node.args, scope, env, node.line);

    // Method calls on objects: `$obj->method()`
    if (callee.type === "Property") {
      const object = this.eval(callee.object, scope, env);
      if (object === null && callee.nullable) return null;
      return this.invokeMethod(object, callee.name, args, node.line);
    }
    if (callee.type === "StaticName") {
      const className = callee.className.type === "Name" ? callee.className.name : null;
      let resolvedClass = className;
      if (className === "self" || className === "static") resolvedClass = this.currentClass;
      if (className === "parent") {
        const cls = this.findClass(this.currentClass || "");
        resolvedClass = cls && cls.decl.parent ? cls.decl.parent : null;
      }
      const cls = resolvedClass ? this.findClass(resolvedClass) : null;
      if (cls) {
        // `parent::__construct()` and other static-style calls
        if (this.currentObject && ["self", "static", "parent"].includes(className)) {
          const method = this.findMethod(cls, callee.name);
          if (method) {
            // Constructor calls inside constructors initialise the same object.
            if (method.name === "__construct") return this.callMethod(cls, this.currentObject, method, args, node.line);
            const bound = this.currentObject;
            if (bound instanceof HObject && !method.isStatic) return this.callMethod(cls, bound, method, args, node.line);
          }
        }
        const method = this.findMethod(cls, callee.name);
        if (method) return this.callStatic(cls, method, args, node.line);
      }
      // Enum case used as a function (never valid) — report it clearly.
      this.fail(`Call to undefined method ${String(className)}::${callee.name}()`, node.line);
    }
    if (callee.type === "Name") {
      const name = callee.name;
      const lower = name.toLowerCase();
      if (["self", "static"].includes(lower) && this.currentClass) {
        return this.construct(this.findClass(this.currentClass), args, node.line);
      }
      if (lower === "parent" && this.currentClass) {
        const cls = this.findClass(this.currentClass);
        return this.construct(this.findClass(cls.decl.parent), args, node.line);
      }
      const target = this.resolveName(name, node.line);
      // A class name called as a function is a constructor call in Hack.
      if (typeof target === "string") {
        const cls = this.findClass(target);
        if (cls) return this.instantiate(cls, args, node.line);
      }
      if (typeof target === "function") return target(args);
      this.fail(`${name} is not callable`, node.line);
    }
    if (callee.type === "ArrowFunction" || callee.type === "Closure") {
      const fn = this.eval(callee, scope, env);
      if (typeof fn === "function") return fn(args);
    }

    const fn = this.eval(callee, scope, env);
    if (typeof fn === "function") return fn(args);
    if (fn instanceof HClass) return this.instantiate(fn, args, node.line);
    this.fail(`${typeName(fn)} is not callable`, node.line);
    return null;
  }

  evalArgs(args, scope, env, line) {
    const values = [];
    for (const arg of args) {
      const value = this.eval(arg.value, scope, env);
      if (arg.spread) {
        values.push(...this.toItems(value));
      } else {
        values.push(value);
      }
    }
    return values;
  }

  callStatic(cls, method, args, line) {
    if (!method.isStatic && this.currentObject && method.name !== "__construct") {
      // Calling an instance method statically from inside the class runs on $this.
      return this.callMethod(cls, this.currentObject, method, args, line);
    }
    if (!method.isStatic) {
      this.fail(`Cannot call instance method ${cls.name}::${method.name}() statically`, line);
    }
    return this.callMethod(cls, new HObject(cls.name), method, args, line);
  }

  invokeMethod(object, name, args, line) {
    const lower = name.toLowerCase();
    if (object instanceof HCatchable) {
      switch (lower) {
        case "getmessage":
          return object.message;
        case "getline":
          return object.line;
        case "getcode":
          return 0;
        case "gettraceasstring":
          return "";
        default:
          break;
      }
    }
    const collection = collectionMethod(object, lower);
    if (collection) {
      const method = collection[0];
      if (typeof method === "function") return method(object, args, line);
    }
    if (typeof object === "string") {
      const stringMethod = STRING_METHODS[lower];
      if (stringMethod) return stringMethod(object, args, this, line);
    }
    if (typeof object === "number") {
      const numberMethod = NUMBER_METHODS[lower];
      if (numberMethod) return numberMethod(object, args, this, line);
    }
    if (object instanceof HObject) {
      const cls = this.findClass(object.className);
      if (!cls) this.fail(`Undefined class ${object.className}`, line);
      const method = this.findMethod(cls, name);
      if (method) return this.callMethod(cls, object, method, args, line);
      const prop = object.props.get(name);
      if (typeof prop === "function") return prop(args);
      this.fail(`Call to undefined method ${object.className}::${name}()`, line);
    }
    if (object instanceof HEnum) {
      const found = object.cases.find((entry) => entry.name === name);
      if (found) return found.value !== null ? this.eval(found.value, this.globals, {}) : found.name;
    }
    this.fail(`Call to undefined method ${typeName(object)}::${name}()`, line);
    return null;
  }

  construct(node, scope, env) {
    const name = node.className;
    let resolved = name;
    if (name === "self" || name === "static") resolved = this.currentClass;
    if (name === "parent") {
      const cls = this.findClass(this.currentClass || "");
      resolved = cls && cls.decl.parent ? cls.decl.parent : null;
    }
    const builtin = BUILTIN_CLASSES[(resolved || "").toLowerCase()];
    if (builtin) return builtin(this, node.args ? this.evalArgs(node.args, scope, env, node.line) : []);
    const cls = this.findClass(resolved || "");
    if (!cls) this.fail(`Class ${resolved} not found`, node.line);
    const args = this.evalArgs(node.args, scope, env, node.line);
    return this.instantiate(cls, args, node.line);
  }

  callMethodNode(node, scope, env) {
    const object = this.eval(node.object, scope, env);
    const args = this.evalArgs(node.args, scope, env, node.line);
    return this.invokeMethod(object, node.name, args, node.line);
  }
}

const divide = (a, b) => {
  if (b === 0) return a === 0 ? NaN : a > 0 ? Infinity : -Infinity;
  return a / b;
};

const modulo = (a, b, line) => {
  const left = Math.trunc(a);
  const right = Math.trunc(b);
  if (right === 0) {
    throw new HCatchable(`Modulo by zero`, line);
  }
  return left % right;
};

// ---------------------------------------------------------------------------
// Built-in functions
// ---------------------------------------------------------------------------

const BUILTIN_FUNCTIONS = {
  // Output and errors
  "hh\\invariant": () => null,
  invariant: () => null,
  "hh\\print": (rt, args) => {
    rt.write(toStr(args[0]));
    return null;
  },
  print: (rt, args) => {
    rt.write(toStr(args[0]));
    return null;
  },
  "hh\\exit": () => {
    throw new ExitSignal();
  },
  exit: () => {
    throw new ExitSignal();
  },
  "hh\\var_dump": (rt, args) => {
    rt.write(args.map((value) => dump(value)).join(""));
    return null;
  },
  "hh\\debug_backtrace": () => new HVec([]),
  "hh\\readline": () => "",

  // Strings
  "hh\\lib\\str\\length": (rt, args) => strLength(args[0]),
  "hh\\lib\\str\\upper": (rt, args) => toStr(args[0]).toUpperCase(),
  "hh\\lib\\str\\lower": (rt, args) => toStr(args[0]).toLowerCase(),
  "hh\\lib\\str\\capitalize": (rt, args) => {
    const text = toStr(args[0]);
    return text ? text[0].toUpperCase() + text.slice(1).toLowerCase() : "";
  },
  "hh\\lib\\str\\trim": (rt, args) => toStr(args[0]).trim(),
  "hh\\lib\\str\\trim_left": (rt, args) => toStr(args[0]).trimStart(),
  "hh\\lib\\str\\trim_right": (rt, args) => toStr(args[0]).trimEnd(),
  "hh\\lib\\str\\join": (rt, args) => {
    const [items, glue] = args;
    if (items === null) return "";
    return rt.toItems(items).map((item) => toStr(item)).join(glue === undefined ? "" : toStr(glue));
  },
  "hh\\lib\\str\\split": (rt, args) => {
    const [text, delimiter] = args;
    const sep = toStr(delimiter);
    if (sep === "") return new HVec([...toStr(text)]);
    return new HVec(toStr(text).split(sep));
  },
  "hh\\lib\\str\\repeat": (rt, args) => toStr(args[0]).repeat(Math.max(0, Math.trunc(toNum(args[1])))),
  "hh\\lib\\str\\replace": (rt, args) => {
    const [text, search, replacement] = args;
    return toStr(text).split(toStr(search)).join(toStr(replacement));
  },
  "hh\\lib\\str\\replace_every": (rt, args) => {
    const [text, replacements, ignoreCase] = args;
    let out = toStr(text);
    for (const [search, replacement] of rt.toItems(replacements).map((item) => rt.toItems(item))) {
      out = replaceAll(out, toStr(search), toStr(replacement), Boolean(ignoreCase));
    }
    return out;
  },
  "hh\\lib\\str\\slice": (rt, args) => {
    const text = toStr(args[0]);
    const chars = [...text];
    const start = Math.trunc(toNum(args[1]));
    const begin = start < 0 ? Math.max(0, chars.length + start) : Math.min(start, chars.length);
    if (args.length < 3 || args[2] === null) return chars.slice(begin).join("");
    const length = Math.trunc(toNum(args[2]));
    if (length < 0) return chars.slice(Math.max(0, chars.length + length), Math.max(0, chars.length + length) ).join("") && chars.slice(begin, chars.length + length).join("");
    return chars.slice(begin, begin + length).join("");
  },
  "hh\\lib\\str\\contains": (rt, args) => toStr(args[0]).includes(toStr(args[1])),
  "hh\\lib\\str\\starts_with": (rt, args) => toStr(args[0]).startsWith(toStr(args[1])),
  "hh\\lib\\str\\ends_with": (rt, args) => toStr(args[0]).endsWith(toStr(args[1])),
  "hh\\lib\\str\\strip_prefix": (rt, args) => {
    const text = toStr(args[0]);
    const prefix = toStr(args[1]);
    return text.startsWith(prefix) ? text.slice(prefix.length) : text;
  },
  "hh\\lib\\str\\strip_suffix": (rt, args) => {
    const text = toStr(args[0]);
    const suffix = toStr(args[1]);
    return text.endsWith(suffix) ? text.slice(0, -suffix.length) : text;
  },
  "hh\\lib\\str\\pad_left": (rt, args) => {
    const text = toStr(args[0]);
    const length = Math.trunc(toNum(args[1]));
    const pad = args.length > 2 && args[2] !== null ? toStr(args[2]) : " ";
    return padTo(text, length, pad, "left");
  },
  "hh\\lib\\str\\pad_right": (rt, args) => {
    const text = toStr(args[0]);
    const length = Math.trunc(toNum(args[1]));
    const pad = args.length > 2 && args[2] !== null ? toStr(args[2]) : " ";
    return padTo(text, length, pad, "right");
  },
  "hh\\lib\\str\\format": (rt, args) => sprintf(String(args[0]), args.slice(1), rt),
  "hh\\lib\\str\\search": (rt, args) => {
    const index = toStr(args[0]).indexOf(toStr(args[1]));
    return index === -1 ? null : index;
  },
  "hh\\lib\\str\\reverse": (rt, args) => [...toStr(args[0])].reverse().join(""),
  "hh\\lib\\str\\chunk": (rt, args) => {
    const chars = [...toStr(args[0])];
    const size = Math.max(1, Math.trunc(toNum(args[1])));
    const out = [];
    for (let index = 0; index < chars.length; index += size) out.push(chars.slice(index, index + size).join(""));
    return new HVec(out);
  },

  // Numbers
  "hh\\lib\\math\\abs": (rt, args) => Math.abs(toNum(args[0])),
  "hh\\lib\\math\\max": (rt, args) => {
    const items = args.length === 1 && isCollection(args[0]) ? rt.toItems(args[0]) : args;
    return items.reduce((best, item) => (compareValues(item, best) > 0 ? item : best), items[0]);
  },
  "hh\\lib\\math\\min": (rt, args) => {
    const items = args.length === 1 && isCollection(args[0]) ? rt.toItems(args[0]) : args;
    return items.reduce((best, item) => (compareValues(item, best) < 0 ? item : best), items[0]);
  },
  "hh\\lib\\math\\sum": (rt, args) => rt.toItems(args[0]).reduce((total, item) => total + toNum(item), 0),
  "hh\\lib\\math\\floor": (rt, args) => Math.floor(toNum(args[0])),
  "hh\\lib\\math\\ceil": (rt, args) => Math.ceil(toNum(args[0])),
  "hh\\lib\\math\\round": (rt, args) => {
    const value = toNum(args[0]);
    const precision = args.length > 1 ? Math.trunc(toNum(args[1])) : 0;
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
  },
  "hh\\lib\\math\\sqrt": (rt, args) => Math.sqrt(toNum(args[0])),
  "hh\\lib\\math\\pow": (rt, args) => toNum(args[0]) ** toNum(args[1]),
  "hh\\lib\\math\\base_convert": (rt, args) => {
    const value = Math.trunc(toNum(args[0]));
    const from = Math.trunc(toNum(args[1]));
    const to = Math.trunc(toNum(args[2]));
    const parsed = parseInt(String(value), from);
    return Math.trunc(parsed).toString(to);
  },
  "hh\\lib\\math\\clamp": (rt, args) => {
    const [value, low, high] = args.map(toNum);
    return Math.min(high, Math.max(low, value));
  },
  "hh\\lib\\math\\sign": (rt, args) => Math.sign(toNum(args[0])),

  // Collections
  "hh\\lib\\vec\\map": (rt, args) => {
    const [items, fn] = args;
    return new HVec(rt.toItems(items).map((item, index) => callKeyed(rt, fn, item, index)));
  },
  "hh\\lib\\vec\\filter": (rt, args) => {
    const [items, fn] = args;
    const all = rt.toItems(items);
    if (fn === undefined || fn === null) return new HVec(all.filter((item) => toBool(item)));
    return new HVec(all.filter((item, index) => toBool(callKeyed(rt, fn, item, index))));
  },
  "hh\\lib\\vec\\filter_with_key": (rt, args) => {
    const [items, fn] = args;
    const pairs = isDict(items) ? items.entries() : rt.toItems(items).map((item, index) => [index, item]);
    const out = pairs.filter(([key, value]) => toBool(callValue(rt, fn, [value, key], 0)));
    return isDict(items) ? new HDict(out) : new HVec(out.map(([, value]) => value));
  },
  "hh\\lib\\vec\\reverse": (rt, args) => new HVec([...rt.toItems(args[0])].reverse()),
  "hh\\lib\\vec\\sort": (rt, args) => {
    if (isCollection(args[0])) {
      const items = [...rt.toItems(args[0])].sort((a, b) => compareValues(a, b));
      if (isVec(args[0])) args[0].items = items;
      return null;
    }
    return new HVec(args);
  },
  "hh\\lib\\vec\\sort_by": (rt, args) => {
    const [items, fn] = args;
    return new HVec(
      [...rt.toItems(items)].sort((a, b) => compareValues(callValue(rt, fn, [a], 0), callValue(rt, fn, [b], 0))),
    );
  },
  "hh\\lib\\vec\\sort_by_key": (rt, args) => {
    const [items, fn] = args;
    const pairs = rt.toItems(items).map((value, index) => [index, value]);
    pairs.sort((a, b) => compareValues(callValue(rt, fn, [b[1], b[0]], 0), callValue(rt, fn, [a[1], a[0]], 0)));
    return new HVec(pairs.map(([, value]) => value));
  },
  "hh\\lib\\vec\\unique": (rt, args) => {
    const seen = new Set();
    const out = [];
    for (const item of rt.toItems(args[0])) {
      const key = typeof item === "object" ? JSON.stringify(toStr(item)) : `${typeof item}:${toStr(item)}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(item);
      }
    }
    return new HVec(out);
  },
  "hh\\lib\\vec\\concat": (rt, args) => {
    const out = [];
    for (const item of rt.toItems(args[0])) out.push(...rt.toItems(item));
    return new HVec(out);
  },
  "hh\\lib\\vec\\slice": (rt, args) => {
    const items = rt.toItems(args[0]);
    const start = Math.trunc(toNum(args[1]));
    const begin = start < 0 ? Math.max(0, items.length + start) : Math.min(start, items.length);
    if (args.length < 3 || args[2] === null) return new HVec(items.slice(begin));
    const length = Math.trunc(toNum(args[2]));
    if (length < 0) return new HVec(items.slice(begin, items.length + length));
    return new HVec(items.slice(begin, begin + length));
  },
  "hh\\lib\\vec\\take": (rt, args) => new HVec(rt.toItems(args[0]).slice(0, Math.max(0, Math.trunc(toNum(args[1]))))),
  "hh\\lib\\vec\\drop": (rt, args) => new HVec(rt.toItems(args[0]).slice(Math.max(0, Math.trunc(toNum(args[1]))))),
  "hh\\lib\\vec\\zip": (rt, args) => {
    const lists = args.map((value) => rt.toItems(value));
    const length = Math.min(...lists.map((items) => items.length));
    return new HVec(Array.from({ length }, (_, index) => new HVec(lists.map((items) => items[index]))));
  },
  "hh\\lib\\vec\\count": (rt, args) => rt.toItems(args[0]).length,
  "hh\\lib\\vec\\keys": (rt, args) => {
    const items = rt.toItems(args[0]);
    return new HVec(items.map((_, index) => index));
  },
  "hh\\lib\\vec\\contains": (rt, args) => rt.toItems(args[0]).some((item) => looseEquals(item, args[1])),
  "hh\\lib\\vec\\reduce": (rt, args) => {
    const [items, initial, fn] = args;
    let accumulator = initial;
    for (const item of rt.toItems(items)) accumulator = callValue(rt, fn, [accumulator, item], 0);
    return accumulator;
  },
  "hh\\lib\\vec\\chunk": (rt, args) => {
    const items = rt.toItems(args[0]);
    const size = Math.max(1, Math.trunc(toNum(args[1])));
    const out = [];
    for (let index = 0; index < items.length; index += size) out.push(new HVec(items.slice(index, index + size)));
    return new HVec(out);
  },
  "hh\\lib\\vec\\range": (rt, args) => {
    const [start, end, step = 1] = args.map((value) => toNum(value));
    const stride = step === 0 ? 1 : step;
    const out = [];
    if (stride > 0) for (let value = start; value <= end; value += stride) out.push(value);
    else for (let value = start; value >= end; value += stride) out.push(value);
    return new HVec(out);
  },
  "hh\\lib\\vec\\fill": (rt, args) => new HVec(Array(Math.max(0, Math.trunc(toNum(args[1])))).fill(args[0])),
  "hh\\lib\\dict\\map": (rt, args) => {
    const [items, fn] = args;
    const pairs = isDict(items) ? items.entries() : rt.toItems(items).map((item, index) => [index, item]);
    return new HDict(pairs.map(([key, value]) => [key, callKeyed(rt, fn, value, key)]));
  },
  "hh\\lib\\dict\\map_with_key": (rt, args) => {
    const [items, fn] = args;
    const pairs = isDict(items) ? items.entries() : rt.toItems(items).map((item, index) => [index, item]);
    return new HDict(pairs.map(([key, value]) => {
      const pair = callValue(rt, fn, [[key, value], key], 0);
      const [newKey, newValue] = rt.toItems(pair);
      return [newKey, newValue];
    }));
  },
  "hh\\lib\\dict\\filter": (rt, args) => {
    const [items, fn] = args;
    const pairs = isDict(items) ? items.entries() : rt.toItems(items).map((item, index) => [index, item]);
    const kept = pairs.filter(([key, value]) => toBool(callValue(rt, fn, [value, key], 0)));
    return isDict(items) ? new HDict(kept) : new HVec(kept.map(([, value]) => value));
  },
  "hh\\lib\\dict\\keys": (rt, args) => new HVec(isDict(args[0]) ? args[0].entries().map(([key]) => key) : rt.toItems(args[0]).map((_, index) => index)),
  "hh\\lib\\dict\\values": (rt, args) => new HVec(rt.toItems(args[0])),
  "hh\\lib\\dict\\count": (rt, args) => (isDict(args[0]) ? args[0].size : rt.toItems(args[0]).length),
  "hh\\lib\\dict\\contains": (rt, args) => (isDict(args[0]) ? args[0].has(args[1]) : false),
  "hh\\lib\\dict\\get": (rt, args) => {
    const [items, key] = args;
    if (isDict(items) && items.has(key)) return items.get(key);
    return args.length > 2 ? args[2] : null;
  },

  // Conversions and inspection
  "hh\\lib\\c\\intval": (rt, args) => Math.trunc(toNum(args[0])),
  "hh\\lib\\c\\floatval": (rt, args) => toNum(args[0]),
  "hh\\lib\\c\\strval": (rt, args) => toStr(args[0]),
  "hh\\lib\\c\\boolval": (rt, args) => toBool(args[0]),
  intval: (rt, args) => Math.trunc(toNum(args[0])),
  floatval: (rt, args) => toNum(args[0]),
  strval: (rt, args) => toStr(args[0]),
  boolval: (rt, args) => toBool(args[0]),
  "hh\\lib\\c\\count": (rt, args) => (isDict(args[0]) ? args[0].size : isKeyset(args[0]) ? args[0].size : rt.toItems(args[0]).length),
  count: (rt, args) => (isDict(args[0]) ? args[0].size : isKeyset(args[0]) ? args[0].size : rt.toItems(args[0]).length),
  "hh\\lib\\c\\is_int": (rt, args) => isInt(args[0]),
  "hh\\lib\\c\\is_float": (rt, args) => typeof args[0] === "number" && !isInt(args[0]),
  "hh\\lib\\c\\is_string": (rt, args) => typeof args[0] === "string",
  "hh\\lib\\c\\is_bool": (rt, args) => typeof args[0] === "boolean",
  "hh\\lib\\c\\is_null": (rt, args) => args[0] === null,
  "hh\\lib\\c\\is_array": (rt, args) => isCollection(args[0]),
  "hh\\lib\\c\\is_vec": (rt, args) => isVec(args[0]),
  "hh\\lib\\c\\is_dict": (rt, args) => isDict(args[0]),
  "hh\\lib\\c\\is_keyset": (rt, args) => isKeyset(args[0]),
  "hh\\lib\\c\\gettype": (rt, args) => typeName(args[0]),
  "hh\\lib\\c\\get_class": (rt, args) => (args[0] instanceof HObject ? args[0].className : "stdClass"),
  "hh\\lib\\c\\is_a": (rt, args) => {
    const [value, className] = args;
    if (!(value instanceof HObject)) return false;
    const cls = rt.findClass(value.className);
    return cls ? rt.isSubclassOf(cls, toStr(className)) : value.className === toStr(className);
  },

  // Formatting
  "hh\\lib\\str\\sprintf": (rt, args) => sprintf(String(args[0]), args.slice(1), rt),
  sprintf: (rt, args) => sprintf(String(args[0]), args.slice(1), rt),
  "hh\\lib\\str\\vsprintf": (rt, args) => sprintf(String(args[0]), rt.toItems(args[1]), rt),

  // Misc
  "hh\\lib\\io\\request_output": () => new RequestOutput(),
  "hh\\lib\\async\\later": (rt, args) => callValue(rt, args[0], [], 0),
  "hh\\lib\\uuid\\generate": (rt) => Math.random().toString(16).slice(2),
};

// `strlen`, `strtoupper`, ... — the C-style names still used in examples.
for (const [alias, target] of Object.entries({
  strlen: "hh\\lib\\str\\length",
  strtoupper: "hh\\lib\\str\\upper",
  strtolower: "hh\\lib\\str\\lower",
  ucfirst: "hh\\lib\\str\\capitalize",
  trim: "hh\\lib\\str\\trim",
  ltrim: "hh\\lib\\str\\trim_left",
  rtrim: "hh\\lib\\str\\trim_right",
  implode: "hh\\lib\\str\\join",
  explode: "hh\\lib\\str\\split",
  str_repeat: "hh\\lib\\str\\repeat",
  str_replace: "hh\\lib\\str\\replace",
  substr: "hh\\lib\\str\\slice",
  str_contains: "hh\\lib\\str\\contains",
  str_starts_with: "hh\\lib\\str\\starts_with",
  str_ends_with: "hh\\lib\\str\\ends_with",
  sprintf_alias: "hh\\lib\\str\\sprintf",
  abs: "hh\\lib\\math\\abs",
  max: "hh\\lib\\math\\max",
  min: "hh\\lib\\math\\min",
  array_sum: "hh\\lib\\math\\sum",
  floor: "hh\\lib\\math\\floor",
  ceil: "hh\\lib\\math\\ceil",
  round: "hh\\lib\\math\\round",
  sqrt: "hh\\lib\\math\\sqrt",
  pow: "hh\\lib\\math\\pow",
  is_int: "hh\\lib\\c\\is_int",
  is_float: "hh\\lib\\c\\is_float",
  is_string: "hh\\lib\\c\\is_string",
  is_bool: "hh\\lib\\c\\is_bool",
  is_null: "hh\\lib\\c\\is_null",
  is_array: "hh\\lib\\c\\is_array",
  gettype: "hh\\lib\\c\\gettype",
  get_class: "hh\\lib\\c\\get_class",
  range: "hh\\lib\\vec\\range",
})) {
  BUILTIN_FUNCTIONS[alias] = BUILTIN_FUNCTIONS[target];
}
BUILTIN_FUNCTIONS["len"] = (rt, args) => strLength(args[0]);
BUILTIN_FUNCTIONS.implode = (rt, args) => {
  const [glue, pieces] = args;
  if (pieces === null || pieces === undefined) return "";
  return rt.toItems(pieces).map((item) => toStr(item)).join(glue === undefined || glue === null ? "" : toStr(glue));
};

// Every key is stored with single backslashes and lower case, so that
// `HH\Lib\Str\join`, `Str\join` and the alias table all meet.
const BS = String.fromCharCode(92);
const NORMALIZED_FUNCTIONS = {};
for (const [name, fn] of Object.entries(BUILTIN_FUNCTIONS)) {
  NORMALIZED_FUNCTIONS[name.split(/[\\/]+/).filter(Boolean).join(BS).toLowerCase()] = fn;
}

const BUILTIN_CLASSES = {
  exception: (rt, args) => new HCatchable(toStr(args[0] ?? ""), 0, "Exception"),
  "hh\\exception": (rt, args) => new HCatchable(toStr(args[0] ?? ""), 0, "Exception"),
  "hh\\invariantexception": (rt, args) => new HCatchable(toStr(args[0] ?? ""), 0, "InvariantException"),
  "hh\\lib\\io\\requestoutput": () => new RequestOutput(),
  stdclass: () => new HObject("stdClass"),
};

class RequestOutput {
  constructor() {
    this.buffer = "";
  }
}

// Hack's collection callbacks take either one argument or two. A closure with
// one declared parameter is called with one, so arrows like `$x ==> $x * 2`
// see `$x` as asked.
const callKeyed = (rt, fn, value, key) => {
  if (typeof fn === "function" && fn.length <= 1) return fn([value]);
  return callValue(rt, fn, [value, key], 0);
};

const callValue = (rt, fn, args, line) => {
  if (typeof fn === "function") return fn(args);
  if (fn instanceof HClass) return rt.instantiate(fn, args, line);
  rt.fail(`${typeName(fn)} is not callable`, line);
  return null;
};

const strLength = (value) => [...toStr(value)].length;

const replaceAll = (text, search, replacement, ignoreCase) => {
  if (search === "") return text;
  if (!ignoreCase) return text.split(search).join(replacement);
  const pattern = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text.replace(new RegExp(pattern, "gi"), replacement);
};

const padTo = (text, length, pad, side) => {
  if (pad === "") return text;
  let out = text;
  while ([...out].length < length) {
    out = side === "left" ? pad[0] + out : out + pad[0];
  }
  return out;
};

const sprintf = (format, args, rt) => {
  let index = 0;
  return format.replace(/%(-?\d*)(?:\.(\d+))?([%sdifxboeg])/gi, (match, width, precision, kind) => {
    if (kind === "%") return "%";
    const value = args[index];
    index += 1;
    let text;
    switch (kind.toLowerCase()) {
      case "d":
      case "i":
        text = String(Math.trunc(toNum(value)));
        break;
      case "f":
        text = toNum(value).toFixed(precision === undefined ? 2 : Number(precision));
        break;
      case "x":
        text = Math.trunc(toNum(value)).toString(16);
        break;
      case "b":
        text = Math.trunc(toNum(value)).toString(2);
        break;
      case "o":
        text = Math.trunc(toNum(value)).toString(8);
        break;
      case "e":
        text = toNum(value).toExponential(precision === undefined ? 2 : Number(precision));
        break;
      case "g":
        text = String(toNum(value));
        break;
      default:
        text = toStr(value);
    }
    if (width) {
      const size = Math.abs(Number(width));
      if (size > [...text].length) {
        const padding = (width[0] === "-" ? "" : width[0] === "0" ? "0" : " ").repeat(size - [...text].length);
        text = width[0] === "-" ? text + padding : padding + text;
      }
    }
    return text;
  });
};

const dump = (value, depth = 0) => {
  const pad = "  ".repeat(depth);
  if (value === null) return `${pad}NULL\n`;
  if (value === true) return `${pad}bool(true)\n`;
  if (value === false) return `${pad}bool(false)\n`;
  if (typeof value === "number") return `${pad}${isInt(value) ? "int" : "float"}(${value})\n`;
  if (typeof value === "string") return `${pad}string(${value.length}) "${value}"\n`;
  if (isVec(value)) {
    return `${pad}vec(${value.items.length}) {\n${value.items.map((item, index) => `${pad}  [${index}]=>\n${dump(item, depth + 1)}`).join("")}${pad}}\n`;
  }
  if (isDict(value)) {
    return `${pad}dict(${value.size}) {\n${value.entries().map(([key, item]) => `${pad}  [${repr(key)}]=>\n${dump(item, depth + 1)}`).join("")}${pad}}\n`;
  }
  if (isKeyset(value)) {
    return `${pad}keyset(${value.size}) {\n${value.items().map((item) => `${pad}  [${repr(item)}]\n`).join("")}${pad}}\n`;
  }
  if (value instanceof HObject) {
    return `${pad}object(${value.className}) (0) {\n${pad}}\n`;
  }
  return `${pad}${toStr(value)}\n`;
};

// ---------------------------------------------------------------------------
// Collection methods and string methods used with `->`
// ---------------------------------------------------------------------------

const collectionMethod = (object, name) => {
  if (isVec(object)) {
    const items = object.items;
    const methods = {
      count: () => items.length,
      isempty: () => items.length === 0,
      contains: ([value]) => items.some((item) => looseEquals(item, value)),
      containskey: ([key]) => isInt(key) && key >= 0 && key < items.length,
      get: ([index]) => {
        if (!isInt(index) || index < 0 || index >= items.length) throw new HCatchable(`Index out of bounds: ${index}`, 0);
        return items[index];
      },
      firstkey: () => (items.length ? 0 : null),
      firstvalue: () => (items.length ? items[0] : null),
      lastkey: () => (items.length ? items.length - 1 : null),
      lastvalue: () => (items.length ? items[items.length - 1] : null),
      keys: () => new HVec(items.map((_, index) => index)),
      values: () => new HVec([...items]),
      map: ([fn], rt) => new HVec(items.map((item, index) => callValue(rt, fn, [item, index], 0))),
      mapwithkey: ([fn], rt) => new HVec(items.map((item, index) => callValue(rt, fn, [item, index], 0))),
      filter: ([fn], rt) => new HVec(items.filter((item, index) => toBool(callValue(rt, fn, [item, index], 0)))),
      filterwithkey: ([fn], rt) => new HVec(items.filter((item, index) => toBool(callValue(rt, fn, [item, index], 0)))),
      take: ([count]) => new HVec(items.slice(0, Math.max(0, Math.trunc(toNum(count))))),
      skip: ([count]) => new HVec(items.slice(Math.max(0, Math.trunc(toNum(count))))),
      slice: ([start, length]) => {
        const begin = Math.max(0, Math.trunc(toNum(start)));
        return new HVec(length === undefined || length === null ? items.slice(begin) : items.slice(begin, begin + Math.trunc(toNum(length))));
      },
      concat: (values) => new HVec([...items, ...values.flatMap((value) => (isVec(value) ? value.items : [value]))]),
      reverse: () => new HVec([...items].reverse()),
      sort: () => {
        object.items = [...items].sort(compareValues);
        return null;
      },
      tovec: () => new HVec([...items]),
      todict: () => new HDict(items.map((item, index) => [index, item])),
      tokeyset: () => new HKeyset(items),
      tovaluesarray: () => new HVec([...items]),
      zip: (others) => {
        const lists = [items, ...others.map((value) => (isVec(value) ? value.items : []))];
        const length = Math.min(...lists.map((list) => list.length));
        return new HVec(Array.from({ length }, (_, index) => new HVec(lists.map((list) => list[index]))));
      },
      zipwith: ([fn]) => new HVec(items.map((item, index) => callValue(null, fn, [item, index], 0))),
    };
    const method = methods[name];
    if (method) return [(items, args, rt) => method(args, rt)];
    return null;
  }

  if (isDict(object)) {
    const entries = () => object.entries();
    const methods = {
      count: () => object.size,
      isempty: () => object.size === 0,
      contains: ([key]) => object.has(key),
      containskey: ([key]) => object.has(key),
      get: ([key]) => (object.has(key) ? object.get(key) : null),
      keys: () => new HVec(entries().map(([key]) => key)),
      values: () => new HVec(entries().map(([, value]) => value)),
      firstkey: () => (entries().length ? entries()[0][0] : null),
      firstvalue: () => (entries().length ? entries()[0][1] : null),
      lastkey: () => (entries().length ? entries()[entries().length - 1][0] : null),
      lastvalue: () => (entries().length ? entries()[entries().length - 1][1] : null),
      map: ([fn], rt) => new HDict(entries().map(([key, value]) => [key, callValue(rt, fn, [value, key], 0)])),
      mapwithkey: ([fn], rt) => new HDict(entries().map(([key, value]) => {
        const [newKey, newValue] = (() => {
          const result = callValue(rt, fn, [key, value], 0);
          return isVec(result) ? result.items : [key, value];
        })();
        return [newKey, newValue];
      })),
      filter: ([fn], rt) => new HDict(entries().filter(([key, value]) => toBool(callValue(rt, fn, [value, key], 0)))),
      filterwithkey: ([fn], rt) => new HDict(entries().filter(([key, value]) => toBool(callValue(rt, fn, [value, key], 0)))),
      remove: ([key]) => {
        const had = object.has(key);
        object.map.delete(HDict.normalizeKey(key));
        return had ? object : null;
      },
      add: ([pair]) => {
        const [key, value] = isVec(pair) ? pair.items : [pair, null];
        object.set(key, value);
        return object;
      },
      set: ([key, value]) => {
        object.set(key, value);
        return object;
      },
      tovec: () => new HVec(entries().map(([key, value]) => new HVec([key, value]))),
      tovaluesarray: () => new HVec(entries().map(([, value]) => value)),
      tokeyset: () => new HKeyset(entries().map(([key]) => key)),
      tokeysarray: () => new HVec(entries().map(([key]) => key)),
    };
    const method = methods[name];
    if (method) return [(dict, args, rt) => method(args, rt)];
    return null;
  }

  if (isKeyset(object)) {
    const items = object.items();
    const methods = {
      count: () => object.size,
      isempty: () => object.size === 0,
      contains: ([value]) => object.has(value),
      add: ([value]) => {
        object.add(value);
        return object;
      },
      remove: ([value]) => {
        const had = object.has(value);
        object.map.delete(HDict.normalizeKey(value));
        return had ? object : null;
      },
      values: () => new HVec([...items]),
      map: ([fn], rt) => new HKeyset(items.map((item, index) => callValue(rt, fn, [item, index], 0))),
      filter: ([fn], rt) => new HKeyset(items.filter((item, index) => toBool(callValue(rt, fn, [item, index], 0)))),
      take: ([count]) => new HKeyset(items.slice(0, Math.max(0, Math.trunc(toNum(count))))),
      skip: ([count]) => new HKeyset(items.slice(Math.max(0, Math.trunc(toNum(count))))),
      tovec: () => new HVec([...items]),
      todict: () => new HDict(items.map((item) => [item, item])),
    };
    const method = methods[name];
    if (method) return [(keyset, args, rt) => method(args, rt)];
    return null;
  }
  return null;
};

const STRING_METHODS = {
  length: (value) => [...value].length,
};

const NUMBER_METHODS = {};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const formatFatal = (error, source, filename = "main.hack") => {
  const line = error.line || 1;
  const lines = String(source).split("\n");
  const caret = lines[line - 1] || "";
  const message = error.message.replace(/^HHVM Fatal Error: /, "");
  return (
    `HHVM Fatal Error: Uncaught ${error.className || "Error"}: ${message} ` +
    `in ${filename}:${line} (code 0)\n` +
    `Stack trace:\n` +
    `#0 main\n\n` +
    `${caret.trim().length ? caret : ""}\n`
  );
};

/**
 * Run a Hack program and return everything the caller needs to show it.
 *
 * @param {string} source Hack source text.
 * @param {object} [options]
 * @param {number} [options.maxSteps] Step budget before the run is stopped.
 * @param {number} [options.maxDepth] Call depth before the run is stopped.
 * @param {boolean} [options.noEntryPoint] Do not call `main` after the script body.
 * @returns {{ok: boolean, output: string, error: ?{message: string, line: number, className: string}, fatal: string, ms: number, steps: number}}
 */
export { tokenize };

export function runHack(source, options = {}) {
  const started = typeof performance !== "undefined" ? performance.now() : Date.now();
  const interpreter = new Interpreter(source, options);
  try {
    const tokens = tokenize(source);
    if (!tokens.length) {
      return { ok: true, output: "", error: null, fatal: "", ms: 0, steps: 0 };
    }
    const ast = new Parser(tokens, { tolerant: !options.strict }).parseProgram();
    const output = interpreter.run(ast);
    const ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - started;
    return { ok: true, output, error: null, fatal: "", ms, steps: interpreter.steps };
  } catch (error) {
    const ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - started;
    if (error instanceof ExitSignal) {
      return { ok: true, output: interpreter.output, error: null, fatal: "", ms, steps: interpreter.steps };
    }
    const hackError =
      error instanceof HCatchable || error instanceof HackError
        ? error
        : new HackError(error && error.message ? error.message : String(error), 0);
    return {
      ok: false,
      output: interpreter.output,
      error: { message: hackError.message, line: hackError.line || 0, className: hackError.className || (hackError instanceof HackError ? "ParseError" : "Error") },
      fatal: formatFatal(hackError, source),
      ms,
      steps: interpreter.steps,
    };
  }
}

export const hackVersion = "playground-1";
