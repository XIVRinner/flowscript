import {
  Program, Node, Expression,
  BlockNode,
  StepResult, FunctionHook, RuntimeContext,
} from "../types.js";
import { tokenize } from "../lexer/index.js";
import { parseExpressionTokens } from "../parser/index.js";

// ─────────────────────────────────────────────────────────────
// Execution frame – a list of nodes with a read cursor
// ─────────────────────────────────────────────────────────────

interface Frame {
  nodes: Node[];
  index: number;
}

// ─────────────────────────────────────────────────────────────
// Engine
// ─────────────────────────────────────────────────────────────

export class Engine {
  private stack: Frame[] = [];
  private state: Map<string, unknown> = new Map();
  private chapters: Map<string, BlockNode> = new Map();
  private hooks: Map<string, FunctionHook> = new Map();

  constructor(program: Program) {
    // Pre-register all chapters for goto resolution
    for (const node of program.body) {
      if (node.type === "block") {
        this.chapters.set(node.name, node);
      }
    }
    // Execution starts from the top-level body
    this.stack.push({ nodes: program.body, index: 0 });
  }

  // ── public API ──────────────────────────────────────────

  /**
   * Register a callable function hook.
   * Usage: engine.registerFunction("log", (ctx, msg) => console.log(msg))
   */
  registerFunction(name: string, fn: FunctionHook): this {
    this.hooks.set(name, fn);
    return this;
  }

  /** Return a snapshot of the current variable state. */
  getState(): Record<string, unknown> {
    return Object.fromEntries(this.state);
  }

  /**
   * Advance execution by one dialogue beat.
   * Returns `{ type: "say" | "narration" | "end" }`.
   * Skips over silent nodes (declare, set, goto, call, if, block) internally.
   */
  next(): StepResult {
    while (true) {
      if (this.stack.length === 0) return { type: "end" };

      const frame = this.stack[this.stack.length - 1];

      if (frame.index >= frame.nodes.length) {
        this.stack.pop();
        continue;
      }

      const node = frame.nodes[frame.index++];
      const result = this.exec(node);
      if (result !== null) return result;
    }
  }

  // ── node execution ───────────────────────────────────────

  private exec(node: Node): StepResult | null {
    switch (node.type) {

      case "say": {
        const actor = this.state.get(node.actor);
        return { type: "say", actor, text: this.interpolate(node.text) };
      }

      case "narration":
        return { type: "narration", text: this.interpolate(node.text) };

      case "declare": {
        const v = this.evalExpr(node.value);
        this.state.set(node.name, v);
        return null;
      }

      case "set": {
        const v = this.evalExpr(node.value);
        this.state.set(node.name, v);
        return null;
      }

      case "if": {
        for (const branch of node.branches) {
          const pass = branch.condition === null || this.evalExpr(branch.condition);
          if (pass) {
            this.stack.push({ nodes: branch.body, index: 0 });
            break;
          }
        }
        return null;
      }

      case "goto": {
        const chapter = this.chapters.get(node.target);
        if (!chapter) {
          throw new Error(`goto: unknown chapter "${node.target}" at line ${node.line}`);
        }
        // Clear the entire stack; start fresh from the target chapter body
        this.stack = [{ nodes: chapter.body, index: 0 }];
        return null;
      }

      case "call": {
        const fn = this.hooks.get(node.name);
        if (fn) {
          const args = node.args.map(a => this.evalExpr(a));
          fn(this.makeContext(), ...args);
        }
        return null;
      }

      case "block":
        // Chapters encountered during normal flow push their body inline
        this.stack.push({ nodes: node.body, index: 0 });
        return null;

      case "js":
        // js: blocks are stubbed – no execution
        return null;

      default:
        return null;
    }
  }

  // ── expression evaluator ─────────────────────────────────

  private evalExpr(expr: Expression): unknown {
    switch (expr.type) {

      case "literal":
        return expr.value;

      case "identifier":
        return this.state.get(expr.name) ?? null;

      case "binary": {
        // Short-circuit evaluation for && and ||
        if (expr.operator === "&&") {
          return this.evalExpr(expr.left) && this.evalExpr(expr.right);
        }
        if (expr.operator === "||") {
          return this.evalExpr(expr.left) || this.evalExpr(expr.right);
        }

        const l = this.evalExpr(expr.left);
        const r = this.evalExpr(expr.right);

        switch (expr.operator) {
          case "+" : return (l as number) +  (r as number);
          case "-" : return (l as number) -  (r as number);
          case "*" : return (l as number) *  (r as number);
          case "/" : return (l as number) /  (r as number);
          case "==": return l === r;
          case "!=": return l !== r;
          case ">" : return (l as number) >  (r as number);
          case "<" : return (l as number) <  (r as number);
          case ">=": return (l as number) >= (r as number);
          case "<=": return (l as number) <= (r as number);
        }
        break;
      }

      case "unary": {
        const v = this.evalExpr(expr.operand);
        if (expr.operator === "!")  return !v;
        if (expr.operator === "-")  return -(v as number);
        break;
      }

      case "call_expr": {
        const fn = this.hooks.get(expr.name);
        if (!fn) return null;
        const args = expr.args.map(a => this.evalExpr(a));
        return fn(this.makeContext(), ...args);
      }

      case "member": {
        const obj = this.evalExpr(expr.object);
        if (obj == null || typeof obj !== "object") return null;
        return (obj as Record<string, unknown>)[expr.property] ?? null;
      }
    }
    return null;
  }

  // ── string interpolation  ─────────────────────────────────

  /**
   * Replace ${…} patterns inside a string by evaluating each
   * inner expression in the current state context.
   */
  private interpolate(text: string): string {
    if (!text.includes("${")) return text;

    return text.replace(/\$\{([^}]+)\}/g, (_, inner: string) => {
      try {
        const tokens = tokenize(inner.trim());
        const expr   = parseExpressionTokens(tokens);
        const value  = this.evalExpr(expr);
        return value != null ? String(value) : "";
      } catch {
        return "";
      }
    });
  }

  // ── context object passed to hooks ───────────────────────

  private makeContext(): RuntimeContext {
    return {
      getVar: (name) => this.state.get(name) ?? null,
      setVar: (name, value) => { this.state.set(name, value); },
    };
  }
}
