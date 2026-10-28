import { vars } from '@luke-ui/react/theme';
import type { ThemeToken } from '../generated/token-reference.generated.js';
import { themeTokens } from '../generated/token-reference.generated.js';

/*
 * The token contract as a grammar: which names exist and how their segments combine. The token
 * reference page renders these sections instead of one flat list. Names come from the public `vars`
 * object so an invalid or missing segment fails TypeScript. Building the sections still throws when
 * generated data is unclassified or classified twice.
 *
 * Client-safe: no Node built-ins.
 */

/** Fails compilation when `List` omits any `Key`. Invalid extras are rejected by `satisfies`. */
type AssertExhaustive<Key extends string, List extends ReadonlyArray<Key>> =
	Exclude<Key, List[number]> extends never ? true : Exclude<Key, List[number]>;

export type Role = Exclude<keyof typeof vars.color.background, 'surface' | 'backdrop' | 'skeleton'>;

/** Semantic roles under `vars.color.background` / `foreground`, in contract order. */
export const ROLES = [
	'neutral',
	'accent',
	'info',
	'success',
	'warning',
	'danger',
] as const satisfies ReadonlyArray<Role>;
true satisfies AssertExhaustive<Role, typeof ROLES>;

export type ColorFamilyId = keyof typeof vars.color;

/**
 * Top-level branches under `vars.color`, in the order the reference page lists them. Not the
 * declaration order of `themeContractTree.color`.
 */
export const COLOR_FAMILIES = [
	'background',
	'foreground',
	'border',
] as const satisfies ReadonlyArray<ColorFamilyId>;
true satisfies AssertExhaustive<ColorFamilyId, typeof COLOR_FAMILIES>;

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

type TypeStyleName = Exclude<keyof typeof vars.font, 'family' | 'weight'>;

/** Public type styles, smallest first, matching `vars.font` style keys. */
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
] as const satisfies ReadonlyArray<TypeStyleName>;
true satisfies AssertExhaustive<TypeStyleName, typeof TYPE_STYLES>;

type TypeProperty = keyof typeof vars.font.body;

/** Leaves shared by every public type style on `vars.font.<style>`. */
const TYPE_PROPERTIES = [
	'fontFamily',
	'fontSize',
	'fontWeight',
	'letterSpacing',
	'lineHeight',
] as const satisfies ReadonlyArray<TypeProperty>;
true satisfies AssertExhaustive<TypeProperty, typeof TYPE_PROPERTIES>;

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

/** Top-level `vars` branches that are one flat catalogue scale each. */
type ScaleRoot = Exclude<keyof typeof vars, 'color' | 'font' | 'motion'>;

/** Treatments under `vars.motion`. */
type MotionBranch = Extract<keyof typeof vars.motion, string>;

/** `vars.motion` splits into one scale per treatment (`feedback` → `motionFeedback`, …). */
type MotionScaleId = {
	[K in MotionBranch]: `motion${Capitalize<K>}`;
}[MotionBranch];

type ScaleId = ScaleRoot | MotionScaleId;

/** Valid `[path prefix, scale id]` pairs derived from `vars`. Wrong pairings fail `satisfies`. */
type ScalePrefixEntry =
	| {
			[K in ScaleRoot]: readonly [`${K}.`, K];
	  }[ScaleRoot]
	| {
			[K in MotionBranch]: readonly [`motion.${K}.`, `motion${Capitalize<K>}`];
	  }[MotionBranch];

interface TokenScale {
	id: ScaleId;
	tokens: ReadonlyArray<ThemeToken>;
}

/**
 * Path prefix → scale id. Longest / most specific prefixes first. Each `ScaleId` appears once so a
 * new `vars` root cannot land without a catalogue home.
 */
const SCALE_PREFIXES = [
	['motion.enter.', 'motionEnter'],
	['motion.exit.', 'motionExit'],
	['motion.feedback.', 'motionFeedback'],
	['controlFinish.', 'controlFinish'],
	['controlSize.', 'controlSize'],
	['interaction.', 'interaction'],
	['shadow.', 'shadow'],
	['radius.', 'radius'],
	['space.', 'space'],
] as const satisfies ReadonlyArray<ScalePrefixEntry>;

type ScaleIdFromPrefixes = (typeof SCALE_PREFIXES)[number][1];
true satisfies AssertExhaustive<ScaleId, ReadonlyArray<ScaleIdFromPrefixes>>;

const SCALE_IDS = SCALE_PREFIXES.map(([, scale]) => scale);

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
	if (root !== 'color' || family === undefined || !(family in vars.color)) return;
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

function scaleOf(path: string): ScaleId | undefined {
	for (const [prefix, scale] of SCALE_PREFIXES) {
		if (
			path.startsWith(prefix) &&
			(!path.slice(prefix.length).includes('.') || prefix === 'interaction.')
		)
			return scale;
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
				tokens: familyTokens.filter(
					(token) => !ROLES.some((role) => token.path.split('.')[2] === role),
				),
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
	function scaleFor(id: ScaleId): TokenScale {
		return { id, tokens: byScale.get(id) ?? [] };
	}

	return {
		controlFinish: scaleFor('controlFinish'),
		controlSize: scaleFor('controlSize'),
		shadow: scaleFor('shadow'),
		interaction: scaleFor('interaction'),
		motionEnter: scaleFor('motionEnter'),
		motionExit: scaleFor('motionExit'),
		motionFeedback: scaleFor('motionFeedback'),
		radius: scaleFor('radius'),
		space: scaleFor('space'),
	};
}

export const tokenSections: TokenSections = buildTokenSections();

/** Capitalises a role id for a group label. */
export function roleLabel(role: Role): string {
	return `${role[0]?.toUpperCase() ?? ''}${role.slice(1)}`;
}
