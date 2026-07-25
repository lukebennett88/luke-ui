/**
 * Renders every `color.*` semantic contract leaf as a labelled swatch, grouped by the contract's
 * own tree shape. Driven entirely by `flattenThemeContract()`: add, rename, or remove a colour leaf
 * in `contract.ts` and this board follows automatically, so token coverage cannot silently drift out
 * of sync with the contract (theme-v2 #249). Read-only and diagnostic — it introduces no new public
 * API and computes no colour itself, it only reads the resolved `--luke-*` custom properties that
 * the active theme and colour mode already supply.
 */

import type { CSSProperties } from 'react';
import { createElement } from 'react';
import { vars } from './contract.css.js';
import { flattenThemeContract } from './contract.js';

interface ColorLeafNode {
	kind: 'leaf';
	path: string;
	varName: string;
}

export interface ColorGroupNode {
	kind: 'group';
	children: Record<string, ColorTreeNode>;
}

export type ColorTreeNode = ColorLeafNode | ColorGroupNode;

// Capped at the contract's deepest colour group (color.intent.<role>.surface.<state>); depths past
// this reuse the smallest heading.
const HEADING_TAGS = ['h2', 'h3', 'h4', 'h5'] as const;

function headingTagAt(depth: number): (typeof HEADING_TAGS)[number] {
	const index = Math.min(Math.max(depth - 1, 0), HEADING_TAGS.length - 1);
	return HEADING_TAGS[index] ?? 'h5';
}

const boardStyle = {
	display: 'grid',
	gap: vars.space[800],
} as const satisfies CSSProperties;

const groupSectionStyle = {
	display: 'grid',
	gap: vars.space[300],
} as const satisfies CSSProperties;

const headingStyle = {
	margin: 0,
	textTransform: 'capitalize',
} as const satisfies CSSProperties;

const swatchGridStyle = {
	display: 'flex',
	flexWrap: 'wrap',
	gap: vars.space[300],
} as const satisfies CSSProperties;

const swatchCardStyle = {
	display: 'grid',
	gap: vars.space[100],
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

const swatchLabelStyle = {
	fontSize: vars.font[100].fontSize,
	fontWeight: vars.font.weight.label,
	overflowWrap: 'anywhere',
} as const satisfies CSSProperties;

const swatchVarStyle = {
	color: vars.color.text.secondary,
	fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
	fontSize: vars.font[100].fontSize,
	overflowWrap: 'anywhere',
} as const satisfies CSSProperties;

/**
 * A semantic-token / scale board covering every `color.*` contract leaf for the active theme and
 * colour mode, so a generator or mapping change (`scale.ts`, `elevation.ts`, `semantic-map.ts`)
 * produces an obvious visual diff even where no component happens to consume the changed leaf.
 */
export function ColorTokenBoard() {
	const tree = buildColorTree();
	return (
		<div style={boardStyle}>
			{Object.entries(tree.children).map(([key, node]) => (
				<ColorNodeView depth={1} key={key} name={key} node={node} />
			))}
		</div>
	);
}

function ColorNodeView({
	depth,
	name,
	node,
}: {
	depth: number;
	name: string;
	node: ColorTreeNode;
}) {
	// A heading tag chosen by tree depth is rendered with `createElement` rather than a capitalised
	// JSX tag: assigning the dynamic tag to a variable and rendering it as `<Heading>` reads as a
	// component declared during render (react-hooks-js/static-components), which this is not — it is
	// a plain host element whose tag name varies.
	const heading = createElement(headingTagAt(depth), { style: headingStyle }, name);

	if (node.kind === 'leaf') {
		return (
			<section style={groupSectionStyle}>
				{heading}
				<div style={swatchGridStyle}>
					<ColorSwatch label={node.path} path={node.path} varName={node.varName} />
				</div>
			</section>
		);
	}

	const entries = Object.entries(node.children);
	const leafEntries = entries.filter(
		(entry): entry is [string, ColorLeafNode] => entry[1].kind === 'leaf',
	);
	const groupEntries = entries.filter(
		(entry): entry is [string, ColorGroupNode] => entry[1].kind === 'group',
	);

	return (
		<section style={groupSectionStyle}>
			{heading}
			{leafEntries.length > 0 ? (
				<div style={swatchGridStyle}>
					{leafEntries.map(([key, leaf]) => (
						<ColorSwatch key={leaf.path} label={key} path={leaf.path} varName={leaf.varName} />
					))}
				</div>
			) : null}
			{groupEntries.map(([key, child]) => (
				<ColorNodeView depth={depth + 1} key={key} name={key} node={child} />
			))}
		</section>
	);
}

function ColorSwatch({ label, path, varName }: { label: string; path: string; varName: string }) {
	return (
		<div style={swatchCardStyle}>
			<span
				aria-label={`${path} colour sample`}
				role="img"
				style={{ ...swatchBoxStyle, backgroundColor: `var(${varName})` }}
			/>
			<code style={swatchLabelStyle}>{label}</code>
			<code style={swatchVarStyle}>{varName}</code>
		</div>
	);
}

/**
 * Builds the colour subtree from `flattenThemeContract()`'s flat `[path, varName]` pairs, grouped by
 * path segment so the board's structure mirrors `contract.ts`'s own nesting exactly. Exported for
 * `color-token-board.test.ts`, which unit-tests the grouping logic directly.
 */
export function buildColorTree(): ColorGroupNode {
	const root: ColorGroupNode = { children: {}, kind: 'group' };
	for (const [path, varName] of flattenThemeContract()) {
		if (!path.startsWith('color.')) continue;
		const segments = path.split('.').slice(1);
		let cursor = root;
		segments.forEach((segment, index) => {
			if (index === segments.length - 1) {
				cursor.children[segment] = { kind: 'leaf', path, varName };
				return;
			}
			const existing = cursor.children[segment];
			if (existing?.kind === 'group') {
				cursor = existing;
				return;
			}
			const next: ColorGroupNode = { children: {}, kind: 'group' };
			cursor.children[segment] = next;
			cursor = next;
		});
	}
	return root;
}
