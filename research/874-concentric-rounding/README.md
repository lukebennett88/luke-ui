# #874 concentric rounding

Research for the implementation gate in [#874](https://github.com/lukebennett88/luke-ui/issues/874):
how a nested Box takes its corners from the surface around it. It covers the concentric capability
only. The radius scale and its names are a separate decision in the same issue.

**Status: architecture settled on 12 November 2026.** [Decisions](#decisions) lists the outcomes,
which are also recorded on #874. This directory is a research record: production work starts from a
fresh branch and does not carry over the harness, benchmarks, fixtures, or scripts. The prototype in
[`prototype/`](prototype) builds its own stylesheet from the production scales and runtime.

## Recommendation

Add one value to Box's existing `borderRadius` prop. The parent needs no prop.

```tsx
<Box borderRadius="overlay" padding="space.12">
	<Stack gap="space.8" padding="space.4">
		<Box borderRadius="concentric">Content</Box>
	</Stack>
</Box>
```

- `concentric` is a direct value only. It is not accepted inside a responsive object. The padding,
  borders, and radius around it can be responsive, and the child follows them.
- A Box starts a surface when it has a radius, or when it draws a border. A Box with a drawn border
  and no radius is a square surface, so a concentric child inside it is square.
- Any other Box with padding is spacing. It passes the surface's corners on, less its padding.
- Each Box decides this at every width from the values that win the cascade there.
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
2. **Offer.** A Box offers a flush child one value per logical side. A corner takes its horizontal
   radius from its inline side and its vertical radius from its block side.
   - A surface with a radius offers `radius - padding - border`.
   - A surface with a drawn border and no radius offers zero.
   - Spacing offers what it was given, less its padding.
   - A concentric Box offers what it was given, less its padding and border.
   - Every offer is clamped at zero.
3. **Decide in the value.** One expression covers all three kinds of Box, so no selector has to know
   which kind a Box is at a given width:
   `max(0px, radius - pad - border, given - radius × 100000 - pad - border × 100000)`. With a radius
   or a drawn border the second term is far below zero, so the Box is a surface. With neither, the
   first term is at most zero and the second passes the parent's value on.
4. **Alternate.** A custom property cannot be defined from its own inherited value, so each Box
   reads one set of names and writes the other. It also writes a parity. A container style query on
   the parity tells the next Box which set to read.
5. **Gate.** Every rule that writes applies only to a Box that contains a concentric Box, through
   `:has()`.

```css
/* 1. Mirror, in the existing utility rule */
.padding-bp768 {
	padding: var(--padding-bp768);
	--pad-bs: var(--padding-bp768); /* be, is, ie */
}

/* 2. Base rules. A Box writes both sets from its own values. */
:where(:where(.padding-initial, …, .borderRadius-initial, …):has(.concentric):not(.concentric)) {
	--a-is: max(0px, var(--radius) - var(--pad-is) - var(--border-width) * var(--border-drawn));
	--b-is: /* the same */;
	--parity: 2;
}
.concentric {
	border-start-start-radius: var(--a-is, 0px) var(--a-bs, 0px); /* three more */
}
:where(.concentric:has(.concentric)) {
	--a-is: inherit;
	--b-is: max(0px, var(--a-is, 0px) - var(--pad-is) - …);
	--parity: 1;
}

/* 3. Under a Box that wrote B, read B and write A. Under one that wrote A, the reverse. */
@container style(--parity: 1) {
	/* the same three rules with A and B swapped, and the plain Box using the expression above */
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

With the style query, a wrapper costs no depth. The prototype now supports it:

| Case                                           | First round | Now                                        |
| ---------------------------------------------- | ----------- | ------------------------------------------ |
| One padded Box between                         | Square      | Exact: 16 − 4 − 4 = 8 px                   |
| Two padded Boxes between, with different sides | Square      | Exact: elliptical `4px 8px` and `12px 8px` |
| Wrapper padding that changes at a breakpoint   | Square      | Exact at each width                        |
| Padded Boxes around the surface                | No effect   | No effect                                  |

A Box that draws a border and has no radius is a square surface, by the maintainer's decision. Its
concentric child is square. A border that is drawn only from a breakpoint makes the Box a surface
from that breakpoint, and spacing below it. A `borderStyle` with a zero width draws nothing, so that
Box is spacing.

In the captured pages, padding between two rounded elements is rare in the DOM that first-party
components render: 7 of 2,494 elements on the Button docs page, and none on the reference app's
pages. That says nothing about how often a consumer composes it with Box.

## Why nesting was limited to four levels

The limit came from how the first round chose between the two sets. CSS selectors can test for an
ancestor. They cannot count ancestors, so "an odd number of concentric ancestors" has to be written
out: `.c`, `.c .c`, `.c .c .c`, and so on. Each level is one more rule pair, and the last one
applies to everything deeper. Four was the number of rule pairs the prototype emitted.

Counting has a second flaw. A selector counts every concentric ancestor in the DOM, including ones
separated by a surface. The fifth concentric Box on a page could fail even when it was nested only
one level inside its own surface.

Three things remove the limit. The selector rows were measured at `4e9eef1d`, before the bordered
surface and breakpoint changes, and that builder has since been removed.

| Approach                           | Limit                                      | Added CSS, gzip        | Works in                                                                                           |
| ---------------------------------- | ------------------------------------------ | ---------------------- | -------------------------------------------------------------------------------------------------- |
| Container style query (decided)    | None                                       | 9,139 B, 1,002 B       | Chrome 111, Safari 18, Firefox 151                                                                 |
| More selector levels               | Still finite. 12 levels pass the fixture.  | 95,188 B, 1,700 B      | Everywhere                                                                                         |
| Style query over 4 selector levels | None where style queries work, 4 elsewhere | 18,978 B, 1,051 B      | Everywhere, with the limit as the fallback                                                         |
| React context                      | None in the React tree                     | No CSS for alternation | Everywhere. Every padded Box reads and provides a context, and a portal can disagree with the DOM. |
| CSS `inherit()`                    | None, and no second set                    | Smaller                | No engine ships it                                                                                 |

Selector levels do not scale once wrappers take part. Each ancestor in the selector becomes the long
list of padding classes, so four levels cost 16,268 B and still fail nine fixture cases.

The style query's cost is its browser floor. Firefox shipped it in version 151, in May 2026. In an
older browser the query blocks are ignored and every Box reads set A. The prototype builds that case
with `CONCENTRIC_STYLE_QUERY=0`:

- A concentric Box directly inside a surface is still exact.
- A second concentric level, or a concentric Box inside a padded wrapper, ignores the inset of the
  Box above it. Its radius is too large by that inset. A wrapper's own padding is ignored.
- Nothing becomes square and no layout changes.

Luke UI already ships one feature on these terms. `Prose` needs `@scope`, which reached Firefox in
version 146, and its documentation says older browsers show unstyled content.

## The cascade

The design changes no rule that sets a property today, and adds no selector stronger than one class.

| Rules the feature adds                      | Count | Specificity          |
| ------------------------------------------- | ----- | -------------------- |
| Mirrors, inside the existing property rules | 0 new | Unchanged: 1 class   |
| `.concentric`, which sets the four corners  | 2     | 1 class              |
| Every rule that writes a set or the parity  | 5     | 0, inside `:where()` |

- Responsive precedence is the existing cascade. A mirror sits in the rule that sets its property,
  so the class that wins at a width also sets the mirror for that width.
- `.concentric` is as specific as a `borderRadius` token class and sits in the same layer. A Box
  carries one `borderRadius` value, so the two never meet.
- A consumer's class, a later cascade layer, or `style` overrides a concentric Box's corners. The
  fixture asserts all three. A consumer's padding class on a concentric Box is not mirrored. Its own
  corners stay correct, because they come from its parent. Its children see the Box prop's padding.
- An earlier version gave the breakpoint surface rule one class of specificity so that it beat the
  wrapper rules. The decision now lives in the value, so no rule has to win.

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

Each engine runs 58 checks per width in the default theme and 53 in each other theme.
[`results/cases-1100.md`](prototype/results/cases-1100.md) lists every case with its measured inset,
expected corners, and actual corners. [`results/summary.md`](prototype/results/summary.md) has every
run. The script also writes screenshots, which are not committed.

The cases cover the issue's list:

| Issue case                              | Result                                                                                                                                                                                                                                             |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Uniform padding and radius              | Exact, four levels deep: 12, 8, 4, 0 px under a 16 px surface with 4 px padding. Eight levels are exact under a pill.                                                                                                                              |
| Inline and block padding differ         | Exact. Corners are elliptical, for example `4px 12px`.                                                                                                                                                                                             |
| Four independent logical sides, and RTL | Exact. The RTL result is the mirror of the LTR one.                                                                                                                                                                                                |
| Borders                                 | Exact for Box's `borderWidth` with a drawn `borderStyle`, including a border that appears at a breakpoint. A `borderWidth` with no style adds nothing, which matches what the browser draws. A drawn border with no radius makes a square surface. |
| Asymmetric borders                      | Exact for a surface that publishes its own values. Box has no per-side border props.                                                                                                                                                               |
| Responsive padding and radius           | Exact at each width.                                                                                                                                                                                                                               |
| Shorthand, axis, and side precedence    | Exact, including `padding` with `paddingInline={{ bp768 }}` and three levels at three breakpoints.                                                                                                                                                 |
| Theme change at runtime                 | Exact after switching between three radius scales, including an all-square one.                                                                                                                                                                    |
| Clamping, no radius, zero radius, pill  | Clamps to 0. A pill surface gives a pill child.                                                                                                                                                                                                    |
| Explicit radius on a child              | The child uses its own radius, and its concentric children follow that radius.                                                                                                                                                                     |
| Intermediate Box and other wrappers     | Exact through a layout Box, a plain element, and a padded Box. A bordered Box is a surface. Geometry follows DOM ancestry.                                                                                                                         |
| Consumer overrides                      | A class, a later layer, and `style` each override the corners.                                                                                                                                                                                     |
| Server rendering                        | The server markup hydrates with no recoverable error and no markup difference.                                                                                                                                                                     |

### Stylesheet cost

Both builds contain the same utilities, so the difference is the feature
([`results/measurements.md`](prototype/results/measurements.md)). Production's stylesheet is 251,577
B and 17,209 B gzipped at `7efdd38a`. The decided design adds 9,139 B, or 1,002 B gzipped. That is
3.6% of the stylesheet and 5.8% of its gzipped size. Most of it is the mirrors, which add one
declaration to each of about 50 property rules per breakpoint.

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
| Reference app, security settings   | 45       | 2          | 0.33         | 0.42   | 0.55    | 0.15                | 0.24   | 0.36    |
| Reference app, profile             | 78       | 8          | 0.52         | 0.68   | 0.93    | 0.25                | 0.40   | 0.68    |
| Reference app, preferences         | 88       | 7          | 0.58         | 0.75   | 0.97    | 0.26                | 0.43   | 0.70    |
| Reference app, profile with dialog | 105      | 11         | 0.67         | 0.87   | 1.19    | 0.30                | 0.51   | 0.86    |
| Docs home                          | 102      | 17         | 0.60         | 0.82   | 1.19    | 0.28                | 0.56   | 0.82    |
| Docs Button page                   | 2,494    | 168        | 11.4         | 14.2   | 20.0    | 5.2                 | 9.4    | 16.7    |
| Stress: 2,000 cards, 4 levels each | 8,001    | 6,000      | 71           | 94     | 200     | 35                  | 60     | 168     |

| Docs Button page | Mount: today | unused | adopted | Theme switch: today | unused | adopted |
| ---------------- | ------------ | ------ | ------- | ------------------- | ------ | ------- |
| Chromium         | 5.0          | 7.3    | 7.7     | 0.95                | 1.68   | 1.91    |
| Firefox          | 9.8          | 10.2   | 11.1    | 0.93                | 1.10   | 3.51    |
| WebKit           | 11.4         | 14.2   | 20.0    | 5.2                 | 9.4    | 16.7    |

- **Application pages.** On the reference app's pages the decided design adds 0.2 to 0.6 ms to a
  mount and 0.2 to 0.6 ms to a full restyle in WebKit, at the upper bound of use.
- **A large page.** The Button docs page is the largest real page captured. In WebKit a theme switch
  goes from 5.2 to 16.7 ms with 168 concentric Boxes, and a mount from 11.4 to 20.0 ms.
- **Deciding in the value costs more when the feature is used.** A Box between a surface and a
  concentric Box now evaluates the combined expression. On the Button docs page a WebKit theme
  switch with the feature adopted is 16.7 ms here and was 12.2 ms with radius-only surfaces.
- **Unused cost is not zero.** A page that never uses the feature pays for the mirrors and for
  matching the new selectors. On the Button docs page a Chromium mount goes from 5.0 to 7.3 ms, and
  a WebKit theme switch from 5.2 to 9.4 ms.
- **Noise.** WebKit's mount times move by up to 30% between runs. Theme-switch times repeat more
  closely. Two Firefox cells in the ungated columns are ten times their neighbours and are outliers.

### The `:has()` gate on real pages

| WebKit, Docs Button page | Gated | Ungated |
| ------------------------ | ----- | ------- |
| Mount, unused            | 14.2  | 18.7    |
| Mount, adopted           | 20.0  | 21.4    |
| Theme switch, unused     | 9.4   | 14.2    |
| Theme switch, adopted    | 16.7  | 17.0    |

- The gate saves WebKit 24% on mount and 34% on a theme switch for a real page that does not use the
  feature. On the stress tree it saves about 47% and 57%.
- The gate costs Chromium about 1% on mount on the same page.
- `:has()` did not make DOM changes slower in any engine. Adding and removing a rounded subtree, and
  an unrelated state change on one element, each move by less than 0.02 ms on every real page.
- Production already uses `:has()` in 56 places.

The gate stays. Most of WebKit's cost when the feature is in use comes from the concentric Boxes and
the Boxes between them, which the gate does not remove.

## Supported geometry

A concentric Box is exact when all of these hold:

- It is a DOM descendant of a Box that sets a radius, or draws a border, through props.
- Its border edge is flush with the padding edge of the Box around it. Any padding between it and
  the surface comes from Box props.
- The surface's four corners share one radius, or the surface is itself concentric.

Within that, any nesting depth, any mix of logical side padding, padded wrappers, responsive values,
a radius or border that starts at a breakpoint, RTL, theme changes, and server rendering is exact.

## Unsupported geometry

CSS cannot detect these. Each has a defined result, and the prototype asserts it.

| Layout                                                               | Result                                                                                   | What to do                               |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------- |
| Padding or border from `style`, `className`, or a plain element      | Radius too large by the unseen inset                                                     | Set the padding through Box props.       |
| A radius from `style` or `className` on a Box with no radius prop    | The Box is spacing, not a surface                                                        | Set the radius through Box props.        |
| The child has a margin, or is not flush for another reason           | Radius too large by the gap                                                              | Pass an explicit radius.                 |
| No Box ancestor with a radius, including a portal out of the surface | Square corners                                                                           | Pass an explicit radius.                 |
| `concentric` inside a responsive object                              | Rejected by the type                                                                     | Make the parent's values responsive.     |
| A surface whose corners differ from each other                       | Cannot be published. The contract is one radius per side.                                | Pass an explicit radius.                 |
| A border drawn with `box-shadow` or `outline`                        | Not counted                                                                              | Use `borderWidth`.                       |
| A browser without container style queries                            | Exact one level inside a surface. Deeper levels and wrappers are too round by one inset. | Nothing. It is a visual difference only. |

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

| Approach                                                | Why not                                                                                                                                                   |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React context alternation with inline properties (#876) | Up to 54 inline properties on a Box, a context read in every Box, JavaScript padding resolution, and a React tree that can disagree with DOM inheritance. |
| Selector levels (the first round)                       | A depth limit, and no room for padded wrappers. See above.                                                                                                |
| Radius-only surfaces                                    | A bordered Box with no radius would hold a rounded child inside a square frame. Rejected by the maintainer.                                               |
| CSS `inherit()`                                         | It would remove the two sets and the style query. No engine ships it. Chrome has an intent to prototype.                                                  |
| Publish from every Box, with no `:has()` gate           | Slightly faster in Chromium. Slower in WebKit for every page.                                                                                             |
| Publish eight values, one per corner and axis           | Supports surfaces with different corners. Box cannot author those, and it cost WebKit about a third more in the first round.                              |
| A `concentric` prop on the parent                       | Removes the gate and the publish cost for other Boxes. It adds the parent prop the issue wants to avoid, and a missing prop fails silently.               |
| A dedicated Surface component                           | Geometry already lives in Box's utilities. A second component would duplicate padding and radius props.                                                   |
| Public helpers only                                     | `deriveNestedRadius` already states the formula. It leaves the padding bookkeeping to the consumer, which is what the issue rules out.                    |

No CSS-native feature exists. The CSS Working Group tracks the idea in
[csswg-drafts#7707](https://github.com/w3c/csswg-drafts/issues/7707).

## Decisions

Settled with the maintainer on 12 November 2026:

| Decision                    | Outcome                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Public API                  | `borderRadius="concentric"` on Box, as a direct value only. No parent prop.                                                       |
| Unequal insets              | Elliptical corners.                                                                                                               |
| Nesting and padded wrappers | Container style queries. No depth limit, and padding with no radius passes corners on. Older browsers degrade as described above. |
| What starts a surface       | A radius, or a drawn border. A Box with a drawn border and no radius is a square surface.                                         |
| Breakpoints                 | Decided per width from the values that win the cascade. No added specificity.                                                     |
| The `:has()` gate           | Kept.                                                                                                                             |
| First production scope      | Box and the layout components that spread its utilities. No first-party recipe publishes geometry yet.                            |

On the last row: the package has no Dialog, Popover, Menu, or Card. Only the mobile tray and the
Combobox and Select popover hold content, and they hold first-party items. No recipe computes a
nested radius today. Three rounded containers clip their children with `overflow: hidden` instead.

The radius scale and its names remain open under #874.

## Production changes

- `@luke-ui/rainbow-sprinkles`: add mirrors to `defineProperties`, and emit keyword classes with
  conditions as the outer loop.
- `utilities.css.ts`: add the mirrors, the base rules, the two style-query blocks, and seven
  registered properties. Raise the stylesheet size budget by the measured amount. `borderStyle`
  moves from six dynamic classes to 24 keyword classes, so a rule can record whether a border is
  drawn.
- Box's `borderRadius` type gains `'concentric'` outside the responsive union.
- Browser tests cover the supported and unsupported cases with their own assertions. The harness,
  benchmarks, captured trees, and scripts stay here. The docs publish the two geometry sections
  above and the browser floor.
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

`CONCENTRIC_STYLE_QUERY=0`, `CONCENTRIC_HAS=0`, and `CONCENTRIC_REGISTER_INPUTS=0` change the build.
`measure.mjs` builds the combinations in the tables above.
[`trees/capture.mjs`](prototype/trees/capture.mjs) recaptures the pages.
