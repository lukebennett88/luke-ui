import { vars } from '@luke-ui/react/theme';
import type { StyleRule } from '@vanilla-extract/css';

type Selectors = NonNullable<StyleRule['selectors']>;
type MediaRules = NonNullable<StyleRule['@media']>;

interface HiddenValues {
	opacity?: 0;
	translate?: string;
}

interface OverlayMotionOptions {
	/**
	 * The values React Aria's `data-entering` and `data-exiting` states hold while hidden. Reduced
	 * motion keeps `opacity` and replaces `translate` with `none`.
	 */
	hidden: HiddenValues;
	/** The CSS properties that animate. Each takes the same enter and exit timing. */
	properties: ReadonlyArray<string>;
	/** Moves the motion onto this pseudo-element, for a scrim drawn on `::before`. */
	pseudo?: '::before';
	/**
	 * The rest of the overlay's rule. Its `selectors` and `@media` entries merge into the generated
	 * ones that share a key. Declaring a property the helper already sets on the same selector or
	 * media query throws instead of overwriting it.
	 */
	rule: Omit<StyleRule, 'transition'>;
}

/**
 * A complete style rule for a React Aria overlay, popover or modal, with motion applied to `rule`.
 * Entry decelerates with the standard curve over the enter duration, and exit accelerates with the
 * exit curve over the exit duration.
 *
 * This is a copy of the package's private `overlay-motion.ts`, which the docs app cannot import.
 * The two share one API, and this copy adds `pseudo`.
 *
 * Under `prefers-reduced-motion: reduce` an overlay keeps its opacity fade and loses its movement:
 * the transitions cover only `opacity`, and both state selectors set `translate: none`. An overlay
 * that does not fade gets `transition: none`. The `data-exiting` selector sets its own
 * `transition`, so it outranks the plain rule and needs its own reduced-motion value.
 */
export function overlayMotion({
	hidden,
	properties,
	pseudo,
	rule,
}: OverlayMotionOptions): StyleRule {
	const enter = transitionFor(properties, vars.motion.duration.enter, vars.motion.easing.standard);
	const exit = transitionFor(properties, vars.motion.duration.exit, vars.motion.easing.exit);
	const fades = hidden.opacity !== undefined;
	const reducedEnter = fades
		? transitionFor(['opacity'], vars.motion.duration.enter, vars.motion.easing.standard)
		: 'none';
	const reducedExit = fades
		? transitionFor(['opacity'], vars.motion.duration.exit, vars.motion.easing.exit)
		: 'none';

	const suffix = pseudo ?? '';
	const enteringSelector = `&[data-entering]${suffix}`;
	const exitingSelector = `&[data-exiting]${suffix}`;
	const generatedSelectors: Selectors = {
		[enteringSelector]: hidden,
		[exitingSelector]: { ...hidden, transition: exit },
	};
	const reducedSelectors: Selectors = {
		[enteringSelector]: { translate: 'none' },
		[exitingSelector]: { transition: reducedExit, translate: 'none' },
	};
	if (pseudo) {
		generatedSelectors['&::before'] = { transition: enter };
		reducedSelectors['&::before'] = { transition: reducedEnter };
	}
	const generatedMedia: MediaRules = {
		'(prefers-reduced-motion: reduce)': {
			...(pseudo ? {} : { transition: reducedEnter }),
			selectors: reducedSelectors,
		},
	};

	return {
		...rule,
		...(pseudo ? {} : { transition: enter }),
		selectors: mergeRules(generatedSelectors, rule.selectors, 'selector'),
		'@media': mergeRules(generatedMedia, rule['@media'], 'media query'),
	};
}

function transitionFor(
	properties: ReadonlyArray<string>,
	duration: string,
	easing: string,
): string {
	return properties.map((property) => `${property} ${duration} ${easing}`).join(', ');
}

function mergeRules<Rule extends object>(
	generated: Record<string, Rule>,
	extra: Record<string, Rule> | undefined,
	label: string,
): Record<string, Rule> {
	const merged = { ...generated };
	for (const [key, rule] of Object.entries(extra ?? {})) {
		const existing = merged[key];
		for (const property of Object.keys(rule)) {
			if (existing && property in existing) {
				throw new Error(`overlayMotion already sets "${property}" on the ${label} "${key}".`);
			}
		}
		merged[key] = { ...existing, ...rule };
	}
	return merged;
}
