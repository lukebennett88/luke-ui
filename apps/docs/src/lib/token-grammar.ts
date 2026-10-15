import type { ThemeToken } from '../generated/token-reference.generated.js';
import { themeTokens } from '../generated/token-reference.generated.js';

/*
 * The token contract as a grammar: which names exist and how their segments combine. The token
 * reference page renders these sections instead of one flat list. Everything here derives from the
 * generated contract data, and building the sections throws when a token is unclassified or
 * classified twice, so the page cannot quietly drift from the contract.
 *
 * Client-safe: no Node built-ins.
 */

export const ROLES = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'] as const;
export type Role = (typeof ROLES)[number];

const ROLE_BACKGROUND_PATHS = [
	'subtle.rest',
	'subtle.hover',
	'subtle.pressed',
	'solid.rest',
	'solid.hover',
	'solid.pressed',
] as const;
const ROLE_FOREGROUND_PATHS = ['rest', 'hover', 'pressed', 'onSolid'] as const;

interface RoleColorRow {
	role: Role;
	tokens: ReadonlyArray<ThemeToken>;
}

function roleColorPaths(role: Role): ReadonlyArray<string> {
	return [
		...ROLE_BACKGROUND_PATHS.map((suffix) => `color.background.${role}.${suffix}`),
		...ROLE_FOREGROUND_PATHS.map((suffix) => `color.foreground.${role}.${suffix}`),
		`color.border.${role}`,
	];
}

const ROLE_PATHS = new Set(ROLES.flatMap(roleColorPaths));

type NeutralColorGroupId = 'surfaces' | 'text' | 'borders' | 'other';

interface NeutralColorGroup {
	id: NeutralColorGroupId;
	title: string;
	tokens: ReadonlyArray<ThemeToken>;
}

const TYPE_STYLES = [
	'caption',
	'label',
	'body',
	'lead',
	'heading4',
	'heading3',
	'heading2',
	'heading1',
	'display',
] as const;
type TypeStyleName = (typeof TYPE_STYLES)[number];

const TYPE_PROPERTIES = [
	'fontFamily',
	'fontSize',
	'fontWeight',
	'letterSpacing',
	'lineHeight',
] as const;
type TypeProperty = (typeof TYPE_PROPERTIES)[number];

interface TypeStyleRow {
	style: TypeStyleName;
	tokens: Readonly<Record<TypeProperty, ThemeToken>>;
}

interface TypographySection {
	/** `font.family.*`. */
	families: ReadonlyArray<ThemeToken>;
	/** One row per type style, smallest first, with a token per property. */
	styles: ReadonlyArray<TypeStyleRow>;
	/** `font.weight.*`. */
	weights: ReadonlyArray<ThemeToken>;
}

const SCALE_IDS = [
	'space',
	'radius',
	'depth',
	'controlFinish',
	'controlSize',
	'interaction',
	'motionDuration',
	'motionEasing',
] as const;
type ScaleId = (typeof SCALE_IDS)[number];

interface TokenScale {
	id: ScaleId;
	tokens: ReadonlyArray<ThemeToken>;
}

type TokenSectionId = 'roleColors' | 'neutralColors' | 'typography' | 'scales';

export interface TokenSections {
	neutralColors: ReadonlyArray<NeutralColorGroup>;
	roleColors: ReadonlyArray<RoleColorRow>;
	scales: Readonly<Record<ScaleId, TokenScale>>;
	/** The section each token path belongs to. Every contract token has exactly one. */
	sectionByPath: ReadonlyMap<string, TokenSectionId>;
	typography: TypographySection;
}

/**
 * Sorts every generated token into exactly one section. Throws when a token matches no section or
 * more than one, or when a grammar cell has no token, because a reference that quietly omits or
 * duplicates part of the contract is worse than one that fails to build.
 */
export function buildTokenSections(tokens: ReadonlyArray<ThemeToken> = themeTokens): TokenSections {
	const sectionByPath = new Map<string, TokenSectionId>();
	const unclassified: Array<string> = [];
	const duplicated: Array<string> = [];

	for (const token of tokens) {
		const matches = SECTION_MATCHERS.filter((matcher) => matcher.matches(token.path));
		const [match] = matches;
		if (match === undefined) unclassified.push(token.path);
		else if (matches.length > 1) duplicated.push(token.path);
		else sectionByPath.set(token.path, match.id);
	}

	if (unclassified.length > 0) {
		throw new Error(`No token section covers: ${unclassified.join(', ')}`);
	}
	if (duplicated.length > 0) {
		throw new Error(`More than one token section covers: ${duplicated.join(', ')}`);
	}

	const byPath = new Map(tokens.map((token) => [token.path, token]));

	return {
		neutralColors: buildNeutralColorGroups(tokens),
		roleColors: buildRoleColorRows(byPath),
		scales: buildScales(tokens),
		sectionByPath,
		typography: buildTypography(tokens, byPath),
	};
}

const NEUTRAL_GROUP_TITLES: Record<NeutralColorGroupId, string> = {
	borders: 'Borders',
	other: 'Other',
	surfaces: 'Surfaces',
	text: 'Text',
};

const NEUTRAL_GROUP_ORDER: ReadonlyArray<NeutralColorGroupId> = [
	'surfaces',
	'text',
	'borders',
	'other',
];

/** Structural borders. Role borders share `color.border` but belong to the role grid. */
const STRUCTURAL_BORDERS: ReadonlySet<string> = new Set([
	'decorative',
	'control',
	'controlHover',
	'focus',
]);

/** Neutral colours outside the surface, text, and border families, listed so a new one must be placed. */
const OTHER_NEUTRAL_PATHS: ReadonlySet<string> = new Set([
	'color.overlay.backdrop',
	'color.loadingSkeleton',
]);

