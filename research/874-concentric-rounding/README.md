# #874 concentric rounding

Research for the implementation gate in [#874](https://github.com/lukebennett88/luke-ui/issues/874):
how a nested Box takes its corners from the surface around it. It covers the concentric capability
only. The radius scale and its names are a separate decision in the same issue.

**Status: awaiting a maintainer decision.** Nothing in `packages/` changes. The prototype in
[`prototype/`](prototype) builds its own stylesheet from the production scales and runtime.

## Recommendation

Add one value to Box's existing `borderRadius` prop. The parent needs no prop.

```tsx
<Box borderRadius="overlay" padding="space.12">
	<Box borderRadius="concentric">Content</Box>
</Box>
```

- `concentric` is a direct value only. It is not accepted inside a responsive object. The parent's
  padding and radius can be responsive, and the child follows them.
- It is static CSS. There is no React context, no layout measurement, and no extra inline custom
  property. `createSprinkles` adds one class.
- Every component that spreads Box's utilities, such as Stack and Grid, gets the same behaviour.

## How it works

A custom property cannot be defined from its own inherited value. That one constraint shapes the
design. A concentric Box must read the corners its parent published and publish its own for its
children, so it needs two names.

1. **Mirror.** Each padding, border width, border style, and radius class also sets a private
   registered custom property in the same rule. The cascade that picks the winning padding picks the
   winning mirror, so shorthand, axis, side, and breakpoint precedence match by construction.
2. **Publish.** A Box with geometry publishes four values, one per logical side:
   `max(0px, radius - padding - border)`. A corner takes its horizontal radius from its inline side
   and its vertical radius from its block side. The Box publishes them into two sets, A and B.
3. **Consume.** A concentric Box sets its four logical corner radii from one set and publishes into
   the other. Which set it reads alternates with the number of concentric ancestors, through plain
   descendant selectors.
4. **Gate.** Both publishing rules apply only when the Box contains a concentric Box, through
   `:has()`. A Box that never uses the feature computes nothing extra.

```css
/* 1. Mirror, in the existing utility rule */
.padding-bp768 {
	padding: var(--padding-bp768);
	--pad-bs: var(--padding-bp768); /* be, is, ie */
}

/* 2. Publish, at zero specificity */
:where(:where(.padding-initial, …):has(.concentric):not(.concentric)) {
	--a-is: max(0px, var(--radius) - var(--pad-is) - var(--border-width) * var(--border-drawn));
	--b-is: /* the same */;
}

/* 3. Consume, then alternate */
.concentric {
	border-start-start-radius: var(--a-is, 0px) var(--a-bs, 0px); /* three more */
}
.concentric:where(:has(.concentric)) {
	--a-is: inherit;
	--b-is: max(0px, var(--a-is, 0px) - …);
}
:where(.concentric) .concentric {
	/* reads B, publishes A */
}
```

[`prototype/src/build-utilities.ts`](prototype/src/build-utilities.ts) is the whole mechanism.
[`prototype/src/engine.ts`](prototype/src/engine.ts) is the change `@luke-ui/rainbow-sprinkles`
needs: a property can mirror its value, and keyword properties emit one class per value with
conditions as the outer loop.

## Evidence

`node verify.mjs chromium firefox webkit` checks every case at 600, 800, and 1,100 px, in three
radius themes, in three engines. A check does not read the variables under test. It measures the gap
between the child's and the surface's border boxes from layout, subtracts it from the surface's
computed corners, and compares the result with the child's computed corners on both axes.

| Engine                 | Geometry and fallback checks | Server render and hydrate | Box layout against today's build |
| ---------------------- | ---------------------------- | ------------------------- | -------------------------------- |
| Chromium 158.0.8127.18 | pass                         | pass                      | identical                        |
| Firefox 159.0          | pass                         | pass                      | identical                        |
| WebKit 27.2            | pass                         | pass                      | identical                        |

Each engine runs 51 checks per width in the default theme and 45 in each other theme.
[`results/cases-1100.md`](prototype/results/cases-1100.md) lists every case with its measured inset,
expected corners, and actual corners. [`results/summary.md`](prototype/results/summary.md) has every
run. The script also writes screenshots, which are not committed.

The cases cover the issue's list:

| Issue case                              | Result                                                                                                                                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Uniform padding and radius              | Exact, four levels deep: 12, 8, 4, 0 px under a 16 px surface with 4 px padding.                                                                                                             |
| Inline and block padding differ         | Exact. Corners are elliptical, for example `4px 12px`.                                                                                                                                       |
| Four independent logical sides, and RTL | Exact. The RTL result is the mirror of the LTR one.                                                                                                                                          |
| Borders                                 | Exact for Box's `borderWidth` with a drawn `borderStyle`, including a border that appears at a breakpoint. A `borderWidth` with no style adds nothing, which matches what the browser draws. |
| Asymmetric borders                      | Exact for a surface that publishes its own values. Box has no per-side border props.                                                                                                         |
| Responsive padding and radius           | Exact at each width.                                                                                                                                                                         |
| Shorthand, axis, and side precedence    | Exact, including `padding` with `paddingInline={{ bp768 }}` and three levels at three breakpoints.                                                                                           |
| Theme change at runtime                 | Exact after switching between three radius scales, including an all-square one.                                                                                                              |
| Clamping, no radius, zero radius, pill  | Clamps to 0. A pill surface gives a pill child.                                                                                                                                              |
| Explicit radius on a child              | The child uses its own radius, and its concentric children follow that radius.                                                                                                               |
| Layout Box or plain element between     | Exact. Geometry follows DOM ancestry.                                                                                                                                                        |
| Server rendering                        | The server markup hydrates with no recoverable error and no markup difference.                                                                                                               |

### Cost

Both builds contain the same utilities, so the difference is the feature
([`results/measurements.md`](prototype/results/measurements.md)). Production's stylesheet is 251,577
B and 17,209 B gzipped at `7efdd38a`.

| Configuration                | Added CSS | Added CSS, gzip |
| ---------------------------- | --------- | --------------- |
| Proposed: gated, 4 levels    | 7,792 B   | 913 B           |
| Ungated: every Box publishes | 7,551 B   | 879 B           |
| Gated, 2 levels              | 6,214 B   | 870 B           |
| Gated, 8 levels              | 11,188 B  | 965 B           |

The proposal adds 3.1% to the stylesheet. Each level of nesting costs about 850 B, or 13 B gzipped.

Runtime cost is style computation only. The fixture carries 231 inline custom properties with the
feature and 285 without, because `concentric` is a class and a token radius is an inline variable.

The benchmark mounts 8,000 Boxes with geometry and then switches theme, which restyles every Box.
Times are mount / restyle in milliseconds, medians from one machine. Read them as ratios.

| Engine   | Today    | Proposed, unused | Proposed, used on 6,000 | Ungated, unused | #876's context on every Box |
| -------- | -------- | ---------------- | ----------------------- | --------------- | --------------------------- |
| Chromium | 25 / 5.4 | 30 / 9.1         | 31 / 13.0               | 25 / 6.1        | 28 / 5.4                    |
| Firefox  | 46 / 2.0 | 48 / 2.0         | 42 / 2.0                | 46 / 3.0        | 50 / 2.0                    |
| WebKit   | 69 / 30  | 89 / 49          | 146 / 102               | 157 / 114       | 70 / 29                     |

- WebKit is the engine that pays. Computing a custom property from `max()` and `var()` costs it
  about 9 µs per Box on each full restyle.
- The `:has()` gate is why the proposal is gated. Without it every padded Box pays WebKit's cost,
  whether or not the page uses the feature. With it an unused Box pays about 2.5 µs in WebKit and
  0.5 µs in Chromium.
- A page with 1,000 Boxes that all take part pays about 9 ms more per full restyle in WebKit on this
  machine. That is the worst case.
- The last column has only the React cost of #876's design, without its inline properties.

## Supported geometry

A concentric Box is exact when all of these hold:

- It is a DOM descendant of a Box, or a first-party surface, that sets padding, a border, or a
  radius through props.
- Its border edge is flush with that surface's padding edge. Elements between them add no padding,
  border, or margin.
- The surface's four corners share one radius, or the surface is itself concentric.
- No more than four concentric Boxes are among its ancestors.

Within that, any mix of logical side padding, responsive values, `borderWidth` with `borderStyle`,
RTL, theme changes, and server rendering is exact.

## Unsupported geometry

CSS cannot detect these. Each has a defined result, and the prototype asserts it.

| Layout                                                                             | Result                                                    | What to do                                                                         |
| ---------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| A Box with padding and no radius sits between                                      | Square corners. The wrapper is the nearest geometry.      | Pass `borderRadius="concentric"` to the wrapper too. Its padding then accumulates. |
| Padding or border from `style`, `className`, or a plain element                    | Radius too large by the unseen inset                      | Set the padding through Box props.                                                 |
| The child has a margin, or is not flush for another reason                         | Radius too large by the gap                               | Pass an explicit radius.                                                           |
| No Box ancestor with geometry, including a portal out of the surface               | Square corners                                            | Pass an explicit radius.                                                           |
| A fifth concentric ancestor, when two concentric Boxes nest directly at that depth | The child repeats its parent's radius                     | Raise the depth. Each level costs 13 B gzipped.                                    |
| `concentric` inside a responsive object                                            | Rejected by the type                                      | Make the parent's values responsive.                                               |
| A surface whose corners differ from each other                                     | Cannot be published. The contract is one radius per side. | Pass an explicit radius.                                                           |
| A border drawn with `box-shadow` or `outline`                                      | Not counted                                               | Use `borderWidth`.                                                                 |

Three more limits are worth knowing:

- Every corner of a concentric Box follows the surface, including corners that are not near one of
  the surface's corners, such as the inner corners of stacked cards.
- When a surface's radius exceeds half its size, the browser scales the surface's corners down. A
  pill stays exact. Other shapes are approximate.
- Vertical writing modes and shadow roots were not tested. The CSS is logical throughout, but
  `@property` registration is scoped to the document.

## The #876 prototype

The StyleX prototype in [#1048](https://github.com/lukebennett88/luke-ui/pull/1048) was rebuilt at
`2962b946`. Its 14 measured elements reproduce its committed results exactly at both widths. Probing
it found:

| Probe                                                         | Expected                           | #876                                                                 | This prototype        |
| ------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------- | --------------------- |
| `padding="space.24"` with `paddingInline={{ bp768 }}`, 600 px | 0 px                               | `16px 0px`, and the parent's inline padding is 0 px instead of 24 px | 0 px                  |
| `borderWidth` with no `borderStyle`                           | 8 px                               | 6 px                                                                 | 8 px                  |
| Padding from `style`                                          | 0 px                               | 8 px                                                                 | Too large, documented |
| Padded plain element between                                  | 0 px                               | 8 px                                                                 | Too large, documented |
| Portal into another Box                                       | Follows React or DOM, consistently | Reads the React parent's set through the DOM host's values           | Follows the DOM       |
| Inline custom properties on one Box                           |                                    | 54, where its README says "up to 50"                                 | 0 added               |

Its precedence bug comes from resolving padding in JavaScript with `side ?? axis ?? padding`. That
cannot reproduce a cascade in which a responsive axis overrides the shorthand at one breakpoint
only. Mirroring inside the CSS rule removes the question.

## Alternatives

| Approach                                                | Why not                                                                                                                                                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React context alternation with inline properties (#876) | Up to 54 inline properties on a Box, a context read in every Box, JavaScript padding resolution, and a React tree that can disagree with DOM inheritance.                                             |
| CSS `inherit()`                                         | It would remove the two sets. No engine ships it. Chrome has an intent to prototype.                                                                                                                  |
| Container style queries for alternation                 | No depth limit, and it passes in all three engines here. Firefox shipped it in version 151, in May 2026. Too new for a library baseline. The prototype keeps it as `concentric-query` for comparison. |
| Publish from every Box, with no `:has()` gate           | 0.4 ms faster to restyle 1,000 Boxes in Chromium. 8 ms slower in WebKit, for every page.                                                                                                              |
| Publish eight values, one per corner and axis           | Supports surfaces with different corners. Box cannot author those, and it costs WebKit about a third more.                                                                                            |
| A `concentric` prop on the parent                       | Removes the gate and the publish cost for other Boxes. It adds the parent prop the issue wants to avoid, and a missing prop fails silently.                                                           |
| A dedicated Surface component                           | Geometry already lives in Box's utilities. A second component would duplicate padding and radius props.                                                                                               |
| Public helpers only                                     | `deriveNestedRadius` already states the formula. It leaves the padding bookkeeping to the consumer, which is what the issue rules out.                                                                |

No CSS-native feature exists. The CSS Working Group tracks the idea in
[csswg-drafts#7707](https://github.com/w3c/csswg-drafts/issues/7707).

## Decisions needed

1. **The opt-in.** Approve a `concentric` value on `borderRadius`, accepted only as a direct value.
2. **The gate.** Approve `:has()`. The alternative is cheaper in Chromium and costs every WebKit
   page.
3. **Depth.** Four levels is the proposal.
4. **Padded wrappers.** The prototype treats a padded Box with no radius as square. The wrapper can
   opt in to accumulate instead. Making every padded Box accumulate needs an alternation with no
   depth limit, which means style queries.
5. **Elliptical corners.** Unequal insets give elliptical corners, which is how CSS draws the inside
   of an uneven border. A circular corner from the smaller radius is the alternative.
6. **First-party surfaces.** Decide which components publish their geometry, such as Dialog and
   Popover. Each needs four values in each set from its own radius and padding.

## Production changes if approved

- `@luke-ui/rainbow-sprinkles`: add mirrors to `defineProperties`, and emit keyword classes with
  conditions as the outer loop.
- `utilities.css.ts`: add the mirrors, the publish and concentric rules, and seven registered
  properties. `borderStyle` moves from six dynamic classes to 24 keyword classes, so a rule can
  record whether a border is drawn.
- Box's `borderRadius` type gains `'concentric'` outside the responsive union.
- Browser tests port the fixture's cases. The docs publish the two geometry sections above.
- `deriveConcentricRadius` and `deriveNestedRadius` stay private. Recipes that publish geometry can
  use `deriveNestedRadius`.

## Reproduce

Install dependencies at the repository root first. The prototype resolves its tools from
`@luke-ui/react`.

```sh
cd research/874-concentric-rounding/prototype
ln -s ../../../packages/@luke-ui/react/node_modules node_modules
./node_modules/.bin/playwright install chromium firefox webkit
./node_modules/.bin/vp build
node verify.mjs chromium firefox webkit
node measure.mjs
```

`CONCENTRIC_DEPTH`, `CONCENTRIC_HAS=0`, `CONCENTRIC_QUERY=0`, and `CONCENTRIC_REGISTER_INPUTS=0`
change the build. `measure.mjs` runs each combination.
