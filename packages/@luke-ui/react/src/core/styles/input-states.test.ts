import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import { iconMaskUrls } from '../../../.generated/icon-mask-data.js';
import { invalidIndicator } from './invalid-indicator.stylex.js';

/**
 * The field-control state fragments. `InputGroup` and `Combobox` each spell these out inside their
 * own `stylex.create` call because StyleX offers no way to share a selector across modules — see
 * the block comment at the top of either recipe for the compiler evidence. These tests are what
 * keeps the two copies honest.
 */
const stateFragments = {
	disabled:
		'[data-disabled="true"], [aria-disabled="true"], :has(input:disabled), :has(input[aria-disabled="true"])',
	focusWithin: '[data-focus-within="true"], :focus-within',
	hover: '[data-hovered="true"], :hover',
	invalid: '[data-invalid="true"], [aria-invalid="true"], :has(input[aria-invalid="true"])',
	readOnly: '[data-readonly="true"], :has(input:read-only)',
} as const;

const recipeSources = {
	combobox: '../primitives/combobox/recipe.ts',
	inputGroup: '../primitives/input-group/recipe.ts',
} as const;

async function readRecipe(name: keyof typeof recipeSources): Promise<string> {
	return readFile(fileURLToPath(new URL(recipeSources[name], import.meta.url)), 'utf8');
}

test.for(Object.entries(stateFragments))(
	'both field-control recipes spell the %s state identically',
	async ([state, fragment]) => {
		const [combobox, inputGroup] = await Promise.all([
			readRecipe('combobox'),
			readRecipe('inputGroup'),
		]);

		expect(inputGroup, `InputGroup lost the shared ${state} fragment`).toContain(fragment);
		expect(combobox, `Combobox lost the shared ${state} fragment`).toContain(fragment);
	},
);

test('the invalid state never keys off native `:invalid`', async () => {
	// Native `:invalid` matches an empty required input from first render, before any interaction,
	// while React Aria's `data-invalid`/`aria-invalid` stay null until validation runs. Styling on
	// `:has(:invalid)` would paint an untouched required field invalid while telling assistive
	// technology it is fine.
	const names = Object.keys(recipeSources) as Array<keyof typeof recipeSources>;
	const sources = await Promise.all(names.map(readRecipe));

	for (const [index, source] of sources.entries()) {
		// Only selector keys count: the recipes discuss `:has(:invalid)` in prose to explain why
		// they avoid it, and that comment must not trip this assertion.
		const selectorKeys = source.match(/^\t*'[^'\n]*':/gm) ?? [];

		expect(
			selectorKeys.filter((key) => /:has\((?:input)?:invalid\)/.test(key)),
			`${names[index]} must not style on native \`:invalid\``,
		).toEqual([]);
	}
});

test('only Combobox narrows focus-within to the text input', async () => {
	// Combobox puts a trigger and clear button inside the group, so bare `:focus-within` would also
	// match when one of those holds focus. InputGroup has no such buttons, and must not carry the
	// extra clause.
	expect(await readRecipe('combobox')).toContain(
		`:where(${stateFragments.focusWithin}):has(input:focus)`,
	);
	expect(await readRecipe('inputGroup')).not.toContain('has(input:focus)');
});

test('the shared invalid-indicator mask tracks the generated icon set', () => {
	// The mask URL is the one piece of the invalid indicator that does cross a module boundary, as
	// a `defineConsts` value. `.generated/icon-mask-data.ts` is its canonical source; StyleX cannot
	// read that file, so this asserts the mirrored copy has not drifted from a regenerated icon set.
	expect(invalidIndicator.maskImage).toBe(iconMaskUrls.exclamationTriangle);
});

test('both invalid indicators use the shared mask const, not a pasted data URI', async () => {
	const [combobox, field] = await Promise.all([
		readRecipe('combobox'),
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
