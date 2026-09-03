/**
 * Renders every contract leaf as a labelled sample, grouped by the contract's own tree shape,
 * including the top-level family it belongs to (`color`, `depth`, `font`, and so on). Driven
 * entirely by `flattenThemeContract()`: add, rename, or remove a leaf in `contract.ts` and this
 * board follows automatically, so token coverage cannot silently drift out of sync with the
 * contract (theme-v2 #249, generalised past colour in #257). Read-only and diagnostic — it
 * introduces no new public API and computes no value itself, it only reads the resolved `--luke-*`
 * custom properties that the active theme and colour mode already supply.
 */

import type { CSSProperties, ReactNode } from 'react';
import { createElement, useLayoutEffect, useRef, useState } from 'react';
import type { themeContractTree } from './contract.js';
import { flattenThemeContract, themeVarName } from './contract.js';
import { vars } from './tokens.stylex.js';

interface TokenLeafNode {
	kind: 'leaf';
	path: string;
	varName: string;
}

export interface TokenGroupNode {
	children: Record<string, TokenTreeNode>;
	kind: 'group';
}

export type TokenTreeNode = TokenLeafNode | TokenGroupNode;

const CAMEL_BOUNDARY_SPACE_PATTERN = /([a-z0-9])([A-Z])/g;

/** One of the contract's own top-level branches, for example `color` or `motion`. */
type Family = keyof typeof themeContractTree;

// Capped at the contract's deepest group (`color.background.<role>.subtle`, 4 group levels above the
// leaf); depths past this reuse the smallest heading.
const HEADING_TAGS = ['h2', 'h3', 'h4', 'h5'] as const;

function headingTagAt(depth: number): (typeof HEADING_TAGS)[number] {
	const index = Math.min(Math.max(depth - 1, 0), HEADING_TAGS.length - 1);
	return HEADING_TAGS[index] ?? 'h5';
}

/** `actionControlFinish` reads as one word; splits it (and others like it) into heading-sized words. */
function humanizeSegment(segment: string): string {
	return segment.replace(CAMEL_BOUNDARY_SPACE_PATTERN, '$1 $2');
}

const boardStyle = {
	display: 'grid',
	gap: vars.space.sp32,
} as const satisfies CSSProperties;

const groupSectionStyle = {
	display: 'grid',
	gap: vars.space.sp12,
} as const satisfies CSSProperties;

const headingStyle = {
	margin: 0,
	textTransform: 'capitalize',
} as const satisfies CSSProperties;

const swatchGridStyle = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space.sp12,
} as const satisfies CSSProperties;

const swatchCardStyle = {
	display: 'grid',
	gap: vars.space.sp4,
	inlineSize: '9rem',
	justifyItems: 'start',
} as const satisfies CSSProperties;

const swatchBoxStyle = {
	blockSize: '2.5rem',
	borderColor: vars.color.border.decorative,
	borderRadius: vars.radius.detail,
	borderStyle: 'solid',
	borderWidth: 1,
	inlineSize: '100%',
} as const satisfies CSSProperties;

const previewFrameStyle = {
	alignItems: 'center',
	blockSize: '2.5rem',
	display: 'flex',
	inlineSize: '100%',
	justifyContent: 'flex-start',
	overflow: 'hidden',
} as const satisfies CSSProperties;

const swatchLabelStyle = {
	fontSize: vars.font.caption.fontSize,
	fontWeight: vars.font.weight.label,
	overflowWrap: 'anywhere',
} as const satisfies CSSProperties;

const swatchVarStyle = {
	color: vars.color.text.secondary,
	fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
	fontSize: vars.font.caption.fontSize,
	overflowWrap: 'anywhere',
} as const satisfies CSSProperties;

const motionKeyframesStyle = `@keyframes luke-token-board-motion { from { transform: translateX(0); } to { transform: translateX(2.5rem); } } @media (prefers-reduced-motion: reduce) { [data-token-board-motion] { animation: none !important; } }`;

// Fixed counterparts for whichever motion axis a given leaf is not itself demonstrating, so a
// duration sample still has a easing curve to move along and vice versa.
const fallbackMotionDuration = '0.6s';
const fallbackMotionEasing = 'ease-in-out';

/**
 * A semantic-token board covering every contract leaf for the active theme and colour mode, so a
 * generator or mapping change (`scale.ts`, `elevation.ts`, `semantic-map.ts`, `build-theme.ts`)
 * produces an obvious visual diff even where no component happens to consume the changed leaf.
 */
