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

/** Top-level branches under `vars.color`, in the order the reference page lists them. */
export const COLOR_FAMILIES = [
	'background',
	'foreground',
	'border',
	'surface',
	'text',
	'overlay',
	'loadingSkeleton',
] as const;
export type ColorFamilyId = (typeof COLOR_FAMILIES)[number];

const COLOR_FAMILY_SET: ReadonlySet<string> = new Set(COLOR_FAMILIES);

interface ColorRoleGroup {
	role: Role;
	tokens: ReadonlyArray<ThemeToken>;
}

interface ColorFamilySection {
	id: ColorFamilyId;
	/**
	 * Role subgroups for `background` and `foreground`. Other families stay a single list in
	 * contract order.
	 */
	roles: ReadonlyArray<ColorRoleGroup> | null;
	/** Flat token list when `roles` is null. Empty when tokens live under `roles`. */
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

type TokenSectionId = 'colors' | 'typography' | 'scales';

export interface TokenSections {
	colors: ReadonlyArray<ColorFamilySection>;
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
		colors: buildColorFamilies(tokens),
		scales: buildScales(tokens),
		sectionByPath,
		typography: buildTypography(tokens, byPath),
	};
}

/** The `vars.color.<family>` branch a colour path belongs to. */
function colorFamilyOf(path: string): ColorFamilyId | undefined {
	const [root, family] = path.split('.');
	if (root !== 'color' || family === undefined || !COLOR_FAMILY_SET.has(family)) return;
	return family as ColorFamilyId;
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
		{ id: 'colors', matches: (path) => colorFamilyOf(path) !== undefined },
		{ id: 'typography', matches: (path) => typographyPartOf(path) !== undefined },
		{ id: 'scales', matches: (path) => scaleOf(path) !== undefined },
	];

function buildColorFamilies(tokens: ReadonlyArray<ThemeToken>): ReadonlyArray<ColorFamilySection> {
	const byFamily = new Map<ColorFamilyId, Array<ThemeToken>>(COLOR_FAMILIES.map((id) => [id, []]));
	for (const token of tokens) {
		const family = colorFamilyOf(token.path);
		if (family !== undefined) byFamily.get(family)?.push(token);
	}

	return COLOR_FAMILIES.map((id) => {
		const familyTokens = byFamily.get(id) ?? [];
		if (id === 'background' || id === 'foreground') {
			return {
				id,
				roles: ROLES.map((role) => ({
					role,
					tokens: familyTokens.filter((token) => token.path.split('.')[2] === role),
				})),
				tokens: [],
			};
		}
		return { id, roles: null, tokens: familyTokens };
	});
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

/** Capitalises a role id for a group label. */
export function roleLabel(role: Role): string {
	return `${role[0]?.toUpperCase() ?? ''}${role.slice(1)}`;
}