function neutralColorGroupOf(path: string): NeutralColorGroupId | undefined {
	const [family, section, leaf, ...rest] = path.split('.');
	if (family !== 'color') return;
	if (OTHER_NEUTRAL_PATHS.has(path)) return 'other';
	if (leaf === undefined || rest.length > 0) return;
	if (section === 'surface') return 'surfaces';
	if (section === 'text') return 'text';
	if (section === 'border' && STRUCTURAL_BORDERS.has(leaf)) return 'borders';
	return;
}

const TYPE_STYLE_SET: ReadonlySet<string> = new Set(TYPE_STYLES);
const TYPE_PROPERTY_SET: ReadonlySet<string> = new Set(TYPE_PROPERTIES);

type TypographyPart = 'family' | 'style' | 'weight';

function typographyPartOf(path: string): TypographyPart | undefined {
	const [family, section, leaf, ...rest] = path.split('.');
	if (family !== 'font' || section === undefined || leaf === undefined || rest.length > 0) return;
	if (section === 'family') return 'family';
	if (section === 'weight') return 'weight';
	if (TYPE_STYLE_SET.has(section) && TYPE_PROPERTY_SET.has(leaf)) return 'style';
	return;
}

/** The scale each non-colour, non-type path prefix belongs to. Longest prefix first. */
const SCALE_PREFIXES: ReadonlyArray<readonly [prefix: string, scale: ScaleId]> = [
	['motion.duration.', 'motionDuration'],
	['motion.easing.', 'motionEasing'],
	['controlFinish.', 'controlFinish'],
	['controlSize.', 'controlSize'],
	['interaction.', 'interaction'],
	['depth.', 'depth'],
	['radius.', 'radius'],
	['space.', 'space'],
];

function scaleOf(path: string): ScaleId | undefined {
	for (const [prefix, scale] of SCALE_PREFIXES) {
		if (path.startsWith(prefix) && !path.slice(prefix.length).includes('.')) return scale;
	}
	return;
}

const SECTION_MATCHERS: ReadonlyArray<{ id: TokenSectionId; matches: (path: string) => boolean }> =
	[
		{ id: 'roleColors', matches: (path) => ROLE_PATHS.has(path) },
		{ id: 'neutralColors', matches: (path) => neutralColorGroupOf(path) !== undefined },
		{ id: 'typography', matches: (path) => typographyPartOf(path) !== undefined },
		{ id: 'scales', matches: (path) => scaleOf(path) !== undefined },
	];

function buildRoleColorRows(byPath: ReadonlyMap<string, ThemeToken>): ReadonlyArray<RoleColorRow> {
	const missing: Array<string> = [];
	const rows = ROLES.map((role) => {
		const tokens = roleColorPaths(role).flatMap((path) => {
			const token = byPath.get(path);
			if (token !== undefined) return [token];
			missing.push(path);
			return [];
		});
		return { role, tokens };
	});

	if (missing.length > 0)
		throw new Error(`Role colour catalogue has no token for: ${missing.join(', ')}`);
	return rows;
}

function buildNeutralColorGroups(
	tokens: ReadonlyArray<ThemeToken>,
): ReadonlyArray<NeutralColorGroup> {
	const byGroup = new Map<NeutralColorGroupId, Array<ThemeToken>>(
		NEUTRAL_GROUP_ORDER.map((id) => [id, []]),
	);
	for (const token of tokens) {
		const group = neutralColorGroupOf(token.path);
		if (group !== undefined) byGroup.get(group)?.push(token);
	}
	return NEUTRAL_GROUP_ORDER.map((id) => ({
		id,
		title: NEUTRAL_GROUP_TITLES[id],
		tokens: byGroup.get(id) ?? [],
	}));
}

function buildTypography(
	tokens: ReadonlyArray<ThemeToken>,
	byPath: ReadonlyMap<string, ThemeToken>,
): TypographySection {
	const missing: Array<string> = [];
	const styles = TYPE_STYLES.map((style): TypeStyleRow => {
		const entries = TYPE_PROPERTIES.flatMap((property) => {
			const path = `font.${style}.${property}`;
			const token = byPath.get(path);
			if (token === undefined) {
				missing.push(path);
				return [];
			}
			return [[property, token] as const];
		});
		return { style, tokens: Object.fromEntries(entries) as Record<TypeProperty, ThemeToken> };
	});

	if (missing.length > 0)
		throw new Error(`Type style grid has no token for: ${missing.join(', ')}`);

	return {
		families: tokens.filter((token) => typographyPartOf(token.path) === 'family'),
		styles,
		weights: tokens.filter((token) => typographyPartOf(token.path) === 'weight'),
	};
}

function buildScales(tokens: ReadonlyArray<ThemeToken>): Readonly<Record<ScaleId, TokenScale>> {
	const byScale = new Map<ScaleId, Array<ThemeToken>>(SCALE_IDS.map((id) => [id, []]));
	for (const token of tokens) {
		const scale = scaleOf(token.path);
		if (scale !== undefined) byScale.get(scale)?.push(token);
	}
	function scale(id: ScaleId): TokenScale {
		return { id, tokens: byScale.get(id) ?? [] };
	}

	return {
		controlFinish: scale('controlFinish'),
		controlSize: scale('controlSize'),
		depth: scale('depth'),
		interaction: scale('interaction'),
		motionDuration: scale('motionDuration'),
		motionEasing: scale('motionEasing'),
		radius: scale('radius'),
		space: scale('space'),
	};
}

export const tokenSections: TokenSections = buildTokenSections();
