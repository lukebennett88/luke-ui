import { assignInlineVars } from '@vanilla-extract/dynamic';
import { typedEntries } from '../../shared/utils/utils.js';
import { responsiveStyleConditions } from './create-responsive-css-property.js';
import type { ResponsiveStyleBreakpoint } from './create-responsive-css-property.js';
import type { RequiredInitialResponsiveValue } from './responsive.js';

type ResponsiveCssProperty = {
	classes: Record<ResponsiveStyleBreakpoint, string>;
	vars: Record<ResponsiveStyleBreakpoint, string>;
};

/**
 * Applies classes and inline CSS variables for a responsive value built with
 * `createResponsiveCssProperty`.
 */
export function resolveResponsiveCssProperty(
	value: RequiredInitialResponsiveValue<string | number>,
	property: ResponsiveCssProperty,
	options: {
		format?: (value: string | number) => string;
		isValid?: (value: string | number) => boolean;
		propName: string;
	},
): { className: string; style: Record<string, string> } {
	const format = options.format ?? String;
	const isValid = options.isValid ?? (() => true);
	const styleVars: Record<string, string> = {};
	const classNames: Array<string> = [];

	if (typeof value !== 'object') {
		assignCondition(
			'initial',
			value,
			property,
			format,
			isValid,
			options.propName,
			styleVars,
			classNames,
		);
	} else {
		for (const [condition, conditionValue] of typedEntries(value)) {
			if (!isResponsiveStyleBreakpoint(condition) || conditionValue == null) continue;
			assignCondition(
				condition,
				conditionValue,
				property,
				format,
				isValid,
				options.propName,
				styleVars,
				classNames,
			);
		}
	}

	return {
		className: classNames.join(' '),
		style: assignInlineVars(styleVars),
	};
}

function isResponsiveStyleBreakpoint(value: string): value is ResponsiveStyleBreakpoint {
	return Object.hasOwn(responsiveStyleConditions, value);
}

function assignCondition(
	condition: ResponsiveStyleBreakpoint,
	conditionValue: string | number,
	property: ResponsiveCssProperty,
	format: (value: string | number) => string,
	isValid: (value: string | number) => boolean,
	propName: string,
	styleVars: Record<string, string>,
	classNames: Array<string>,
): void {
	if (!isValid(conditionValue)) {
		// oxlint-disable-next-line no-console -- match Rainbow Sprinkles invalid-value reporting
		console.error(
			`Invalid value provided to '${propName}'. Expected a valid value. Received: ${JSON.stringify(conditionValue)}.`,
		);
		return;
	}
	styleVars[property.vars[condition]] = format(conditionValue);
	classNames.push(property.classes[condition]);
}
