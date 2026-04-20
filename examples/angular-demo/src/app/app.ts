import { Component, inject, OnInit } from '@angular/core';
import { DialogueRunnerComponent } from './dialogue-runner/dialogue-runner.component';
import { StateViewerComponent } from './state-viewer/state-viewer.component';
import { DEMO_SCRIPTS, DemoScript } from './scripts';
import { FlowscriptService } from './flowscript.service';

@Component({
  selector: 'app-root',
  imports: [DialogueRunnerComponent, StateViewerComponent],
  template: `
    <div class="shell">
      <!-- ── Header ───────────────────────────────────────── -->
      <header class="topbar">
        <div class="brand">
          <span class="brand-icon">◈</span>
          <span class="brand-name">FlowScript</span>
          <span class="brand-sub">engine demo</span>
        </div>

        <nav class="script-tabs">
          @for (s of scripts; track s.id) {
            <button
              class="tab"
              [class.active]="activeScript?.id === s.id"
              (click)="select(s)"
            >
              {{ s.title }}
            </button>
          }
        </nav>
      </header>

      <!-- ── Body ─────────────────────────────────────────── -->
      <main class="body">
        <!-- Left: source panel -->
        <aside class="source-panel">
          <div class="panel-label">FlowScript source</div>
          <pre class="source-code">{{ activeScript?.source }}</pre>

          <div class="script-meta">
            <p>{{ activeScript?.description }}</p>
            <button class="btn-restart" (click)="restart()">↺ Restart</button>
          </div>
        </aside>

        <!-- Middle: dialogue runner -->
        <section class="dialogue-panel">
          <div class="panel-label">Dialogue</div>
          <app-dialogue-runner />
        </section>

        <!-- Right: state viewer -->
        <aside class="state-panel-wrap">
          <div class="panel-label">State</div>
          <app-state-viewer />
        </aside>
      </main>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100vh; }

    .shell {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: var(--font);
    }

    /* ── TopBar ───────────────────────────────── */

    .topbar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: .6rem 1.25rem;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .brand {
      display: flex;
      align-items: baseline;
      gap: .4rem;
    }

    .brand-icon { color: var(--accent); font-size: 1.1rem; }
    .brand-name { font-weight: 800; font-size: 1.05rem; }
    .brand-sub  { color: var(--text-muted); font-size: .78rem; }

    .script-tabs {
      display: flex;
      gap: .35rem;
    }

    .tab {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-muted);
      border-radius: 5px;
      padding: .3rem .75rem;
      font-size: .82rem;
      cursor: pointer;
      transition: all .15s;
    }

    .tab:hover  { color: var(--text); border-color: var(--accent-dim); }
    .tab.active {
      background: var(--accent);
      color: #000;
      border-color: var(--accent);
      font-weight: 700;
    }

    /* ── Body ─────────────────────────────────── */

    .body {
      flex: 1;
      display: grid;
      grid-template-columns: 280px 1fr 220px;
      overflow: hidden;
    }

    .source-panel,
    .dialogue-panel,
    .state-panel-wrap {
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .source-panel     { border-right: 1px solid var(--border); }
    .state-panel-wrap { border-left: 1px solid var(--border); }

    .panel-label {
      padding: .4rem .9rem;
      font-size: .65rem;
      font-weight: 700;
      letter-spacing: .12em;
      text-transform: uppercase;
      color: var(--text-muted);
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    /* ── Source panel ─────────────────────────── */

    .source-code {
      flex: 1;
      overflow-y: auto;
      margin: 0;
      padding: .9rem 1rem;
      font-family: monospace;
      font-size: .77rem;
      line-height: 1.6;
      color: var(--text-code);
      tab-size: 4;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .script-meta {
      border-top: 1px solid var(--border);
      padding: .75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: .5rem;
    }

    .script-meta p {
      margin: 0;
      font-size: .78rem;
      color: var(--text-muted);
      line-height: 1.4;
    }

    .btn-restart {
      align-self: flex-start;
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-muted);
      border-radius: 5px;
      padding: .3rem .75rem;
      font-size: .8rem;
      cursor: pointer;
      transition: all .15s;
    }

    .btn-restart:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
  `],
})
export class App implements OnInit {
  protected readonly svc = inject(FlowscriptService);
  protected readonly scripts = DEMO_SCRIPTS;
  protected activeScript: DemoScript | null = null;

  ngOnInit(): void {
    this.select(this.scripts[0]);
  }

  select(script: DemoScript): void {
    this.activeScript = script;
    this.svc.load(script.source);
  }

  restart(): void {
    if (this.activeScript) this.svc.load(this.activeScript.source);
  }
}
