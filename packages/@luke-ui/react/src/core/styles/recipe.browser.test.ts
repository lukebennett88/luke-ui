import { afterEach, expect, test } from 'vite-plus/test';
import { fieldRecipe } from '../primitives/field/recipe.css.js';
import { inputGroupRecipe } from '../primitives/input-group/recipe.css.js';
import {
	compoundSlotsRecipe,
	compoundSlotsPrecedenceRecipe,
	conditionalSlotsBaseRecipe,
	compoundSlotsOrderRecipe,
	nestedArrayFixtureClassA,
	nestedArrayFixtureClassB,
	nestedArrayFixtureRecipe,
	omittedVariantsRecipe,
	prebuiltClassSinglePartRecipe,
	prebuiltVariantClass,
	realVariantsRecipe,
	slotVariantPrecedenceRecipe,
	untargetedSlotPrecedenceRecipe,
} from './recipe.fixtures.css.js';

// Field and input-group recipes export from their primitive entrypoints.

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

/** All CSS text currently injected into the document, across every `<style>` tag. */
function injectedCss(): string {
	return Array.from(document.querySelectorAll('style'))
		.map((styleElement) => styleElement.textContent ?? '')
		.join('\n');
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

test('a base-only recipe composes a consumer className', () => {
	const own = omittedVariantsRecipe();

	expect(omittedVariantsRecipe({ className: 'mine' })).toBe(`${own} mine`);
	expect(omittedVariantsRecipe({})).toBe(own);
});

test('slot functions append a consumer className', () => {
	const ownRoot = fieldRecipe().root();
	const ownControl = inputGroupRecipe({ size: 'small' }).control();

	expect(fieldRecipe().root({ className: 'extra-class' })).toBe(`${ownRoot} extra-class`);
	expect(inputGroupRecipe({ size: 'small' }).control({ className: 'mine' })).toBe(
		`${ownControl} mine`,
	);
	expect(fieldRecipe().root({})).toBe(ownRoot);
});

test('an unconditional compoundSlots entry applies to every listed slot and not to unlisted ones', () => {
	const recipeSlots = compoundSlotsRecipe({ tone: 'neutral' });
	const a = mountProbe(recipeSlots.a());
	const b = mountProbe(recipeSlots.b());
	const c = mountProbe(recipeSlots.c());

	expect(getComputedStyle(a).color).toBe('rgb(110, 110, 110)');
	expect(getComputedStyle(b).color).toBe('rgb(100, 100, 100)');
	expect(getComputedStyle(c).color).toBe('rgb(30, 30, 30)');
});

test('a conditional compoundSlots entry applies only for the matching variant selection', () => {
	const accentSlots = compoundSlotsRecipe({ tone: 'accent' });
	const neutralSlots = compoundSlotsRecipe({ tone: 'neutral' });

	const accentA = mountProbe(accentSlots.a());
	const neutralA = mountProbe(neutralSlots.a());

	expect(getComputedStyle(accentA).backgroundColor).toBe('rgb(200, 200, 200)');
	expect(getComputedStyle(neutralA).backgroundColor).not.toBe('rgb(200, 200, 200)');
});

test('a conditional compoundSlots entry can name a variant group the slot does not otherwise use', () => {
	const medium = compoundSlotsRecipe({ size: 'medium', tone: 'neutral' });
	const small = compoundSlotsRecipe({ size: 'small', tone: 'neutral' });

	const mediumB = mountProbe(medium.b());
	const mediumC = mountProbe(medium.c());
	const smallB = mountProbe(small.b());
	const smallC = mountProbe(small.c());

	expect(getComputedStyle(mediumB).fontWeight).toBe('700');
	expect(getComputedStyle(mediumC).fontWeight).toBe('700');
	expect(getComputedStyle(smallB).fontWeight).not.toBe('700');
	expect(getComputedStyle(smallC).fontWeight).not.toBe('700');
});

test('a compoundSlots style overrides the slot base, and a conditional one overrides the slot variant', () => {
	const element = mountProbe(compoundSlotsRecipe({ size: 'medium', tone: 'neutral' }).a());

	expect(getComputedStyle(element).color).toBe('rgb(110, 110, 110)');
	expect(getComputedStyle(element).fontWeight).toBe('700');
});

test('declaration order between two compoundSlots entries targeting one slot', () => {
	const element = mountProbe(compoundSlotsRecipe({ tone: 'neutral' }).a());

	expect(getComputedStyle(element).color).toBe('rgb(110, 110, 110)');
});

test('an unconditional compoundSlots style shared by two slots is emitted only once', () => {
	const recipeSlots = compoundSlotsRecipe({ tone: 'neutral' });

	const aClassName = recipeSlots.a();
	const bClassName = recipeSlots.b();

	const declarationOccurrences = (injectedCss().match(/color: rgb\(100, 100, 100\);/g) ?? [])
		.length;
	expect(declarationOccurrences).toBe(1);

	const sharedClassName = aClassName
		.split(' ')
		.find((name) => bClassName.split(' ').includes(name));
	expect(sharedClassName).toBeDefined();
});

test('an unconditional compoundSlots entry does not add its shared class to an untargeted slot', () => {
	const recipeSlots = compoundSlotsRecipe({ tone: 'neutral' });

	const aClasses = recipeSlots.a().split(' ');
	const cClasses = recipeSlots.c().split(' ');

	const leaked = aClasses.filter((name) => cClasses.includes(name));
	expect(leaked).toEqual([]);
});

test('conditional shared styles override the base without an unconditional entry', () => {
	const element = mountProbe(conditionalSlotsBaseRecipe({ tone: 'accent' }).root());

	expect(getComputedStyle(element).color).toBe('rgb(2, 2, 2)');
});

test('variants override unconditional shared styles and conditional shared styles override both', () => {
	const neutral = mountProbe(
		compoundSlotsPrecedenceRecipe({ appearance: 'solid', size: 'medium', tone: 'neutral' }).root(),
	);
	const accent = mountProbe(
		compoundSlotsPrecedenceRecipe({ appearance: 'solid', size: 'medium', tone: 'accent' }).root(),
	);

	expect(getComputedStyle(neutral).fontWeight).toBe('400');
	expect(getComputedStyle(accent).fontWeight).toBe('500');
	expect(getComputedStyle(accent).color).toBe('rgb(3, 3, 3)');
});

test('a slot variant style outranks an unconditional shared style and loses to a conditional one', () => {
	const neutral = mountProbe(
		slotVariantPrecedenceRecipe({ emphasis: 'strong', tone: 'neutral' }).root(),
	);
	const accent = mountProbe(
		slotVariantPrecedenceRecipe({ emphasis: 'strong', tone: 'accent' }).root(),
	);

	expect(getComputedStyle(neutral).color).toBe('rgb(41, 41, 41)');
	expect(getComputedStyle(accent).color).toBe('rgb(43, 43, 43)');
});

test('a single-part recipe still composes a pre-built class as a variant style', () => {
	const className = prebuiltClassSinglePartRecipe({ emphasis: 'strong' });

	expect(className.split(' ')).toContain(prebuiltVariantClass);
});

test('a slot no compoundSlots entry names keeps the documented precedence', () => {
	const accent = untargetedSlotPrecedenceRecipe({ emphasis: 'strong', tone: 'accent' });
	const neutral = untargetedSlotPrecedenceRecipe({ emphasis: 'strong', tone: 'neutral' });

	// The conditional shared class is whatever `targeted` gains from selecting `tone: 'accent'`.
	const neutralTargeted = neutral.targeted().split(' ');
	const sharedConditionalClass = accent
		.targeted()
		.split(' ')
		.find((name) => !neutralTargeted.includes(name));
	expect(sharedConditionalClass).toBeDefined();

	const targeted = mountProbe(accent.targeted());
	// Compose the untargeted slot's own classes with the conditional shared class, so the resolved
	// colour reports which of the two was emitted last.
	const untargeted = mountProbe(`${neutral.untargeted()} ${sharedConditionalClass}`);

	expect(getComputedStyle(targeted).color).toBe('rgb(52, 52, 52)');
	expect(getComputedStyle(untargeted).color).toBe('rgb(52, 52, 52)');
});

test('shared styles follow entry order regardless of slot declaration order', () => {
	const slots = compoundSlotsOrderRecipe({ tone: 'accent' });
	const first = mountProbe(slots.first());
	const second = mountProbe(slots.second());

	for (const element of [first, second]) {
		expect(getComputedStyle(element).fontWeight).toBe('500');
		expect(getComputedStyle(element).color).toBe('rgb(2, 2, 2)');
	}
});
