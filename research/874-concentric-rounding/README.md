# #874 concentric rounding

Research for the implementation gate in [#874](https://github.com/lukebennett88/luke-ui/issues/874):
how a nested Box takes its corners from the surface around it. It covers the concentric capability
only. The radius scale and its names are a separate decision in the same issue.

**Status: awaiting a maintainer decision.** Nothing in `packages/` changes. The prototype in
[`prototype/`](prototype) builds its own stylesheet from the production scales and runtime.

The maintainer provisionally supports `borderRadius="concentric"`, no parent prop, and elliptical
corners. This revision answers two follow-up questions and changes the proposal because of them:
padded Boxes with no radius now pass their surface's corners on, and nesting has no depth limit.

## Recommendation

Add one value to Box's existing `borderRadius` prop. The parent needs no prop.

```tsx
<Box borderRadius="overlay" padding="space.12">
	<Stack gap="space.8" padding="space.4">
		<Box borderRadius="concentric">Content</Box>
	</Stack>
</Box>
```

- `concentric` is a direct value only. It is not accepted inside a responsive object. The padding
  and radius around it can be responsive, and the child follows them.
- A Box with a radius is a surface. A Box with padding or a border and no radius is spacing: it
  passes the surface's corners on, less its own inset.
- It is static CSS. There is no React context, no layout measurement, and no extra inline custom
  property. `createSprinkles` adds one class.
- Every component that spreads Box's utilities, such as Stack and Grid, gets the same behaviour.

## How it works

A custom property cannot be defined from its own inherited value.
`--corner: calc(var(--corner) - 8px)` is a cycle, and CSS makes it invalid. A Box that takes its
corners from its parent and offers smaller ones to its children must therefore read one name and
write another. Two sets of names, A and B, are enough if each Box in a chain reads the set its
parent wrote.

1. **Mirror.** Each padding, border width, border style, and radius class also sets a private
   registered custom property in the same rule. The cascade that picks the winning padding picks the
   winning mirror, so shorthand, axis, side, and breakpoint precedence match by construction.
2. **Surface.** A Box with a radius publishes four values, one per logical side:
   `max(0px, radius - padding - border)`. It writes them to both sets. A corner takes its horizontal
   radius from its inline side and its vertical radius from its block side.
3. **Pass on.** A concentric Box, or a Box with padding or a border and no radius, reads one set and
   writes the other, less its own inset. A concentric Box also sets its four logical corner radii
   from the set it reads.
4. **Alternate.** A Box that passes values on also sets a parity. A container style query on that
   parity tells the next Box which set to read.
5. **Gate.** Every publishing rule applies only to a Box that contains a concentric Box, through
   `:has()`.

```css
/* 1. Mirror, in the existing utility rule */
.padding-bp768 {
	padding: var(--padding-bp768);
	--pad-bs: var(--padding-bp768); /* be, is, ie */
}

/* 2. Surface: both sets, at zero specificity */
:where(:where(.borderRadius-initial, …):has(.concentric):not(.concentric)) {
	--a-is: max(0px, var(--radius) - var(--pad-is) - var(--border-width) * var(--border-drawn));
	--b-is: /* the same */;
}

/* 3. Pass on: read A, write B */
.concentric {
	border-start-start-radius: var(--a-is, 0px) var(--a-bs, 0px); /* three more */
}
:where(
	:where(.concentric, :where(.padding-initial, …):not(.borderRadius-initial, …)):has(.concentric)
) {
	--a-is: inherit;
	--b-is: max(0px, var(--a-is, 0px) - var(--pad-is) - …);
	--parity: 1;
}

/* 4. Alternate: the nearest Box that passed values on wrote B, so read B and write A */
@container style(--parity: 1) {
	/* the two rules above with A and B swapped, and --parity: 2 */
}
```

[`prototype/src/build-utilities.ts`](prototype/src/build-utilities.ts) is the whole mechanism.
[`prototype/src/engine.ts`](prototype/src/engine.ts) is the change `@luke-ui/rainbow-sprinkles`
needs: a property can mirror its value, and keyword properties emit one class per value with
conditions as the outer loop.

## Why a padded Box with no radius broke nesting

The first round treated every Box with geometry as a surface. A Box with padding and no radius was a
surface with a radius of zero, so it published `max(0px, 0px - padding)`, which is zero. The child
became square.

That was a consequence of the depth limit, not a geometric rule. To pass corners on, a wrapper must
read its parent's values and write its own, exactly as a concentric Box does. Each wrapper would
then use one of the four levels. Padded Boxes are the most common Box in an application, so ordinary
page structure would use up the levels before reaching a card.

With the style query, a wrapper costs one selector and no depth. The prototype now supports it:

| Case                                           | First round | Now                                        |
| ---------------------------------------------- | ----------- | ------------------------------------------ |
| One padded Box between                         | Square      | Exact: 16 − 4 − 4 = 8 px                   |
| Two padded Boxes between, with different sides | Square      | Exact: elliptical `4px 8px` and `12px 8px` |
| A bordered Box between                         | Square      | Exact: the border counts, 7 px             |
| Wrapper padding that changes at a breakpoint   | Square      | Exact at each width                        |
| Padded Boxes around the surface                | No effect   | No effect                                  |

It does not add complexity. The stylesheet cost falls from 7,772 B to 6,858 B, because one
style-query block replaces a rule pair per level.

One judgement remains. A Box with a border or a background and no radius draws square corners of its
own. The prototype still treats it as spacing, so its child follows the rounded surface outside it.
The rule "a radius starts a surface" is simple to state. The alternative is to treat a drawn border
as a square surface.

In the captured pages, this pattern is rare in the DOM that first-party components render: 7 of
2,494 elements on the Button docs page, and none on the reference app's pages. That says nothing
about how often a consumer composes it with Box.

## Why nesting was limited to four levels

The limit came from how the first round chose between the two sets. CSS selectors can test for an
ancestor. They cannot count ancestors, so "an odd number of concentric ancestors" has to be written
out: `.c`, `.c .c`, `.c .c .c`, and so on. Each level is one more rule pair, and the last one
applies to everything deeper. Four was the number of rule pairs the prototype emitted.

Counting has a second flaw. A selector counts every concentric ancestor in the DOM, including ones
separated by a surface. The fifth concentric Box on a page could fail even when it was nested only
one level inside its own surface.

Three things remove the limit. The prototype measures each.

| Approach                           | Limit                                      | Added CSS, gzip        | Works in                                                                                           |
| ---------------------------------- | ------------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------- |
| Container style query (proposed)   | None                                       | 6,858 B, 897 B         | Chrome 111, Safari 18, Firefox 151                                                                 |
| More selector levels               | Still finite. 12 levels pass the fixture.  | 95,188 B, 1,700 B      | Everywhere                                                                                         |
| Style query over 4 selector levels | None where style queries work, 4 elsewhere | 18,978 B, 1,051 B      | Everywhere, with the limit as the fallback                                                         |
| React context                      | None in the React tree                     | No CSS for alternation | Everywhere. Every padded Box reads and provides a context, and a portal can disagree with the DOM. |
| CSS `inherit()`                    | None, and no second set                    | Smaller                | No engine ships it                                                                                 |

Selector levels do not scale once wrappers take part. Each ancestor in the selector becomes the long
list of padding classes, so four levels cost 16,268 B and still fail nine fixture cases.

The style query's cost is its browser floor. Firefox shipped it in version 151, in May 2026. In an
older browser the query block is ignored and every Box reads set A. The prototype builds that case
with `CONCENTRIC_ALTERNATION=none`:

- A concentric Box directly inside a surface is still exact.
- A second concentric level, or a concentric Box inside a padded wrapper, ignores the inset of the
  Box above it. Its radius is too large by that inset.
- Nothing becomes square and no layout changes.

Luke UI already ships one feature on these terms. `Prose` needs `@scope`, which reached Firefox in
version 146, and its documentation says older browsers show unstyled content.

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

Each engine runs 50 checks per width in the default theme and 45 in each other theme.
[`results/cases-1100.md`](prototype/results/cases-1100.md) lists every case with its measured inset,
expected corners, and actual corners. [`results/summary.md`](prototype/results/summary.md) has every
run. The script also writes screenshots, which are not committed.

The cases cover the issue's list:

| Issue case                              | Result                                                                                                                                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Uniform padding and radius              | Exact, four levels deep: 12, 8, 4, 0 px under a 16 px surface with 4 px padding. Eight levels are exact under a pill.                                                                        |
| Inline and block padding differ         | Exact. Corners are elliptical, for example `4px 12px`.                                                                                                                                       |
| Four independent logical sides, and RTL | Exact. The RTL result is the mirror of the LTR one.                                                                                                                                          |
| Borders                                 | Exact for Box's `borderWidth` with a drawn `borderStyle`, including a border that appears at a breakpoint. A `borderWidth` with no style adds nothing, which matches what the browser draws. |
| Asymmetric borders                      | Exact for a surface that publishes its own values. Box has no per-side border props.                                                                                                         |
| Responsive padding and radius           | Exact at each width.                                                                                                                                                                         |
| Shorthand, axis, and side precedence    | Exact, including `padding` with `paddingInline={{ bp768 }}` and three levels at three breakpoints.                                                                                           |
| Theme change at runtime                 | Exact after switching between three radius scales, including an all-square one.                                                                                                              |
| Clamping, no radius, zero radius, pill  | Clamps to 0. A pill surface gives a pill child.                                                                                                                                              |
| Explicit radius on a child              | The child uses its own radius, and its concentric children follow that radius.                                                                                                               |
| Intermediate Box and other wrappers     | Exact through a layout Box, a plain element, and a padded or bordered Box. Geometry follows DOM ancestry.                                                                                    |
| Server rendering                        | The server markup hydrates with no recoverable error and no markup difference.                                                                                                               |

### Stylesheet cost

Both builds contain the same utilities, so the difference is the feature
([`results/measurements.md`](prototype/results/measurements.md)). Production's stylesheet is 251,577
B and 17,209 B gzipped at `7efdd38a`. The proposal adds 6,858 B, or 897 B gzipped. That is 2.7% of
the stylesheet.

### Style cost on real pages

[`trees/`](prototype/trees) holds the rendered structure of six pages: four from the reference app,
one of them with a dialog open, and two from the docs site. Each records every element's padding,
border, radius, and children. The benchmark rebuilds each page with Box, at the nearest tokens.

- **Today** is the current utilities.
- **Unused** is the proposal on a page with no concentric Box.
- **Adopted** makes every rounded element inside another rounded element concentric. That is an
  upper bound on use.

Times are milliseconds per operation, medians from one machine. Read them as ratios. WebKit is the
Playwright build, not Safari.

| WebKit                             | Elements | Concentric | Mount: today | unused | adopted | Theme switch: today | unused | adopted |
| ---------------------------------- | -------- | ---------- | ------------ | ------ | ------- | ------------------- | ------ | ------- |
| Reference app, security settings   | 45       | 2          | 0.33         | 0.40   | 0.50    | 0.15                | 0.23   | 0.32    |
| Reference app, profile             | 78       | 8          | 0.51         | 0.64   | 0.81    | 0.24                | 0.38   | 0.56    |
| Reference app, preferences         | 88       | 7          | 0.64         | 0.71   | 0.96    | 0.26                | 0.41   | 0.60    |
| Reference app, profile with dialog | 105      | 11         | 0.67         | 0.85   | 1.12    | 0.42                | 0.49   | 0.69    |
| Docs home                          | 102      | 17         | 0.60         | 0.83   | 0.91    | 0.28                | 0.44   | 0.63    |
| Docs Button page                   | 2,494    | 168        | 10.5         | 14.5   | 18.0    | 5.0                 | 8.2    | 12.2    |
| Stress: 2,000 cards, 4 levels each | 8,001    | 6,000      | 92           | 94     | 191     | 33                  | 57     | 160     |

| Docs Button page | Mount: today | unused | adopted | Theme switch: today | unused | adopted |
| ---------------- | ------------ | ------ | ------- | ------------------- | ------ | ------- |
| Chromium         | 4.9          | 6.6    | 6.7     | 0.94                | 1.48   | 1.58    |
| Firefox          | 9.7          | 10.2   | 10.8    | 0.89                | 0.99   | 1.99    |
| WebKit           | 10.5         | 14.5   | 18.0    | 5.0                 | 8.2    | 12.2    |

- **Application pages.** On the reference app's pages the proposal adds 0.2 to 0.5 ms to a mount and
  0.2 to 0.4 ms to a full restyle in WebKit, at the upper bound of use.
- **A large page.** The Button docs page is the largest real page captured. In WebKit a mount goes
  from 10.5 to 18.0 ms and a theme switch from 5.0 to 12.2 ms with 168 concentric Boxes.
- **Unused cost is not zero.** A page that never uses the feature pays for the mirrors and for
  matching the new selectors: about 1.6 µs per element on mount in WebKit and 0.7 µs in Chromium.
- **Firefox pays for the style query under stress.** With 6,000 concentric Boxes a theme switch goes
  from 2 to 43 ms. On the Button docs page it goes from 0.9 to 2.0 ms.

### The `:has()` gate on real pages

| WebKit, Docs Button page | Gated | Ungated |
| ------------------------ | ----- | ------- |
| Mount, unused            | 14.5  | 15.8    |
| Mount, adopted           | 18.0  | 18.3    |
| Theme switch, unused     | 8.2   | 10.7    |
| Theme switch, adopted    | 12.2  | 13.2    |

- The gate saves WebKit 8% on mount and 24% on a theme switch for a real page that does not use the
  feature. On the stress tree it saves 39% and 52%.
- The gate costs Chromium about 4% on mount on the same page: 6.6 against 6.3 ms.
- `:has()` did not make DOM changes slower in any engine. Adding and removing a rounded subtree
  costs 0.084 ms gated and 0.090 ms ungated in WebKit on the Button docs page, against 0.081 ms
  today. An unrelated state change on one element moves by 0.002 ms.
- Production already uses `:has()` in 56 places.

The gate is worth keeping, and its benefit on real pages is modest. Most of WebKit's cost when the
feature is in use comes from the concentric Boxes themselves, which the gate does not remove.

## Supported geometry

A concentric Box is exact when all of these hold:

- It is a DOM descendant of a Box, or a first-party surface, that sets a radius through props.
- Its border edge is flush with the padding edge of the Box around it. Any padding or border between
  it and the surface comes from Box props.
- The surface's four corners share one radius, or the surface is itself concentric.

Within that, any nesting depth, any mix of logical side padding, padded and bordered wrappers,
responsive values, `borderWidth` with `borderStyle`, RTL, theme changes, and server rendering is
exact.

## Unsupported geometry

CSS cannot detect these. Each has a defined result, and the prototype asserts it.

| Layout                                                               | Result                                                                                   | What to do                               |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| Padding or border from `style`, `className`, or a plain element      | Radius too large by the unseen inset                                                     | Set the padding through Box props.       |
| The child has a margin, or is not flush for another reason           | Radius too large by the gap                                                              | Pass an explicit radius.                 |
| No Box ancestor with a radius, including a portal out of the surface | Square corners                                                                           | Pass an explicit radius.                 |
| `concentric` inside a responsive object                              | Rejected by the type                                                                     | Make the parent's values responsive.     |
| A surface whose corners differ from each other                       | Cannot be published. The contract is one radius per side.                                | Pass an explicit radius.                 |
| A border drawn with `box-shadow` or `outline`                        | Not counted                                                                              | Use `borderWidth`.                       |
| A browser without container style queries                            | Exact one level inside a surface. Deeper levels and wrappers are too round by one inset. | Nothing. It is a visual difference only. |

Four more limits are worth knowing:

- Every corner of a concentric Box follows the surface, including corners that are not near one of
  the surface's corners, such as the inner corners of stacked cards.
- When a surface's radius exceeds half its size, the browser scales the surface's corners down. A
  pill stays exact. Other shapes are approximate.
- A Box whose radius applies only from a breakpoint is a surface at every width. Below the
  breakpoint it publishes square corners instead of passing its parent's corners on. This case is
  not in the fixture.
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

| Approach                                                | Why not                                                                                                                                                   |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React context alternation with inline properties (#876) | Up to 54 inline properties on a Box, a context read in every Box, JavaScript padding resolution, and a React tree that can disagree with DOM inheritance. |
| Selector levels (the first round)                       | A depth limit, and no room for padded wrappers. See above.                                                                                                |
| CSS `inherit()`                                         | It would remove the two sets and the style query. No engine ships it. Chrome has an intent to prototype.                                                  |
| Publish from every Box, with no `:has()` gate           | Slightly faster in Chromium. Slower in WebKit for every page.                                                                                             |
| Publish eight values, one per corner and axis           | Supports surfaces with different corners. Box cannot author those, and it cost WebKit about a third more in the first round.                              |
| A `concentric` prop on the parent                       | Removes the gate and the publish cost for other Boxes. It adds the parent prop the issue wants to avoid, and a missing prop fails silently.               |
| A dedicated Surface component                           | Geometry already lives in Box's utilities. A second component would duplicate padding and radius props.                                                   |
| Public helpers only                                     | `deriveNestedRadius` already states the formula. It leaves the padding bookkeeping to the consumer, which is what the issue rules out.                    |

No CSS-native feature exists. The CSS Working Group tracks the idea in
[csswg-drafts#7707](https://github.com/w3c/csswg-drafts/issues/7707).

## Decisions needed

1. **The browser floor.** Accept container style queries for nesting and wrappers, with the
   degradation above in Firefox before 151 and Safari before 18. The fallback is the first round's
   design: four levels and square wrappers in every browser.
2. **What starts a surface.** The proposal is a radius. A drawn border with no radius could also
   start a square surface.
3. **The gate.** Keep `:has()`. It helps WebKit by 8% to 24% on a real page and costs Chromium about
   4% on mount.
4. **First-party surfaces.** Decide which components publish their geometry, such as Dialog and
   Popover. Each needs four values in each set from its own radius and padding.

Provisionally settled: the `concentric` value on `borderRadius`, no parent prop, and elliptical
corners for unequal insets.

## Production changes if approved

- `@luke-ui/rainbow-sprinkles`: add mirrors to `defineProperties`, and emit keyword classes with
  conditions as the outer loop.
- `utilities.css.ts`: add the mirrors, the surface and pass-on rules, the style-query block, and
  seven registered properties. `borderStyle` moves from six dynamic classes to 24 keyword classes,
  so a rule can record whether a border is drawn.
- Box's `borderRadius` type gains `'concentric'` outside the responsive union.
- Browser tests port the fixture's cases. The docs publish the two geometry sections above and the
  browser floor.
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

`CONCENTRIC_ALTERNATION` (`query`, `selectors`, `both`, `none`), `CONCENTRIC_DEPTH`,
`CONCENTRIC_WRAPPERS=0`, `CONCENTRIC_HAS=0`, and `CONCENTRIC_REGISTER_INPUTS=0` change the build.
`measure.mjs` builds the combinations in the tables above.
[`trees/capture.mjs`](prototype/trees/capture.mjs) recaptures the pages.
