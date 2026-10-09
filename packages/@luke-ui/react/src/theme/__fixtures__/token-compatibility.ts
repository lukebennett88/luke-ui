/**
 * Test-only token compatibility check for a generated theme stylesheet. It parses the CSS with
 * Lightning CSS, finds the five rules by their role, and compares each rule's declared properties
 * with the tokens the in-repo contract expects. A stylesheet is compatible with this version of
 * Luke UI when it reports no problems.
 *
 * NOT imported by production code.
 */

import type { Selector, SelectorComponent, StyleRule } from 'lightningcss';
import { transform } from 'lightningcss';
import { capsizeTrimVarName } from '../capsize-trim-vars.js';
import { flattenThemeContract, partitionContractPairs } from '../contract.js';
import { getThemeClassName } from '../theme-class-name.js';
import { typeStyles } from '../type-styles.js';

/** The role a generated theme rule plays. */
export type ThemeRuleRole =
	| 'themeWide'
	| 'baseLight'
	| 'systemDark'
	| 'explicitLight'
	| 'explicitDark';

/** One generated theme rule: its role and the properties it declares, in source order. */
export interface ThemeRule {
	properties: Array<string>;
	/** Custom properties whose value is a `var()` reference. */
	referencingProperties: Array<string>;
	role: ThemeRuleRole;
}

const { identityPairs, modePairs } = partitionContractPairs(flattenThemeContract());

/** Every theme-wide token and private Capsize trim, as the contract expects them. */
export const expectedThemeWideProperties: ReadonlyArray<string> = [
	...identityPairs.map(([, varName]) => varName),
	...typeStyles.flatMap((style) => [
		capsizeTrimVarName(style, 'baselineTrim'),
		capsizeTrimVarName(style, 'capHeightTrim'),
	]),
];

/** Every mode token, plus the native `color-scheme` each mode rule sets. */
export const expectedModeProperties: ReadonlyArray<string> = [
	'color-scheme',
	...modePairs.map(([, varName]) => varName),
];

const EXPECTED_PROPERTIES = {
	baseLight: expectedModeProperties,
	explicitDark: expectedModeProperties,
	explicitLight: expectedModeProperties,
	systemDark: expectedModeProperties,
	themeWide: expectedThemeWideProperties,
} as const satisfies Record<ThemeRuleRole, ReadonlyArray<string>>;

/**
 * Reads the generated rules of the theme named `themeName`, keyed by role. Throws when the
 * stylesheet holds a rule that is not one of the five, or when a role is missing or repeated.
 */
export function readThemeRules(css: string, themeName: string): Record<ThemeRuleRole, ThemeRule> {
	const rules: Array<ThemeRule> = [];
	const unexpected: Array<string> = [];
	const identity = `:where(html).${getThemeClassName(themeName)}`;
	const explicit = (mode: string) => {
		return `${identity}[data-color-mode='${mode}'], ${identity} [data-color-mode='${mode}']`;
	};
	let plainRules = 0;

	transform({
		code: Buffer.from(css),
		filename: `${themeName}.css`,
		visitor: {
			StyleSheet(stylesheet) {
				for (const rule of stylesheet.rules) {
					if (rule.type === 'media') {
						const [inner, ...rest] = rule.value.rules;
						const isSystemDark = JSON.stringify(rule.value.query).includes(
							'"name":"prefers-color-scheme","value":{"type":"ident","value":"dark"}',
						);
						if (
							isSystemDark &&
							rest.length === 0 &&
							inner?.type === 'style' &&
							selectorText(inner.value.selectors) === identity
						) {
							rules.push(describe(inner.value, 'systemDark'));
						} else {
							unexpected.push(`@media ${JSON.stringify(rule.value.query)}`);
						}
						continue;
					}
					if (rule.type !== 'style') {
						unexpected.push(`@${rule.type}`);
						continue;
					}
					const selector = selectorText(rule.value.selectors);
					if (selector === identity) {
						// The theme-wide rule comes first, then the base light rule, with one selector.
						rules.push(describe(rule.value, plainRules === 0 ? 'themeWide' : 'baseLight'));
						plainRules += 1;
					} else if (selector === explicit('light')) {
						rules.push(describe(rule.value, 'explicitLight'));
					} else if (selector === explicit('dark')) {
						rules.push(describe(rule.value, 'explicitDark'));
					} else {
						unexpected.push(selector);
					}
				}
			},
		},
	});

	if (unexpected.length > 0) throw new Error(`Unexpected theme rules: ${unexpected.join(' | ')}`);
	const byRole = new Map<ThemeRuleRole, ThemeRule>();
	for (const rule of rules) {
		if (byRole.has(rule.role)) throw new Error(`Repeated ${rule.role} rule`);
		byRole.set(rule.role, rule);
	}
	const read = {} as Record<ThemeRuleRole, ThemeRule>;
	for (const role of Object.keys(EXPECTED_PROPERTIES) as Array<ThemeRuleRole>) {
		const rule = byRole.get(role);
		if (rule === undefined) throw new Error(`Missing ${role} rule`);
		read[role] = rule;
	}
	return read;
}

/**
 * Lists every compatibility problem in a generated stylesheet, per rule: a missing, duplicated, or
 * unexpected property, or a token value that references another token. Returns an empty array for
 * a compatible stylesheet.
 */
export function findTokenCompatibilityProblems(css: string, themeName: string): Array<string> {
	const rules = readThemeRules(css, themeName);
	const problems: Array<string> = [];
	for (const [role, rule] of Object.entries(rules) as Array<[ThemeRuleRole, ThemeRule]>) {
		const expected = new Set(EXPECTED_PROPERTIES[role]);
		const seen = new Set<string>();
		for (const property of rule.properties) {
			if (seen.has(property)) problems.push(`${role}: ${property} is declared twice`);
			seen.add(property);
			if (!expected.has(property)) problems.push(`${role}: ${property} is not a contract token`);
		}
		for (const property of expected) {
			if (!seen.has(property)) problems.push(`${role}: ${property} is missing`);
		}
		for (const property of rule.referencingProperties) {
			problems.push(`${role}: ${property} references another token`);
		}
	}
	return problems;
}

function describe(rule: StyleRule, role: ThemeRuleRole): ThemeRule {
	const properties: Array<string> = [];
	const referencingProperties: Array<string> = [];
	for (const declaration of rule.declarations?.declarations ?? []) {
		if (declaration.property === 'custom') {
			properties.push(declaration.value.name);
			if (JSON.stringify(declaration.value.value).includes('"type":"var"')) {
				referencingProperties.push(declaration.value.name);
			}
		} else if (declaration.property === 'unparsed') {
			properties.push(declaration.value.propertyId.property);
		} else {
			properties.push(declaration.property);
		}
	}
	return { properties, referencingProperties, role };
}

/** Prints a selector list in the generator's own spelling, for matching by role. */
function selectorText(selectors: Array<Selector>): string {
	return selectors.map((selector) => selector.map(componentText).join('')).join(', ');
}

function componentText(component: SelectorComponent): string {
	switch (component.type) {
		case 'type':
			return component.name;
		case 'class':
			return `.${component.name}`;
		case 'combinator':
			return component.value === 'descendant' ? ' ' : ` ${component.value} `;
		case 'attribute': {
			const operation = component.operation;
			if (operation == null) return `[${component.name}]`;
			return `[${component.name}='${operation.value}']`;
		}
		case 'pseudo-class':
			if (component.kind === 'where') return `:where(${selectorText(component.selectors)})`;
			return `:${component.kind}`;
		default:
			return `<${component.type}>`;
	}
}
