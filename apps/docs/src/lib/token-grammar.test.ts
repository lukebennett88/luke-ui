import { readFileSync } from 'node:fs';
import { expect, test } from 'vite-plus/test';
import { themeTokens } from '../generated/token-reference.generated.js';
import { buildTokenSections, ROLES } from './token-grammar.js';

const ROLE_HEADING_PATTERN = /^### (Neutral|Accent|Info|Success|Warning|Danger)$/gm;
const EXPECTED_ROLES = ['neutral', 'accent', 'info', 'success', 'warning', 'danger'];

test('the catalogue covers every public token exactly once', () => {
	const sections = buildTokenSections();
	expect([...sections.sectionByPath.keys()].sort()).toEqual(
		themeTokens.map((token) => token.path).sort(),
	);
	expect(sections.sectionByPath.size).toBe(themeTokens.length);
});

test('each role shows all eleven tokens in contract order', () => {
	const { roleColors } = buildTokenSections();
	expect(roleColors.map(({ role }) => role)).toEqual(EXPECTED_ROLES);
	for (const { role, tokens } of roleColors) {
		expect(tokens.map(({ path }) => path)).toEqual([
			`color.background.${role}.subtle.rest`,
			`color.background.${role}.subtle.hover`,
			`color.background.${role}.subtle.pressed`,
			`color.background.${role}.solid.rest`,
			`color.background.${role}.solid.hover`,
			`color.background.${role}.solid.pressed`,
			`color.foreground.${role}.rest`,
			`color.foreground.${role}.hover`,
			`color.foreground.${role}.pressed`,
			`color.foreground.${role}.onSolid`,
			`color.border.${role}`,
		]);
	}
});

test('all six role headings belong to the MDX table of contents', () => {
	const mdx = readFileSync(
		new URL('../../content/docs/docs/token-reference.mdx', import.meta.url),
		'utf8',
	);
	const roleHeadings = [...mdx.matchAll(ROLE_HEADING_PATTERN)].map(([, role]) =>
		role?.toLowerCase(),
	);
	expect(roleHeadings).toEqual(EXPECTED_ROLES);
	expect(ROLES).toEqual(EXPECTED_ROLES);
});
