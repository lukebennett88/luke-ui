/**
 * Canonical CSS cascade-layer order for Luke UI, lowest → highest priority.
 *
 * This is the single source of truth for layer ordering. Both `panda.config.ts`
 * and the stylesheet assembler (`scripts/assemble-stylesheet.ts`) import it so
 * the emitted `@layer …;` declaration can never drift between the two.
 *
 * - **reset** — Normalize browser defaults (box-sizing, margins, form elements).
 * - **base** — Base typographic and element defaults.
 * - **tokens** — Design-token aliases.
 * - **recipes** — Component styles (variants, compound variants).
 * - **box** — The Box component's style props. Not a native Panda layer; produced
 *   by re-wrapping Panda's `utilities` output in the assembler.
 * - **utilities** — One-off overrides; highest-priority escape hatch.
 */
export const lukeLayerOrder = ['reset', 'base', 'tokens', 'recipes', 'box', 'utilities'] as const;
