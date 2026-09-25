import { assertType, describe, expectTypeOf, test } from 'vite-plus/test';
import type { RecipeSelection } from './recipe-types.js';
import type { SlottedConfigInput } from './recipe.js';
import { recipe, withDefaultVariants } from './recipe.js';

// `recipe()` needs a Vanilla Extract file scope, so every build sits in an arrow that only the type
// checker reads. Predeclared configs matter most: excess property checks skip them.

// Single-part `compoundVariants` is a mutable array, so `as const` goes on each entry's parts.
const singlePart = {
	compoundVariants: [{ style: {}, variants: { size: 'small', tone: 'accent' } as const }],
	defaultVariants: { size: 'medium' } as const,
	variants: {
		size: { medium: {}, small: {} },
		tone: { accent: {} },
	} as const,
};

const slotted = {
	compoundSlots: [{ slots: ['root'], style: {}, variants: { size: 'small' } }],
	defaultVariants: { size: 'medium' },
	slots: { label: {}, root: {} },
	variants: { size: { medium: { root: {} }, small: { label: {} } } },
} as const satisfies SlottedConfigInput;

describe('recipe variant keys', () => {
	test('infers known groups and values from the definition', () => {
		const buildSinglePart = () => recipe(singlePart);
		const buildSlotted = () => recipe(slotted);

		expectTypeOf<RecipeSelection<ReturnType<typeof buildSinglePart>>>().toEqualTypeOf<{
			size?: 'medium' | 'small' | undefined;
			tone?: 'accent' | undefined;
		}>();
		expectTypeOf<RecipeSelection<ReturnType<typeof buildSlotted>>>().toEqualTypeOf<{
			size?: 'medium' | 'small' | undefined;
		}>();
	});

	test('rejects an unknown group in a predeclared single-part config', () => {
		const unknownDefault = {
			defaultVariants: { bogus: 'x', size: 'small' },
			variants: { size: { small: {} } },
		} as const;
		const unknownCompound = {
			compoundVariants: [
				{ style: {}, variants: { size: 'small' } as const },
				{ style: {}, variants: { bogus: 'x', size: 'small' } as const },
			],
			variants: { size: { small: {} } } as const,
		};

		assertType(() =>
			// @ts-expect-error — `bogus` is not a variant group
			recipe(unknownDefault),
		);
		assertType(() =>
			// @ts-expect-error — `bogus` is not a variant group
			recipe(unknownCompound),
		);
	});

	test('rejects an unknown group in a compound variant built by a helper', () => {
		const entry = () => ({ style: {}, variants: { bogus: 'x' as const, size: 'small' as const } });

		assertType(() =>
			recipe({
				// @ts-expect-error — `bogus` is not a variant group
				compoundVariants: [entry()],
				variants: { size: { small: {} } },
			}),
		);
	});

	test('rejects an unknown group in a predeclared slotted config', () => {
		const unknownDefault = {
			defaultVariants: { bogus: 'x', size: 'small' },
			slots: { root: {} },
			variants: { size: { small: { root: {} } } },
		} as const satisfies SlottedConfigInput;
		const unknownCompound = {
			compoundSlots: [{ slots: ['root'], style: {}, variants: { bogus: 'x', size: 'small' } }],
			slots: { root: {} },
			variants: { size: { small: { root: {} } } },
		} as const satisfies SlottedConfigInput;

		assertType(() =>
			// @ts-expect-error — `bogus` is not a variant group
			recipe(unknownDefault),
		);
		assertType(() =>
			// @ts-expect-error — `bogus` is not a variant group
			recipe(unknownCompound),
		);
	});

	test('rejects any group on a recipe without variants', () => {
		const singlePartDefault = { base: {}, defaultVariants: { bogus: 'x' } } as const;
		const slottedDefault = {
			defaultVariants: { bogus: 'x' },
			slots: { root: {} },
		} as const satisfies SlottedConfigInput;

		assertType(() =>
			// @ts-expect-error — the recipe has no variant groups
			recipe(singlePartDefault),
		);
		assertType(() =>
			// @ts-expect-error — the recipe has no variant groups
			recipe(slottedDefault),
		);
		assertType(() =>
			// @ts-expect-error — the recipe has no variant groups
			recipe({ base: {} })({ bogus: 'x' }),
		);
		assertType(() =>
			// @ts-expect-error — the recipe has no variant groups
			recipe({ slots: { root: {} } })({ bogus: 'x' }),
		);
	});

	test('rejects an unknown group in a selection', () => {
		assertType(() =>
			// @ts-expect-error — `bogus` is not a variant group
			recipe(singlePart)({ bogus: 'x', size: 'small' }),
		);
		assertType(() =>
			// @ts-expect-error — `bogus` is not a variant group
			recipe(slotted)({ bogus: 'x', size: 'small' }),
		);
	});

	test('rejects an unknown key in predeclared withDefaultVariants defaults', () => {
		const defaults = { bogus: 'x', size: 'small' } as const;

		assertType(() =>
			// @ts-expect-error — `bogus` is not a variant group
			withDefaultVariants(recipe(singlePart), defaults),
		);
	});
});
