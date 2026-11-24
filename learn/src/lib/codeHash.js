// A stable 32-bit hash of a code block.
//
// The content generator runs every code block in the manual through the
// playground interpreter and records the ones that run. At render time the
// hash tells the site whether a block gets a Run button, without shipping the
// code itself twice. Both sides must normalise the code the same way.

const normalise = (code) =>
  String(code)
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trim();

export const codeHash = (code) => {
  const text = normalise(code);
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

// A fragment from the manual often declares functions or classes without an
// entry point. Wrapping it in one is what the content generator verified, so
// the same wrapper is applied when the reader presses Run.
export const asProgram = (code) => {
  const text = normalise(code);
  // Something that is already a program: an entry point, a `main`, a
  // namespace block, or statements at the top level that print.
  if (/\bEntryPoint\b|function\s+main\s*\(|^namespace\s/m.test(text)) return text;
  if (/^\s*(echo|print)\b/m.test(text) && !/^function\s/m.test(text)) return text;
  if (/^\s*\$\w+\s*=/m.test(text) && !/^function\s/m.test(text)) return text;
  return `<<__EntryPoint>>\nasync function main(): Awaitable<void> {\n${text}\n}`;
};
