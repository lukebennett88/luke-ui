import { readFileSync } from 'node:fs';
import { expect, test } from 'vite-plus/test';
import { themeTokens } from '../generated/token-reference.generated.js';
import { buildTokenSections, COLOR_FAMILIES, ROLES } from './token-grammar.js';

/** Title-case MDX headings for each colour family, in page order. */
const COLOR_HEADINGS = [
	'Background',
	'Foreground',
	'Border',
	'Surface',
	'Text',
	'Overlay',
	'Loading skeleton',
] as const;

const COLOR_HEADING_PATTERN = new RegExp(
	`^### (${COLOR_HEADINGS.map((heading) => heading.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})$`,
	'gm',
);

const COLOR_HEADING_TO_FAMILY = {
	Background: 'background',
	Foreground: 'foreground',
	Border: 'border',
	Surface: 'surface',
	Text: 'text',
	Overlay: 'overlay',
	'Loading skeleton': 'loadingSkeleton',
} as const satisfies Record<(typeof COLOR_HEADINGS)[number], (typeof COLOR_FAMILIES)[number]>;

test('the catalogue covers every public token exactly once', () => {
	const sections = buildTokenSections();
	expect([...sections.sectionByPath.keys()].toSorted()).toEqual(
		themeTokens.map((token) => token.path).toSorted(),
	);
	expect(sections.sectionByPath.size).toBe(themeTokens.length);
});

test('colour families follow the public vars.color paths in page order', () => {
	const { colors } = buildTokenSections();
	expect(colors.map(({ id }) => id)).toEqual([...COLOR_FAMILIES]);
});

for (const familyId of ['background', 'foreground'] as const) {
	test(`${familyId} groups tokens by role in contract order`, () => {
		const family = buildTokenSections().colors.find(({ id }) => id === familyId);
		expect(family?.roles?.map(({ role }) => role)).toEqual([...ROLES]);
		expect(family?.tokens).toEqual([]);
		for (const { role, tokens } of family?.roles ?? []) {
			expect(tokens.length).toBeGreaterThan(0);
			expect(tokens.every((token) => token.path.startsWith(`color.${familyId}.${role}.`))).toBe(
				true,
			);
		}
	});
}

for (const familyId of ['border', 'surface', 'text', 'overlay', 'loadingSkeleton'] as const) {
	test(`${familyId} is a flat list under color.${familyId}`, () => {
		const family = buildTokenSections().colors.find(({ id }) => id === familyId);
		expect(family?.roles).toBeNull();
		expect(family?.tokens.every((token) => token.path.startsWith(`color.${familyId}`))).toBe(true);
	});
}

test('background tokens keep role, subtle/solid, then state order', () => {
	const background = buildTokenSections().colors.find(({ id }) => id === 'background');
	expect(background?.roles).toBeDefined();
	for (const { role, tokens } of background?.roles ?? []) {
		expect(tokens.map(({ path }) => path)).toEqual([
			`color.background.${role}.subtle.rest`,
			`color.background.${role}.subtle.hover`,
			`color.background.${role}.subtle.pressed`,
			`color.background.${role}.solid.rest`,
			`color.background.${role}.solid.hover`,
			`color.background.${role}.solid.pressed`,
		]);
	}
});

test('colour family headings belong to the MDX table of contents', () => {
	const mdx = readFileSync(
		new URL('../../content/docs/docs/token-reference.mdx', import.meta.url),
		'utf8',
	);
	const headings = [...mdx.matchAll(COLOR_HEADING_PATTERN)].map(
		([, title]) => COLOR_HEADING_TO_FAMILY[title as keyof typeof COLOR_HEADING_TO_FAMILY],
	);
	expect(headings).toEqual([...COLOR_FAMILIES]);
});

for (const [prefix, scaleId] of [
	['motion.enter.', 'motionEnter'],
	['motion.exit.', 'motionExit'],
	['motion.feedback.', 'motionFeedback'],
	['controlFinish.', 'controlFinish'],
	['controlSize.', 'controlSize'],
	['interaction.', 'interaction'],
	['depth.', 'depth'],
	['radius.', 'radius'],
	['space.', 'space'],
] as const) {
	test(`${scaleId} tokens sit under ${prefix}`, () => {
		const scale = buildTokenSections().scales[scaleId];
		expect(scale.tokens.length).toBeGreaterThan(0);
		expect(scale.tokens.every((token) => token.path.startsWith(prefix))).toBe(true);
		expect(
			themeTokens
				.filter((token) => token.path.startsWith(prefix))
				.map((token) => token.path)
				.toSorted(),
		).toEqual(scale.tokens.map((token) => token.path).toSorted());
	});
}