export function TokenBoard() {
	const tree = buildTokenTree();
	return (
		<div style={boardStyle}>
			<style>{motionKeyframesStyle}</style>
			{Object.entries(tree.children).map(([key, node]) => {
				return <TokenNodeView depth={1} key={key} name={key} node={node} />;
			})}
		</div>
	);
}

function TokenNodeView({
	depth,
	name,
	node,
}: {
	depth: number;
	name: string;
	node: TokenTreeNode;
}) {
	// A heading tag chosen by tree depth is rendered with `createElement` rather than a capitalised
	// JSX tag: assigning the dynamic tag to a variable and rendering it as `<Heading>` reads as a
	// component declared during render (react/static-components), which this is not — it is
	// a plain host element whose tag name varies.
	const heading = createElement(
		headingTagAt(depth),
		{ style: headingStyle },
		humanizeSegment(name),
	);

	if (node.kind === 'leaf') {
		return (
			<section style={groupSectionStyle}>
				{heading}
				<div style={swatchGridStyle}>
					<TokenSwatch label={node.path} path={node.path} varName={node.varName} />
				</div>
			</section>
		);
	}

	const entries = Object.entries(node.children);
	const leafEntries = entries.filter(
		(entry): entry is [string, TokenLeafNode] => entry[1].kind === 'leaf',
	);
	const groupEntries = entries.filter(
		(entry): entry is [string, TokenGroupNode] => entry[1].kind === 'group',
	);

	return (
		<section style={groupSectionStyle}>
			{heading}
			{leafEntries.length > 0 ? (
				<div style={swatchGridStyle}>
					{leafEntries.map(([key, leaf]) => (
						<TokenSwatch key={leaf.path} label={key} path={leaf.path} varName={leaf.varName} />
					))}
				</div>
			) : null}
			{groupEntries.map(([key, child]) => (
				<TokenNodeView depth={depth + 1} key={key} name={key} node={child} />
			))}
		</section>
	);
}

function TokenSwatch({ label, path, varName }: { label: string; path: string; varName: string }) {
	return (
		<div style={swatchCardStyle}>
			<TokenPreview path={path} varName={varName} />
			<code style={swatchLabelStyle}>{label}</code>
			<ResolvedValue varName={varName} />
			<code style={swatchVarStyle}>{varName}</code>
		</div>
	);
}

/**
 * Reads the live resolved value of `varName` off the swatch's own theme root, rather than the
 * design-time value a `vars.*` reference would print, so it tracks a colour-mode toggle without a
 * remount. Re-reads on any class or `data-color-mode` change to the nearest `[data-color-mode]`
 * ancestor.
 */
function ResolvedValue({ varName }: { varName: string }) {
	const ref = useRef<HTMLElement>(null);
	const [resolvedValue, setResolvedValue] = useState('');

	useLayoutEffect(() => {
		const element = ref.current;
		if (!element) return;
		const updateValue = () => {
			const nextValue = getComputedStyle(element).getPropertyValue(varName).trim();
			setResolvedValue((currentValue) => (currentValue === nextValue ? currentValue : nextValue));
		};
		const themeRoot = element.closest('[data-color-mode]');
		const observer = new MutationObserver(updateValue);

		updateValue();
		if (themeRoot) {
			observer.observe(themeRoot, {
				attributeFilter: ['class', 'data-color-mode'],
				attributes: true,
			});
		}

		return () => observer.disconnect();
	}, [varName]);

	return (
		<code ref={ref} style={swatchVarStyle}>
			{resolvedValue || 'Resolving…'}
		</code>
	);
}

interface LeafPreviewProps {
	path: string;
	segments: ReadonlyArray<string>;
	varName: string;
}

type PreviewRenderer = (props: LeafPreviewProps) => ReactNode;

function ColorPreview({ path, varName }: LeafPreviewProps) {
	if (path === 'color.overlay.backdrop') {
		return (
			<span
				aria-label={`${path} sample`}
				role="img"
				style={{
					...swatchBoxStyle,
					backgroundColor: vars.color.surface.canvas,
					backgroundImage: `linear-gradient(var(${varName}), var(${varName}))`,
				}}
			/>
		);
	}

	return (
		<span
			aria-label={`${path} sample`}
			role="img"
			style={{ ...swatchBoxStyle, backgroundColor: `var(${varName})` }}
		/>
	);
}

function DepthPreview({ path, varName }: LeafPreviewProps) {
	return (
		<span
			aria-label={`${path} sample`}
			role="img"
			style={{
				...swatchBoxStyle,
				backgroundColor: vars.color.surface.recessed,
				boxShadow: `var(${varName})`,
			}}
		/>
	);
}

