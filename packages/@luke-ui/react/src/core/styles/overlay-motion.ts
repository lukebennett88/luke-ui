import type { StyleRule } from '@vanilla-extract/css';
import { vars } from '../../theme/contract.css.js';

/*
 * Overlays take the enter and exit duration roles rather than the in-place feedback one. Entry
 * decelerates with the standard easing curve, while exit accelerates with the exit curve.
 *
 * `overlayMotion` builds the whole motion block for a React Aria overlay element: the rest
 * transition, the hidden values on `[data-entering]` and `[data-exiting]`, and the exit transition
 * on `[data-exiting]`. Under `prefers-reduced-motion: reduce` it resets `transition: none` on the
 * class and on each state selector. Those selectors set their own `transition`, so they outrank the
 * plain class rule and keep animating when only the class rule is reset. Generating the block here
 * keeps that repetition from being forgotten at a call site.
 *
 * The docs app keeps its own copy of this helper in `apps/docs/src/lib/overlay-motion.ts`, because
 * it cannot import this private module. The two copies share one API. The docs copy adds `pseudo`,
 * which moves the motion onto a `::before` scrim.
 */

type OverlayRule = Omit<StyleRule, 'transition'>;
type Selectors = NonNullable<StyleRule['selectors']>;
type MediaRules = NonNullable<StyleRule['@media']>;

// The value types are aliases rather than interfaces. A recipe config that infers its type from
// `overlayMotion` can inline an alias in its declaration file, but it cannot name a private
// interface from this module.

/** The values an overlay animates from on enter and to on exit. */
type OverlayHiddenValues = {
	opacity?: 0;
	translate?: string;
};

/** The values a reduced-motion overlay holds in place of `OverlayHiddenValues`. */
type OverlayVisibleValues = {
	opacity?: 1;
	translate?: 'none';
};

/**
 * Rejects top-level keys of `Rule` that `OverlayRule` does not declare, such as `transition` or a
 * misspelt property. An inferred type parameter skips the excess property check on its own.
 */
type KnownKeysOnly<Rule> = Record<Exclude<keyof Rule, keyof OverlayRule>, never>;

interface OverlayMotionOptions<Rule extends OverlayRule> {
	/** The values the overlay holds while hidden. Reduced motion shows `opacity: 1` and `translate: none`. */
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
 * the overlay duration roles, and reduced motion turns the transition off. The caller's
 * `selectors` and `@media` entries are merged into the generated ones, and declaring the same
 * property twice on one selector or media query throws, so no declaration is lost silently.
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
	const visible: OverlayVisibleValues = {
		...(hidden.opacity === undefined ? {} : { opacity: 1 }),
		...(hidden.translate === undefined ? {} : { translate: 'none' }),
	};
	const enterTransition = transitionFor(
		properties,
		vars.motion.duration.enter,
		vars.motion.easing.standard,
	);
	const exitTransition = transitionFor(
		properties,
		vars.motion.duration.exit,
		vars.motion.easing.exit,
	);
	const generatedSelectors = {
		'&[data-entering]': hidden,
		'&[data-exiting]': { ...hidden, transition: exitTransition },
	} satisfies Selectors;
	const generatedMedia = {
		'(prefers-reduced-motion: reduce)': {
			transition: 'none',
			selectors: {
				'&[data-entering]': { ...visible, transition: 'none' },
				'&[data-exiting]': { ...visible, transition: 'none' },
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
