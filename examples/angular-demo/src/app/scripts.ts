// ─────────────────────────────────────────────────────────────
// Built-in example FlowScript scripts for the demo
// ─────────────────────────────────────────────────────────────

export interface DemoScript {
  id: string;
  title: string;
  description: string;
  source: string;
}

export const DEMO_SCRIPTS: DemoScript[] = [
  {
    id: "intro",
    title: "Introduction",
    description: "Actors, narration, if/else branching, and goto loops.",
    source: `
declare actor1 = Actor("Adam")
declare actor2 = Actor("Eve")
declare hasKey = false

chapter START:
    "It was a quiet morning in Grayvale."
    actor1 "I have nothing to do today."
    if hasKey:
        actor1 "Wait... I already have the key?"
    else:
        actor1 "Maybe I should explore."
    call log("Player entered exploration mindset")
    goto ENCOUNTER

chapter ENCOUNTER:
    actor2 "Hello there, traveler."
    actor1 "Oh! Hi, Eve. I was just looking for something to do."
    actor2 "Then follow me."
    "The two adventurers set off together."
`.trim(),
  },
  {
    id: "counter",
    title: "Variables & Interpolation",
    description: "declare / set, arithmetic, and string interpolation.",
    source: `
declare hero = Actor("Lyra")
declare steps = 0
declare goal = 3

chapter START:
    hero "Time to train!"
    set steps = steps + 1
    hero "That's step \${steps}."
    set steps = steps + 1
    hero "Step \${steps} done."
    set steps = steps + 1
    if steps >= goal:
        "Lyra completes all \${goal} steps. Training finished!"
    else:
        "Something went wrong with the count."
`.trim(),
  },
  {
    id: "branching",
    title: "if / elseif / else",
    description: "Condition chains and nested branching.",
    source: `
declare mood = "curious"
declare hero = Actor("Kira")

chapter START:
    hero "Good morning, world!"
    if mood == "happy":
        hero "What a beautiful day!"
        "Kira smiles warmly at the sunrise."
    elseif mood == "sad":
        hero "I just can't get going today..."
        "Kira sighs heavily."
    elseif mood == "curious":
        hero "I wonder what today will bring."
        "Kira's eyes light up with anticipation."
    else:
        hero "Hmm, not sure how I feel."
    hero "Well — adventure awaits either way!"
`.trim(),
  },
  {
    id: "functions",
    title: "Function Calls",
    description: "call statement with registered engine hooks.",
    source: `
declare narrator = Actor("Narrator")
declare player = Actor("Hero")

chapter START:
    call setTitle("The Grand Hall")
    narrator "The hall falls silent."
    player "I am ready."
    call log("scene: grand_hall")
    call announce("player_ready")
    "The doors open before the hero."
`.trim(),
  },
];
