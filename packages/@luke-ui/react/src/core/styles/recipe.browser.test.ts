import { afterEach, expect, test } from 'vite-plus/test';
import { fieldRecipe } from '../primitives/field/recipe.css.js';
import { textInputRecipe } from '../primitives/text-input/recipe.css.js';
import {
	defaultedVariantsRecipe,
	nestedArrayFixtureClassA,
	nestedArrayFixtureClassB,
	nestedArrayFixtureRecipe,
	omittedVariantsRecipe,
	prebuiltClassSinglePartRecipe,
	prebuiltVariantClass,
	realVariantsRecipe,
	slottedPrecedenceRecipe,
} from './recipe.fixtures.css.js';

// Field and text input recipes export from their primitive entrypoints.

const mounted: Array<HTMLElement> = [];

afterEach(() => {
	for (const element of mounted) element.remove();
	mounted.length = 0;
});

function mountProbe(className: string): HTMLDivElement {
	const element = document.body.appendChild(document.createElement('div'));
	mounted.push(element);
	element.className = className;
	return element;
}

test('base composes a nested class array alongside a style object', () => {
	const className = nestedArrayFixtureRecipe();
	const classes = className.split(' ');

	expect(classes).toContain(nestedArrayFixtureClassA);
	expect(classes).toContain(nestedArrayFixtureClassB);
});

test('a single-part recipe appends a consumer className after its own classes', () => {
	const own = realVariantsRecipe({ size: 'small' });
	const composed = realVariantsRecipe({ className: 'mine', size: 'small' });

	expect(composed).toBe(`${own} mine`);
});

test('a single-part recipe returns only its own classes when className is omitted', () => {
	const withoutKey = realVariantsRecipe({ size: 'small' });
	const undefinedKey = realVariantsRecipe({ className: undefined, size: 'small' });
	const bare = realVariantsRecipe();

	expect(undefinedKey).toBe(withoutKey);
	expect(bare.split(' ')).not.toContain('undefined');
	expect(bare.endsWith(' ')).toBe(false);
});

test('withDefaultVariants keeps a default when the input explicitly passes undefined', () => {
	expect(defaultedVariantsRecipe({ size: undefined })).toBe(defaultedVariantsRecipe());
	expect(defaultedVariantsRecipe({ size: 'small' })).not.toBe(defaultedVariantsRecipe());
});

test('a base-only recipe composes a consumer className', () => {
	const own = omittedVariantsRecipe();

	expect(omittedVariantsRecipe({ className: 'mine' })).toBe(`${own} mine`);
	expect(omittedVariantsRecipe({})).toBe(own);
});

test('slot functions append a consumer className', () => {
	const ownRoot = fieldRecipe().root();

	expect(fieldRecipe().root({ className: 'extra-class' })).toBe(`${ownRoot} extra-class`);
	expect(fieldRecipe().root({})).toBe(ownRoot);
});

test('textInputRecipe styles a standalone input and appends a consumer className', () => {
	const medium = textInputRecipe({ size: 'medium' });

	expect(textInputRecipe()).toBe(medium);
	expect(textInputRecipe({ size: 'small' })).not.toBe(medium);
	expect(textInputRecipe({ className: 'mine', size: 'medium' })).toBe(`${medium} mine`);
});

test('a slot variant overrides its slot base', () => {
	const base = mountProbe(slottedPrecedenceRecipe().first());
	const strong = mountProbe(slottedPrecedenceRecipe({ emphasis: 'strong' }).first());

	expect(getComputedStyle(base).color).toBe('rgb(10, 10, 10)');
	expect(getComputedStyle(strong).color).toBe('rgb(11, 11, 11)');
});

test('every slot base is emitted before any slot variant', () => {
	const plain = slottedPrecedenceRecipe();
	const strong = slottedPrecedenceRecipe({ emphasis: 'strong' });

	// The variant classes are whatever `first` gains from selecting `emphasis: 'strong'`.
	const firstBase = plain.first().split(' ');
	const firstVariantClasses = strong
		.first()
		.split(' ')
		.filter((name) => !firstBase.includes(name));
	expect(firstVariantClasses.length).toBeGreaterThan(0);

	// Compose another slot's base with those classes, so the resolved colour reports which of the two
	// was emitted last. Emitting slot by slot would let `second`'s base win.
	const probe = mountProbe([plain.second(), ...firstVariantClasses].join(' '));

	expect(getComputedStyle(probe).color).toBe('rgb(11, 11, 11)');
});

test('a single-part recipe still composes a pre-built class as a variant style', () => {
	const className = prebuiltClassSinglePartRecipe({ emphasis: 'strong' });

	expect(className.split(' ')).toContain(prebuiltVariantClass);
});
