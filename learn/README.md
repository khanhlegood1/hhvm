# HHVM & Hack — Field Manual

A learning site built **from the manual in this repository**. Every lesson is one
page of [`hphp/hack/manual`](../hphp/hack/manual), cut into steps at build time;
nothing is retyped, copied into a CMS or fetched from the network.

```bash
cd learn
npm install
npm run dev      # http://localhost:5173
npm run build    # static site in learn/dist
```

## What is in it

| Tab | What it does |
| --- | --- |
| **Learn** | 208 lessons in 29 chapters (Hack + HHVM), split into 967 guided steps. Three panes: course tree, the page itself, and a per-step guide. Progress, resume and deep links (`#/learn/hack/types/nullable-types/3`) live in `localStorage`. |
| **Exam** | A 114-question bank covering all 29 chapters, with a timer, scoring and history. Quick paper (10 min, 10 random questions), full paper (whole bank) or a paper for one chapter. Pass mark 70%. |
| **Playground** | A small Hack-subset interpreter written in JavaScript — **not HHVM**. Vectors, dicts, keysets, classes, interfaces, traits, enums, generics, exceptions, lambdas, `match`, generators, pipes — with `vec`/`dict`/`keyset` value semantics. Twelve graded exercises, plus a *Run* button on the code blocks the interpreter can actually run. |
| **Library** | Search over every concept in the manual, diacritic-folded, so `bien` finds `biến` and `vec` finds `Vector`. |

Vietnamese is the default language; the EN/VI button and the light/dark button
are in the header, and `Ctrl/⌘+K` or `/` opens the search palette from anywhere.

## How the content is generated

`scripts/gen-content.mjs` walks `hphp/hack/manual`, reads the Docusaurus
frontmatter and `_category_.json` files, and writes `src/content/manual.json`:

- lesson ids are the manual's own URLs (`hack/types/nullable-types`), so links
  inside the manual keep working;
- a page becomes one step per `##`/`###` section, with code fences kept whole,
  admonitions lifted into their own step and giant settings tables cut between
  rows — no step is a wall of text;
- Meta-internal `<Fb*>` blocks are dropped, and pages that only forward the
  reader elsewhere are flagged as pointers instead of lessons.

`scripts/render-check.mjs` server-renders the app (mocking `localStorage`) and
fails if any of the eight view cases breaks. `scripts/test-hack.mjs` runs the
interpreter regression suite, `scripts/test-bank.mjs` runs every exam question
through the interpreter and checks its answer and explanation against the
manual. `npm run check` runs all three; `prebuild` runs them before every build,
so `npm run build` cannot ship a broken step.

## Deploying to GitHub Pages

`.github/workflows/static.yml` builds this site and publishes `learn/dist` to
<https://khanhlegood1.github.io/hhvm/> on every push to `master`; it can also be
started by hand from the Actions tab. The workflow checks out only `learn` and
`hphp/hack/manual`, runs `npm ci` and then `npm run build` — which runs the
whole check suite first, so a broken page fails the deployment instead of
being published.

The asset base path comes from `actions/configure-pages` (`base_path`, `/hhvm`
here), so renaming the repository or attaching a custom domain does not need
the workflow edited. To build the same thing locally:

```bash
VITE_BASE=/hhvm/ npm run build
```

The site is a single page with hash routes, so it needs no server rewrites, and
`public/.nojekyll` keeps Pages from running Jekyll over the output. When
`VITE_BASE` is unset (or `/`), assets are emitted with relative paths, so the
same `dist/` also works from a subdirectory of any static host.
