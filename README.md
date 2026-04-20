# FlowScript

A TypeScript-first dialogue scripting engine and DSL for branching narratives. Write stories in a clean, indentation-based syntax; drive them step-by-step from your game, app, or UI.

```
declare hero = Actor("Lyra")

chapter START:
    "A strange door stood at the end of the hall."
    hero "I've never seen this door before."
    goto START
```

---

## Features

- **Indentation-based DSL** — no braces, minimal punctuation
- **Step-based runtime** — `engine.next()` returns one beat at a time; you control the loop
- **Typed AST** — full TypeScript types for every node, expression, and result
- **Pluggable hooks** — register any function (`Actor`, `log`, `playSFX`, …) from host code
- **String interpolation** — `"${hero.name} steps forward."` evaluated against live state
- **Goto / chapters** — named chapters act as labels; `goto` jumps between them
- **Zero dependencies** — hand-written lexer, recursive-descent parser, frame-stack runtime

---

## Installation

```bash
npm install flowscript
```

---

## Quick Start

```ts
import { compile, Engine } from "flowscript";

const source = `
declare hero = Actor("Lyra")
declare coins = 5

chapter START:
    hero "Hello, world!"
    if coins > 3:
        "Lyra feels wealthy today."
    else:
        "Lyra counts her coins carefully."
    goto START
`;

const engine = new Engine(compile(source));

// Register value-returning hooks used inside expressions
engine.registerFunction("Actor", (_ctx, name) => ({ name }));

// Register side-effect hooks used with `call`
engine.registerFunction("log", (_ctx, msg) => console.log("[log]", msg));

let step = engine.next();
let i = 0;

while (step.type !== "end" && i++ < 10) {
  if (step.type === "say") {
    const actor = step.actor as { name: string };
    console.log(`${actor.name}: ${step.text}`);
  } else if (step.type === "narration") {
    console.log(`  ${step.text}`);
  }
  step = engine.next();
}
```

---

## Project Structure

```
src/
  types.ts          — All AST node types, expression types, runtime types
  lexer/index.ts    — Tokeniser (source → Token[])
  parser/index.ts   — Recursive-descent parser (Token[] → Program AST)
  runtime/index.ts  — Frame-stack Engine + expression evaluator
  index.ts          — Public API + compile() convenience function

examples/
  example1.fsc          — Sample FlowScript source file
  angular-demo/         — Angular showcase app (npm start inside this dir)
```

---

## Angular Demo

```bash
cd examples/angular-demo
npm install
node node_modules/@angular/cli/bin/ng.js serve
# → http://localhost:4200
```

The demo shows all four capability areas side-by-side: source viewer, live dialogue runner, and a variable state panel.

---

## API Reference

See [docs/api.md](docs/api.md) for the full API.  
See [docs/language.md](docs/language.md) for the language reference.  
See [docs/architecture.md](docs/architecture.md) for internals.

---

## License

MIT