function FinishPreview({ path, varName }: LeafPreviewProps) {
	return (
		<span
			aria-label={`${path} sample`}
			role="img"
			style={{
				...swatchBoxStyle,
				backgroundColor: vars.color.background.neutral.solid.rest,
				backgroundImage: `var(${varName})`,
			}}
		/>
	);
}

function RadiusPreview({ path, varName }: LeafPreviewProps) {
	return (
		<span
			aria-label={`${path} sample`}
			role="img"
			style={{
				...swatchBoxStyle,
				backgroundColor: vars.color.surface.recessed,
				borderRadius: `var(${varName})`,
			}}
		/>
	);
}

function SpacePreview({ path, varName }: LeafPreviewProps) {
	return (
		<span style={previewFrameStyle}>
			<span
				aria-label={`${path} sample`}
				role="img"
				style={{
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: vars.space.sp12,
					display: 'inline-block',
					inlineSize: `var(${varName})`,
				}}
			/>
		</span>
	);
}

/** Shared by `controlSize` and `iconSize`: both are box dimensions, sized directly from the token. */
function SizePreview({ path, varName }: LeafPreviewProps) {
	return (
		<span style={previewFrameStyle}>
			<span
				aria-label={`${path} sample`}
				role="img"
				style={{
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: `var(${varName})`,
					borderRadius: vars.radius.detail,
					display: 'inline-block',
					inlineSize: `var(${varName})`,
				}}
			/>
		</span>
	);
}

/**
 * `interaction` tokens are scalar effects applied on top of a control's resting material
 * (`disabledOpacity` is the only leaf today). A plain colour swatch cannot show a fade, so this
 * pairs a full-strength accent square with the same square held at the token's own opacity — the
 * reference is decorative (`aria-hidden`, no `role`), keeping the emphasised sample the single
 * `role="img"` each leaf is expected to render.
 */
function InteractionPreview({ path, varName }: LeafPreviewProps) {
	const swatch = {
		backgroundColor: vars.color.background.accent.solid.rest,
		blockSize: vars.iconSize.medium,
		borderRadius: vars.radius.detail,
		display: 'inline-block',
		inlineSize: vars.iconSize.medium,
	} as const satisfies CSSProperties;

	return (
		<span style={{ ...previewFrameStyle, gap: vars.space.sp12 }}>
			<span aria-hidden={true} style={swatch} />
			<span
				aria-label={`${path} sample`}
				role="img"
				style={{ ...swatch, opacity: `var(${varName})` }}
			/>
		</span>
	);
}

function MotionPreview({ path, segments, varName }: LeafPreviewProps) {
	// `motion.duration.feedback` and `motion.easing.standard` each drive one animation axis; the
	// other axis takes a fixed, non-token value purely so the dot has something to animate along.
	const axis = segments[1];
	const duration = axis === 'duration' ? `var(${varName})` : fallbackMotionDuration;
	const easing = axis === 'easing' ? `var(${varName})` : fallbackMotionEasing;

	return (
		<span style={{ ...previewFrameStyle, justifyContent: 'center', paddingInline: vars.space.sp4 }}>
			<span
				aria-label={`${path} sample`}
				data-token-board-motion
				role="img"
				style={{
					animationDirection: 'alternate',
					animationDuration: duration,
					animationIterationCount: 'infinite',
					animationName: 'luke-token-board-motion',
					animationTimingFunction: easing,
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: vars.iconSize.xsmall,
					borderRadius: vars.radius.full,
					display: 'inline-block',
					inlineSize: vars.iconSize.xsmall,
				}}
			/>
		</span>
	);
}

function TextSample({
	children = 'Aa',
	label,
	style,
	wrap = false,
}: {
	children?: ReactNode;
	label: string;
	style: CSSProperties;
	wrap?: boolean;
}) {
	return (
		<span style={previewFrameStyle}>
			<span
				aria-label={label}
				role="img"
				style={{
					display: 'block',
					overflow: 'hidden',
					whiteSpace: wrap ? 'normal' : 'nowrap',
					...style,
				}}
			>
				{children}
			</span>
		</span>
	);
}

/**
 * `baselineTrim` and `capHeightTrim` are capsize margin offsets applied to a `::before`/`::after`
 * pair in `text/recipe.ts`; a plain swatch cannot show a margin, so this applies the trim
 * directly to a bar's block-start or block-end margin instead.
 */
