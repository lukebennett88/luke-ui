import { assignInlineVars } from '@vanilla-extract/dynamic';
import { typedEntries } from '../../shared/utils/utils.js';
import type { ResponsiveCondition } from './responsive-conditions.js';
import { responsiveConditions } from './responsive-conditions.js';
import type { ResponsivePropValue } from './responsive.js';

type ResponsiveCssProperty = {
	classes: Record<ResponsiveCondition, string>;
	vars: Record<ResponsiveCondition, string>;
};

type ResolveOptions<Value> = {
	expectedValueDescription?: string;
	isValid?: (value: Value) => boolean;
	propName: string;
} & FormatOption<Value>;

/** `String` formats strings and numbers. Any other value needs its own `format`. */
type FormatOption<Value> = [Value] extends [string | number]
	? { format?: (value: Value) => string }
	: { format: (value: Value) => string };

/**
 * Applies classes and inline CSS variables for a responsive value built with
 * `createResponsiveCssProperty`. An array is a direct value. Any other object is a responsive
 * object keyed by breakpoint. An invalid breakpoint value is reported and skipped, so the previous
 * valid breakpoint still applies.
 */
export function resolveResponsiveCssProperty<Value>(
	value: ResponsivePropValue<Value>,
	property: ResponsiveCssProperty,
	options: ResolveOptions<Value>,
): { className: string; style: Record<string, string> } {
	const format: (value: Value) => string = options.format ?? String;
	const isValid = options.isValid ?? (() => true);
	const styleVars: Record<string, string> = {};
	const classNames: Array<string> = [];

	function assignCondition(condition: ResponsiveCondition, conditionValue: Value): void {
		if (!isValid(conditionValue)) {
			// oxlint-disable-next-line no-console -- match Rainbow Sprinkles invalid-value reporting
			console.error(
				`Invalid value provided to '${options.propName}'. Expected ${options.expectedValueDescription ?? 'a valid value'}. Received: ${JSON.stringify(conditionValue)}.`,
			);
			return;
		}
		styleVars[property.vars[condition]] = format(conditionValue);
		classNames.push(property.classes[condition]);
	}

	if (typeof value !== 'object' || Array.isArray(value)) {
		assignCondition('initial', value as Value);
	} else {
		const conditionValues = value as Partial<Record<ResponsiveCondition, Value | null>>;
		for (const [condition, conditionValue] of typedEntries(conditionValues)) {
			if (!isResponsiveCondition(condition) || conditionValue == null) continue;
			assignCondition(condition, conditionValue);
		}
	}

	return {
		className: classNames.join(' '),
		style: assignInlineVars(styleVars),
	};
}

function isResponsiveCondition(value: string): value is ResponsiveCondition {
	return Object.hasOwn(responsiveConditions, value);
}
