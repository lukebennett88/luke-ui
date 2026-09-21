# Turbo Generators

Custom generators for `turbo generate`.

## Generators

- `component`: Scaffolds `@luke-ui/react` components, colocated recipes, a complete
  `*.browser.test.tsx`, hosted docs wrappers, hosted docs controls, and structural docs navigation.
- `primitive`: Scaffolds `@luke-ui/react/primitives/*` entrypoints, colocated recipes, a complete
  `*.browser.test.tsx`, and the style module registry.

The component generator asks for name, docs group, and whether to add visual coverage. The primitive
generator asks for name, whether to add hosted docs, and whether to add visual coverage.

Generated component and primitive folders use a named implementation file. Public modules live in
`src/exports/`.

The generated component and primitive tests (`<name>.browser.test.tsx`) are real, runnable coverage
— not a placeholder — matching the repo-wide test model (one browser test per component or
primitive, covering behaviour, accessibility, and visual regression together; see
`docs/TESTING.md`). Each scaffolds:

- a DOM-forwarding test (`expectForwardsDomProps` / `expectHtmlElement`);
- one representative scene, shared by the axe check and the visual capture;
- an axe accessibility test over that scene;
- a `{ tags: ['visual'] }` kitchen-sink case looping every `visualAppearances` entry, when visual
  coverage is requested;
- a placeholder behavioural test with a TODO for the author to replace.

Both scaffolds are deliberately opinionated and complete — the philosophy is "generate it, then
delete what is clearly unnecessary" — so a new component or primitive starts with axe and visual
coverage by default, and the author removes whichever of those (or the placeholder test) protects
nothing meaningful for it. Primitives are lower-level than components and often have no meaningful
appearance of their own, so declining visual coverage in the prompt is expected to be common; axe
coverage stays scaffolded by default because even a bare-bones primitive can regress accessibility.

## Usage

```bash
pnpm generate:component
pnpm generate:primitive
```

## Structure

- `config.ts`: Turbo/Plop adapter that collects answers and invokes the creation flow.
- `src/component-creation-plan.ts`: Component generator rules, answer parsing, and planned files.
- `src/primitive-creation-plan.ts`: Primitive generator rules, answer parsing, and planned files.
- `src/apply-creation-plan.ts`: Applies parsed creation plans to the repository.
- `src/apply-component-creation-plan.ts`: Applies a parsed component scaffold to the repository.
- `src/apply-primitive-creation-plan.ts`: Applies a parsed primitive scaffold to the repository.
