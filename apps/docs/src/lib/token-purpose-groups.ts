import type { ThemeToken, ThemeTokenFamily } from '../generated/token-reference.generated.js';
import { themeTokens } from '../generated/token-reference.generated.js';

/** The docs page a group's tokens are explained on, linked instead of restated in the explorer. */
interface TokenPurposeLink {
	label: string;
	splat: string;
}

export interface TokenPurposeGroup {
	description: string;
	id: string;
	related: TokenPurposeLink | null;
	showSamples: boolean;
	title: string;
	tokens: ReadonlyArray<ThemeToken>;
}

/**
 * The purposes a reader shops by, in reading order. Presentation only: the tokens in each group come
 * from the generated contract data, so a group can describe the contract but never extend it.
 */
const PURPOSE_DEFINITIONS = [
	{
		description:
			'Background layers, from the page canvas to the translucent backdrop behind a dialog.',
		id: 'surfaces',
		related: { label: 'Colour', splat: 'color' },
		showSamples: true,
		title: 'Surfaces',
	},
	{
		description:
			'Text colours, and the placeholder colour that stands in for content while it loads.',
		id: 'content',
		related: { label: 'Colour', splat: 'color' },
		showSamples: true,
		title: 'Content',
	},
	{
		description: 'Border colours for decoration, control outlines, and the focus ring.',
		id: 'borders',
		related: { label: 'Colour', splat: 'color' },
		showSamples: true,
		title: 'Borders',
	},
	{
		description:
			'The six semantic roles. Every role carries the same backgrounds, foregrounds, and border.',
		id: 'roles',
		related: { label: 'Colour', splat: 'color' },
		showSamples: true,
		title: 'Roles',
	},
	{
		description: 'Type styles, font families, and weight roles.',
		id: 'typography',
		related: { label: 'Typography', splat: 'typography' },
		showSamples: false,
		title: 'Typography',
	},
	{
		description: 'The spacing scale for gaps, padding, and margin.',
		id: 'spacing',
		related: null,
		showSamples: true,
		title: 'Spacing',
	},
	{
		description: 'Corner radii, from small details to full rounding.',
		id: 'radius',
		related: null,
		showSamples: true,
		title: 'Radius',
	},
	{
		description: 'The shadow ladder, and the face finish that pairs with it on action controls.',
		id: 'depth',
		related: null,
		showSamples: false,
		title: 'Depth',
	},
	{
		description: 'Block sizes for controls and icons.',
		id: 'sizing',
		related: null,
		showSamples: true,
		title: 'Sizing',
	},
	{
		description: 'State effects a control applies to its own material, such as disabled opacity.',
		id: 'interaction',
		related: null,
		showSamples: true,
		title: 'Interaction',
	},
	{
		description: 'Durations and easing curves for interaction.',
		id: 'motion',
		related: null,
		showSamples: true,
		title: 'Motion',
	},
] as const satisfies ReadonlyArray<Omit<TokenPurposeGroup, 'tokens'>>;

type TokenPurposeId = (typeof PURPOSE_DEFINITIONS)[number]['id'];

/**
 * The purpose each contract family belongs to. Typed as a total record, so a new top-level family in
 * the theme contract is a type error here until the explorer knows where to show it. `color` is
 * `null` because its tokens split across four purposes; `resolveColorPurpose` handles those.
 */
const FAMILY_PURPOSES = {
	actionControlFinish: 'depth',
	color: null,
	controlSize: 'sizing',
	depth: 'depth',
	font: 'typography',
	iconSize: 'sizing',
	interaction: 'interaction',
	motion: 'motion',
	radius: 'radius',
	space: 'spacing',
} as const satisfies Record<ThemeTokenFamily, TokenPurposeId | null>;

const COLOR_SECTION_PURPOSES: Record<string, TokenPurposeId | undefined> = {
	background: 'roles',
	foreground: 'roles',
	loadingSkeleton: 'content',
	surface: 'surfaces',
	text: 'content',
};

const STRUCTURAL_BORDERS = new Set(['control', 'decorative', 'focus']);

function resolveColorPurpose(path: string): TokenPurposeId | undefined {
	const [, section, leaf] = path.split('.');
	if (section === undefined) return undefined;
	if (section === 'border') {
		return leaf !== undefined && STRUCTURAL_BORDERS.has(leaf) ? 'borders' : 'roles';
	}
	if (section === 'overlay') return 'surfaces';
	return COLOR_SECTION_PURPOSES[section];
}

function resolvePurpose(token: ThemeToken): TokenPurposeId | undefined {
	const familyPurpose = FAMILY_PURPOSES[token.family];
	return familyPurpose ?? resolveColorPurpose(token.path);
}

/**
 * Sorts every generated token into its purpose group. Throws rather than dropping a token, because a
 * reference that quietly omits part of the contract is worse than one that fails to build.
 */
export function buildTokenPurposeGroups(): ReadonlyArray<TokenPurposeGroup> {
	const byPurpose = new Map<TokenPurposeId, Array<ThemeToken>>(
		PURPOSE_DEFINITIONS.map((definition) => [definition.id, []]),
	);
	const unsorted: Array<string> = [];

	for (const token of themeTokens) {
		const purpose = resolvePurpose(token);
		const bucket = purpose === undefined ? undefined : byPurpose.get(purpose);
		if (bucket === undefined) {
			unsorted.push(token.path);
			continue;
		}
		bucket.push(token);
	}

	if (unsorted.length > 0) {
		throw new Error(`No token purpose group covers: ${unsorted.join(', ')}`);
	}

	return PURPOSE_DEFINITIONS.map((definition) => ({
		...definition,
		tokens: byPurpose.get(definition.id) ?? [],
	}));
}

export const tokenPurposeGroups = buildTokenPurposeGroups();
