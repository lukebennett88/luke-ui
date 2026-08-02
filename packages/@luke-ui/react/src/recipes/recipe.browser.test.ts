import { expect, expectTypeOf, test } from 'vite-plus/test';
import type { ComboboxVariants } from './combobox.css.js';
import { field } from './field.css.js';
import { inputGroup } from './input-group.css.js';
import {
	nestedArrayFixtureClassA,
	nestedArrayFixtureClassB,
	nestedArrayFixtureRecipe,
} from './recipe.fixtures.css.js';

// The public recipe surface: `field` and `inputGroup` from `@luke-ui/react/recipes`.

test('field selects variants at the outer call and returns slot functions', () => {
	const slots = field({ necessityIndicator: 'icon', tone: 'error' });

	expect(typeof slots.root()).toBe('string');
	expect(typeof slots.label()).toBe('string');
	expect(typeof slots.message()).toBe('string');
});

test('base composes a nested class array alongside a style object', () => {
	const className = nestedArrayFixtureRecipe();
	const classes = className.split(' ');

	expect(classes).toContain(nestedArrayFixtureClassA);
	expect(classes).toContain(nestedArrayFixtureClassB);

	const element = document.body.appendChild(document.createElement('div'));
	element.className = className;
	const style = getComputedStyle(element);

	expect(style.backgroundColor).toBe('rgb(4, 5, 6)');
	expect(style.color).toBe('rgb(1, 2, 3)');
	expect(style.fontWeight).toBe('700');

	element.remove();
});

test('slot functions merge an optional extra class', () => {
	expect(field().root('extra-class').split(' ')).toContain('extra-class');
	expect(inputGroup({ size: 'small' }).control('mine').split(' ')).toContain('mine');
});

// Type assertions are compile-time only.
// oxlint-disable-next-line vitest/expect-expect
test('outer variant selection accepts known variants and rejects siblings/unknowns', () => {
	expectTypeOf(field).toBeCallableWith({ necessityIndicator: 'icon', tone: 'description' });
	expectTypeOf(inputGroup).toBeCallableWith({ size: 'medium' });

	// @ts-expect-error `size` belongs to input-group/combobox, not field.
	field({ size: 'small' });
	// @ts-expect-error `icon`/`label` are the only necessity indicators.
	field({ necessityIndicator: 'asterisk' });
	// @ts-expect-error `tone` is a field variant, not an input-group one.
	inputGroup({ tone: 'error' });
	// @ts-expect-error `large` is not an input-group size.
	inputGroup({ size: 'large' });
});

// Type assertions are compile-time only.
// oxlint-disable-next-line vitest/expect-expect
test('slot functions take only an optional class string, never variant args', () => {
	const slots = field({ tone: 'error' });

	expectTypeOf(slots.root).toBeCallableWith('extra');
	expectTypeOf(slots.root).toBeCallableWith();

	// Negative cases are compile-time only; this closure is never called so the
	// invalid arguments are type-checked without reaching `cx` at runtime.
	const rejectsVariantArgs = () => {
		// @ts-expect-error Slot functions do not accept variant selections.
		slots.root({ tone: 'error' });
		// @ts-expect-error Slot functions take a class string, not a number.
		slots.label(42);
	};
	void rejectsVariantArgs;
});

// Type assertions are compile-time only.
// oxlint-disable-next-line vitest/expect-expect
test('internal ComboboxVariants type is the combobox size selection', () => {
	const variants: ComboboxVariants = { size: 'medium' };
	expectTypeOf(variants.size).toEqualTypeOf<'medium' | 'small' | undefined>();
});
