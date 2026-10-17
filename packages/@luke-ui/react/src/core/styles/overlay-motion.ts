import type { StyleRule } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';

/*
 * Overlays take the enter and exit motion treatments rather than the in-place feedback one.
 *
 * `overlayMotion` builds the whole motion block for a React Aria overlay element: the rest
 * transition, the hidden values on `[data-entering]` and `[data-exiting]`, and the exit transition
 * on `[data-exiting]`. Under `prefers-reduced-motion: reduce` an overlay keeps its opacity fade and
 * loses its movement: the transitions cover only `opacity`, and both state selectors set
 * `translate: none`. An overlay that does not fade gets `transition: none`. `[data-exiting]` sets
 * its own `transition`, so it outranks the plain class rule and needs its own reduced-motion value.
 * Generating the block here keeps that repetition from being forgotten at a call site.
 *
 * The docs app keeps its own copy of this helper in `apps/docs/src/lib/overlay-motion.ts`, because
 * it cannot import this private module. The two copies share one API. The docs copy adds `pseudo`,
 * which moves the motion onto a `::before` scrim.
 */

type OverlayRule = Omit<StyleRule, 'transition'>;
type Selectors = NonNullable<StyleRule['selectors']>;
type MediaRules = NonNullable<StyleRule['@media']>;

// The hidden values type is an alias rather than an interface. A recipe config that infers its
// type from `overlayMotion` can inline an alias in its declaration file, but it cannot name a
// private interface from this module.

/** The values an overlay animates from on enter and to on exit. */
type OverlayHiddenValues = {
	opacity?: 0;
	translate?: string;
};

/**
 * Rejects top-level keys of `Rule` that `OverlayRule` does not declare, such as `transition` or a
 * misspelt property. An inferred type parameter skips the excess property check on its own.
 */
type KnownKeysOnly<Rule> = Record<Exclude<keyof Rule, keyof OverlayRule>, never>;

interface OverlayMotionOptions<Rule extends OverlayRule> {
	/**
	 * The values the overlay holds while hidden. Reduced motion keeps `opacity` and replaces
	 * `translate` with `none`.
	 */
	hidden: OverlayHiddenValues;
	/** The CSS properties that transition between hidden and visible. */
	properties: ReadonlyArray<string>;
	/**
	 * The rest of the overlay's rule. Its `selectors` and `@media` entries merge into the generated
	 * ones that share a key. Declaring a property the helper already sets on the same selector or
	 * media query throws instead of overwriting it.
	 */
	rule: Rule & KnownKeysOnly<Rule>;
}

function transitionFor(
	properties: ReadonlyArray<string>,
	duration: string,
	easing: string,
): string {
	return properties.map((property) => `${property} ${duration} ${easing}`).join(', ');
}

/**
 * Merges `extra` into `generated` one key at a time. The result is typed as `generated` alone, and
 * the caller's entries reach the overlay rule's type through the spread of `rule`.
 */
function mergeRules<Generated extends Record<string, object>>(
	generated: Generated,
	extra: Readonly<Record<string, object>> | undefined,
	label: string,
): Generated {
	const merged = { ...generated };
	for (const [key, rule] of Object.entries(extra ?? {})) {
		const existing: object | undefined = merged[key];
		for (const property of Object.keys(rule)) {
			if (existing && property in existing) {
				throw new Error(`overlayMotion already sets "${property}" on the ${label} "${key}".`);
			}
		}
		Object.assign(merged, { [key]: { ...existing, ...rule } });
	}
	return merged;
}

/**
 * A complete style rule for an overlay element, with motion applied to `rule`. Entry and exit use
 * the matching motion treatments. Reduced motion keeps the opacity fade and drops movement. The
 * caller's `selectors` and `@media` entries are merged into the generated ones, and declaring the
 * same property twice on one selector or media query throws, so no declaration is lost silently.
 *
 * The result keeps the literal type of `rule` instead of widening to `StyleRule`. A declaration
 * file that infers a recipe config from it then inlines that shape and does not import
 * `@vanilla-extract/css`.
 */
export function overlayMotion<const Rule extends OverlayRule>({
	hidden,
	properties,
	rule,
}: OverlayMotionOptions<Rule>) {
	const enterTransition = transitionFor(
		properties,
		vars.motion.enter.duration,
		vars.motion.enter.easing,
	);
	const exitTransition = transitionFor(
		properties,
		vars.motion.exit.duration,
		vars.motion.exit.easing,
	);
	const generatedSelectors = {
		'&[data-entering]': hidden,
		'&[data-exiting]': { ...hidden, transition: exitTransition },
	} satisfies Selectors;
	const fades = hidden.opacity !== undefined;
	const reducedEnterTransition = fades
		? transitionFor(['opacity'], vars.motion.enter.duration, vars.motion.enter.easing)
		: 'none';
	const reducedExitTransition = fades
		? transitionFor(['opacity'], vars.motion.exit.duration, vars.motion.exit.easing)
		: 'none';
	const generatedMedia = {
		'(prefers-reduced-motion: reduce)': {
			transition: reducedEnterTransition,
			selectors: {
				'&[data-entering]': { translate: 'none' },
				'&[data-exiting]': { transition: reducedExitTransition, translate: 'none' },
			},
		},
	} satisfies MediaRules;

	return {
		...rule,
		transition: enterTransition,
		selectors: mergeRules(generatedSelectors, rule.selectors, 'selector'),
		'@media': mergeRules(generatedMedia, rule['@media'], 'media query'),
	} satisfies StyleRule;
}
