import { fileURLToPath } from 'node:url';
import * as stylex from '@stylexjs/stylex';
import { readFile } from 'node:fs/promises';
import { parse } from 'postcss';
import type { AnyNode, Rule } from 'postcss';
import selectorParser from 'postcss-selector-parser';
import { expect, test } from 'vite-plus/test';
import { iconMaskUrls } from '../../../.generated/icon-mask-data.js';
import { createStylexStylesheet } from '../../../stylex-vite-plugin.js';
import { comboboxInputStates, inputGroupInputStates } from './input-states.js';
import { invalidIndicator } from './invalid-indicator.stylex.js';

/** Returns rules from the same StyleX compilation pipeline used by `vp pack`. */
async function compiledRules(): Promise<Array<Rule>> {
	const stylesheet = await createStylexStylesheet(true);
	const rules: Array<Rule> = [];
	parse(stylesheet).walkRules((rule) => {
		rules.push(rule);
	});
	return rules;
}

/** Whether a selector references `:invalid` or `:read-only` without scoping it to `input`. */
function hasUnscopedPseudo(selector: string, pseudoValue: ':invalid' | ':read-only'): boolean {
	let found = false;
	selectorParser((selectors) => {
		selectors.walkPseudos((pseudo) => {
			if (pseudo.value !== pseudoValue) return;
			const previous = pseudo.prev();
			if (previous?.type !== 'tag' || previous.value !== 'input') found = true;
		});
	}).processSync(selector);
	return found;
}

function compiledClassNames(styles: ReadonlyArray<stylex.CompiledStyles>): Set<string> {
	return new Set(
		styles.flatMap((style) =>
			Object.values(style).flatMap((value) => (typeof value === 'string' ? [value] : [])),
		),
	);
}

function normalizeCompiledClassNames(selector: string, classNames: Set<string>): string {
	return selectorParser((selectors) => {
		selectors.walkClasses((className) => {
			if (classNames.has(className.value)) className.value = 'generated';
		});
	}).processSync(selector);
}

function selectorUsesClassName(selector: string, classNames: Set<string>): boolean {
	let usesClassName = false;
	selectorParser((selectors) => {
		selectors.walkClasses((className) => {
			if (classNames.has(className.value)) usesClassName = true;
		});
	}).processSync(selector);
	return usesClassName;
}

function isForcedColorsRule(rule: Rule): boolean {
	for (let parent: AnyNode | undefined = rule.parent; parent; parent = parent.parent) {
		if (
			parent.type === 'atrule' &&
			parent.name === 'media' &&
			parent.params === '(forced-colors: active)'
		) {
			return true;
		}
	}
	return false;
}

function compiledSelectorContract(
	rules: ReadonlyArray<Rule>,
	styles: ReadonlyArray<stylex.CompiledStyles>,
) {
	const classNames = compiledClassNames(styles);
	const selectors = rules.filter((rule) => selectorUsesClassName(rule.selector, classNames));
	const normalize = (rule: Rule) => normalizeCompiledClassNames(rule.selector, classNames);

	return {
		default: [
			...new Set(selectors.filter((rule) => !isForcedColorsRule(rule)).map(normalize)),
		].sort(),
		forcedColors: [
			...new Set(selectors.filter((rule) => isForcedColorsRule(rule)).map(normalize)),
		].sort(),
	};
}

test('the two consumers compose the identical shared disabled/hover style', () => {
	// Both arrays must contain the same compiled object, not equivalent copies.
	expect(comboboxInputStates[0]).toBe(inputGroupInputStates[0]);
});