function TrimSample({
	label,
	marginProperty,
	varName,
}: {
	label: string;
	marginProperty: 'marginBlockEnd' | 'marginBlockStart';
	varName: string;
}) {
	return (
		<span
			style={{
				...previewFrameStyle,
				borderColor: vars.color.border.decorative,
				borderStyle: 'solid',
				borderWidth: 1,
			}}
		>
			<span
				aria-label={label}
				role="img"
				style={{
					backgroundColor: vars.color.background.accent.solid.rest,
					blockSize: vars.space.sp12,
					display: 'inline-block',
					inlineSize: vars.space.sp24,
					[marginProperty]: `var(${varName})`,
				}}
			/>
		</span>
	);
}

function FontPreview({ path, segments, varName }: LeafPreviewProps) {
	const [, second, third] = segments;
	const label = `${path} sample`;

	if (second === 'family')
		return <TextSample label={label} style={{ fontFamily: `var(${varName})` }} />;
	if (second === 'weight')
		return <TextSample label={label} style={{ fontWeight: `var(${varName})` }} />;

	// `second` is a type-style key here (`typeStyles` in contract.ts); every style carries the
	// same leaf set (see `typeStyle` in contract.ts), so the style's own fontSize var sizes
	// every other sub-property's sample legibly. `themeVarName` (from contract.ts) builds that sibling
	// reference the same way the contract builds every variable name, rather than re-deriving it here.
	const fontSizeVarName = themeVarName(['font', second ?? '', 'fontSize']);

	if (third === 'fontSize')
		return <TextSample label={label} style={{ fontSize: `var(${varName})` }} />;
	if (third === 'fontFamily')
		return <TextSample label={label} style={{ fontFamily: `var(${varName})` }} />;
	if (third === 'fontWeight')
		return <TextSample label={label} style={{ fontWeight: `var(${varName})` }} />;
	if (third === 'lineHeight') {
		return (
			<TextSample
				label={label}
				style={{ fontSize: `var(${fontSizeVarName})`, lineHeight: `var(${varName})` }}
				wrap
			>
				Aa Aa
			</TextSample>
		);
	}
	if (third === 'letterSpacing') {
		return (
			<TextSample
				label={label}
				style={{ fontSize: `var(${fontSizeVarName})`, letterSpacing: `var(${varName})` }}
			/>
		);
	}

	const marginProperty = third === 'baselineTrim' ? 'marginBlockStart' : 'marginBlockEnd';
	return <TrimSample label={label} marginProperty={marginProperty} varName={varName} />;
}

/**
 * Previews a plain colour swatch cannot express — motion, spacing, radius, depth, and control-finish
 * tokens each need a family-specific visual — keyed by the contract's own top-level family names.
 * Typed as `Record<Family, …>` rather than `Partial`, so a ninth top-level family added to
 * `contract.ts` is a type error here until this board grows a renderer for it too.
 */
const familyPreviews: Record<Family, PreviewRenderer> = {
	actionControlFinish: FinishPreview,
	color: ColorPreview,
	controlSize: SizePreview,
	depth: DepthPreview,
	font: FontPreview,
	iconSize: SizePreview,
	interaction: InteractionPreview,
	motion: MotionPreview,
	radius: RadiusPreview,
	space: SpacePreview,
};

function TokenPreview({ path, varName }: { path: string; varName: string }) {
	const segments = path.split('.');
	// `path` comes from `flattenThemeContract()`, so its first segment is always a contract family.
	const family = segments[0] as Family;
	const Preview = familyPreviews[family];
	return <Preview path={path} segments={segments} varName={varName} />;
}

/**
 * Builds the whole token tree from `flattenThemeContract()`'s flat `[path, varName]` pairs, grouped
 * by path segment so the board's structure mirrors `contract.ts`'s own nesting exactly, including its
 * top-level families. Exported for `token-board.test.ts`, which unit-tests the grouping logic
 * directly.
 */
export function buildTokenTree(): TokenGroupNode {
	const root: TokenGroupNode = { children: {}, kind: 'group' };
	for (const [path, varName] of flattenThemeContract()) {
		const segments = path.split('.');
		let cursor = root;
		for (const [index, segment] of segments.entries()) {
			if (index === segments.length - 1) {
				cursor.children[segment] = { kind: 'leaf', path, varName };
				continue;
			}
			const existing = cursor.children[segment];
			if (existing?.kind === 'group') {
				cursor = existing;
				continue;
			}
			const next: TokenGroupNode = { children: {}, kind: 'group' };
			cursor.children[segment] = next;
			cursor = next;
		}
	}
	return root;
}
