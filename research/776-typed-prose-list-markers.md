# #776 typed Prose list markers

Decision recommendation for [#776](https://github.com/lukebennett88/luke-ui/issues/776) under
release epic [#709](https://github.com/lukebennett88/luke-ui/issues/709). Follow-up from the #717
contract landed in [#770](https://github.com/lukebennett88/luke-ui/pull/770). This record re-checks
the Chromium gap against current browsers and primary sources, then stops for a design decision
before any behaviour change.

## Recommendation

**Retain the documented limitation for 1.0.** Do not ship a Chromium-only workaround.

There is still no narrowly scoped CSS fix that restores `type="a"`, `"A"`, `"i"`, and `"I"` under a
`base`-layer list reset in Chromium while preserving uppercase and lowercase distinctions, leaving
behaviour without a reset alone, and avoiding page-wide `@counter-style` names. Waiting for Chromium
to ship the Selectors 4 `s` flag remains the correct long-term path. Existing tests and Prose rules
already switch to the full expectation when `CSS.supports('selector([type="A" s])')` becomes true.

## Problem

HTML maps `ol` `type` to `list-style-type` through a presentational hint
([HTML rendering: lists](https://html.spec.whatwg.org/multipage/rendering.html#lists)). Any author
`list-style`, including Tailwind Preflight's `ol, ul { list-style: none }` in `base`, beats that
hint. `Prose` restates the HTML rules in `luke-ui.recipes`:

```94:105:packages/@luke-ui/react/src/core/prose/recipe.css.ts
// Markers are restated so a framework reset below Luke UI, such as Tailwind Preflight, cannot
// remove them. That reset also beats the HTML `type` hint, so typed lists restate the HTML rendering
// rules for `type`. HTML matches `type` case-insensitively unless a selector uses the `s` flag.
// Where `s` is unsupported (Chromium), those typed rules match nothing. The presentational hint
// remains, but an author list reset still beats it, so letter and roman markers stay `none`.
proseStyle('ul, ol', { paddingInlineStart: vars.space.sp24 });
proseStyle('ul', { listStyleType: 'disc' });
proseStyle('ol:not([type]), ol[type="1"]', { listStyleType: 'decimal' });
proseStyle('ol[type="a" s]', { listStyleType: 'lower-alpha' });
proseStyle('ol[type="A" s]', { listStyleType: 'upper-alpha' });
proseStyle('ol[type="i" s]', { listStyleType: 'lower-roman' });
proseStyle('ol[type="I" s]', { listStyleType: 'upper-roman' });
```

HTML matches `type` case-insensitively in selectors, so only the `s` flag can tell `a` from `A`.
Chromium still does not support that flag ([crbug 40667738](https://crbug.com/40667738);
[MDN BCD](https://github.com/mdn/browser-compat-data/blob/main/css/selectors/attribute.json);
[Can I use](https://caniuse.com/mdn-css_selectors_attribute_case_sensitive_modifier)). Firefox 66+
and Safari 27+ do.

## Evidence (2026-10-13)

### Browsers measured here

| Engine              | Product                     | `CSS.supports('selector([type="A" s])')` | Typed `attr(type type(<custom-ident>))` |
| ------------------- | --------------------------- | ---------------------------------------- | --------------------------------------- |
| System Chrome       | Chrome/148.0.7778.96        | `false`                                  | `true`                                  |
| Playwright Chromium | HeadlessChrome/156.0.8078.4 | `false`                                  | `true`                                  |

Can I use still marks Chrome through 157 and Edge through 154 as unsupported for the `s` modifier.
Safari 27+ already supports `s`, so it restores letter and roman markers under a reset with the
current Prose rules. A Chromium-only typed-`attr()` enhancement gated with `@supports` would not
change Safari's path.

### Markers under a Preflight-shaped reset

Harness: `@layer base { ol, ul { list-style: none; } }` plus the current Prose `s`-flag rules in
`luke-ui`, measured in Chrome 148.

| `ol`       | No author reset | Base reset + current Prose rules |
| ---------- | --------------- | -------------------------------- |
| untyped    | `decimal`       | `decimal`                        |
| `type="1"` | `decimal`       | `decimal`                        |
| `type="a"` | `lower-alpha`   | `none`                           |
| `type="A"` | `upper-alpha`   | `none`                           |
| `type="i"` | `lower-roman`   | `none`                           |
| `type="I"` | `upper-roman`   | `none`                           |

Without a reset, every type still shows the native presentational hint. The gap is Chromium plus a
list reset only.

The built stylesheet keeps the `s` selectors (`dist/stylesheet.css`). The gated browser tests pass:

- `packages/@luke-ui/react/src/core/prose/prose.browser.test.tsx`: both typed-list cases
- Expectations under reset when `s` is unsupported: `decimal`, then four `none`s

### Approaches re-checked in Chrome 148 over a base reset

| Approach                                                           | `a` / `A` / `i` / `I`                             | Meets constraints?                                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Current `[type="…" s]` rules                                       | `none` / `none` / `none` / `none`                 | Yes for Firefox/Safari; Chromium gap unchanged                                      |
| `list-style-type: revert`                                          | all `decimal`                                     | No: loses letter and roman                                                          |
| `list-style-type: revert-layer`                                    | all `none` (and `type="1"` also `none`)           | No: rolls back to Preflight                                                         |
| Case-insensitive `[type="a"]` / `[type="A"]` pairs                 | last matching rule wins; both cases collapse      | No: loses case distinction                                                          |
| Same CI rules with **no** reset                                    | `a`→`upper-alpha`, `i`→`upper-roman` (rule order) | No: breaks markers even without a reset                                             |
| `attr(type type(<custom-ident>))` + `@counter-style a`/`A`/`i`/`I` | works for letter and roman                        | No for product: page-wide counter-style names, collision risk, and added complexity |

Extra attr() detail: `type="1"` is not a valid `<custom-ident>`, so a bare
`list-style-type: attr(type type(<custom-ident>))` computed to the initial `disc` for `type="1"` in
Chrome 148. Any attr() path would still need the existing decimal rule (or an explicit fallback).

## Options (from #776)

1. **Wait for Chromium's `s` flag.** No Luke UI change. Tests flip to the full expectation when
   support lands.
2. **Chromium-oriented `attr()` progressive enhancement** next to the `s` rules, with page-wide
   `@counter-style` names `a`, `A`, `i`, and `I`.
3. **Keep the documented limitation for 1.0.**

## Tradeoffs

| Choice                       | Upside                                                                                                                                                              | Downside                                                                                                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 + 3 together (recommended) | Correct HTML case mapping; no global counter-style footprint; no reset-free regression; docs and tests already describe the gap; auto-heals when Chromium ships `s` | Chromium + Preflight (or any `base` list reset) still shows no letter/roman markers inside `Prose` until then                                                                                                       |
| 2                            | Chromium markers restored under reset today                                                                                                                         | Reserves short, page-wide `@counter-style` names with collision risk; adds gating and dual-path complexity next to the `s` rules; sticky once typed `attr()` is widely available; conflicts with the #770 rejection |

A case-insensitive fallback is not a fourth option. It fails the “preserve uppercase/lowercase” and
“behaviour without a reset” constraints in current Chromium.

## Acceptance criteria

### If the decision is “retain for 1.0” (recommended)

- [ ] No change to `recipe.css.ts` typed-list rules for 1.0.
- [ ] Public Prose docs keep the Chromium-under-reset exception
      (`apps/docs/content/docs/components/typography/prose.mdx`).
- [ ] Browser tests stay gated on `CSS.supports('selector([type="A" s])')`.
- [ ] This record and the [Typed lists](./717-global-stylesheet-contract.md#typed-lists) section of
      #717 state the 1.0 decision.
- [ ] #776 closes as a documented limitation for 1.0, with a follow-up only when
      [crbug 40667738](https://crbug.com/40667738) ships (or support is confirmed in a Chromium CI
      browser).

### If the decision is instead “ship attr() PE”

- [ ] Keep the `s`-flag rules for engines that support them.
- [ ] Gate `@counter-style` + `attr()` so engines without typed `attr()` never take that path.
- [ ] Keep `ol:not([type]), ol[type="1"]` decimal (or an attr() fallback to `decimal`).
- [ ] Prove no reset-free change for `a`/`A`/`i`/`I` in Chromium, Firefox, and Safari.
- [ ] Document the reserved page-wide counter-style names and collision risk.
- [ ] Update Prose and Tailwind integration tests to expect all five markers in Chromium under
      Preflight.

## Out of scope

- #718 device checks remain open and are not part of this decision.
- The local font-family serialization failure recorded in `.agents/papercuts.md` is unrelated and
  must not expand this work.