test(
	'the compiled input states retain the complete composite selector matrix',
	{ timeout: 30_000 },
	async () => {
		const rules = await compiledRules();

		expect({
			combobox: compiledSelectorContract(rules, comboboxInputStates),
			inputGroup: compiledSelectorContract(rules, inputGroupInputStates),
		}).toMatchInlineSnapshot(`
			{
			  "combobox": {
			    "default": [
			      ".generated.generated:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))",
			      ".generated.generated:where([data-focus-within="true"], :focus-within):has(input:focus):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"]))):not(:where([data-readonly="true"], :has(input:read-only)))",
			      ".generated.generated:where([data-hovered="true"], :hover):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within)):not(:where([data-readonly="true"], :has(input:read-only))):not(:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])))",
			      ".generated.generated:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within):has(input:focus)):not(:where([data-readonly="true"], :has(input:read-only)))",
			      ".generated.generated:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):where([data-focus-within="true"], :focus-within):has(input:focus):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-readonly="true"], :has(input:read-only)))",
			      ".generated.generated:where([data-readonly="true"], :has(input:read-only)):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within):has(input:focus))",
			      ".generated.generated:where([data-readonly="true"], :has(input:read-only)):where([data-focus-within="true"], :focus-within):has(input:focus):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))",
			    ],
			    "forcedColors": [
			      ".generated.generated",
			      ".generated.generated.generated:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))",
			      ".generated.generated.generated:where([data-focus-within="true"], :focus-within):has(input:focus):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"]))):not(:where([data-readonly="true"], :has(input:read-only)))",
			      ".generated.generated.generated:where([data-hovered="true"], :hover):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within)):not(:where([data-readonly="true"], :has(input:read-only))):not(:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])))",
			      ".generated.generated.generated:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within):has(input:focus)):not(:where([data-readonly="true"], :has(input:read-only)))",
			      ".generated.generated.generated:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):where([data-focus-within="true"], :focus-within):has(input:focus):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-readonly="true"], :has(input:read-only)))",
			      ".generated.generated.generated:where([data-readonly="true"], :has(input:read-only)):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within):has(input:focus))",
			      ".generated.generated.generated:where([data-readonly="true"], :has(input:read-only)):where([data-focus-within="true"], :focus-within):has(input:focus):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))",
			    ],
			  },
			  "inputGroup": {
			    "default": [
			      ".generated.generated:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))",
			      ".generated.generated:where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"]))):not(:where([data-readonly="true"], :has(input:read-only)))",
			      ".generated.generated:where([data-hovered="true"], :hover):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within)):not(:where([data-readonly="true"], :has(input:read-only))):not(:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])))",
			      ".generated.generated:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within)):not(:where([data-readonly="true"], :has(input:read-only)))",
			      ".generated.generated:where([data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])):where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-readonly="true"], :has(input:read-only)))",
			      ".generated.generated:where([data-readonly="true"], :has(input:read-only)):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))):not(:where([data-focus-within="true"], :focus-within))",
			      ".generated.generated:where([data-readonly="true"], :has(input:read-only)):where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))",
			    ],
			    "forcedColors": [
			      ".generated.generated",
			      ".generated.generated.generated:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"]))",
			      ".generated.generated.generated:where([data-focus-within="true"], :focus-within):not(:where([data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])))",
			    ],
			  },
			}
		`);
	},
);

test(
	'the invalid and read-only states never key off unscoped native pseudo-classes',
	{ timeout: 30_000 },
	async () => {
		// Native `:invalid` can match before React Aria exposes the invalid state to assistive
		// technology. Bare `:read-only` can match non-input descendants.
		const rules = await compiledRules();
		const relevantRules = rules.filter(
			(rule) => rule.selector.includes('data-invalid') || rule.selector.includes('data-readonly'),
		);

		expect(relevantRules.length).toBeGreaterThan(0);

		for (const rule of relevantRules) {
			expect(
				hasUnscopedPseudo(rule.selector, ':invalid'),
				`unscoped :invalid in: ${rule.selector}`,
			).toBe(false);
			expect(
				hasUnscopedPseudo(rule.selector, ':read-only'),
				`unscoped :read-only in: ${rule.selector}`,
			).toBe(false);
		}
	},
);

test('the shared invalid-indicator mask tracks the generated icon set', () => {
	// StyleX uses a local `defineConsts` copy because it cannot read the generated module. Check that
	// copy against the generated icon set.
	expect(invalidIndicator.maskImage).toBe(iconMaskUrls.exclamationTriangle);
});

test('both invalid indicators use the shared mask const, not a pasted data URI', async () => {
	// Compiled output cannot distinguish the shared const from an identical pasted value.
	const [combobox, field] = await Promise.all([
		readFile(fileURLToPath(new URL('../primitives/combobox/recipe.ts', import.meta.url)), 'utf8'),
		readFile(fileURLToPath(new URL('../primitives/field/recipe.ts', import.meta.url)), 'utf8'),
	]);

	for (const [name, source] of [
		['combobox', combobox],
		['field', field],
	] as const) {
		expect(source, `${name} should reference the shared mask const`).toContain(
			'invalidIndicator.maskImage',
		);
		expect(source, `${name} re-inlined the mask data URI`).not.toContain('data:image/svg+xml');
	}
});

test('resolving the shared states through stylex.props never throws', () => {
	expect(() => stylex.props(...comboboxInputStates)).not.toThrow();
	expect(() => stylex.props(...inputGroupInputStates)).not.toThrow();
});
