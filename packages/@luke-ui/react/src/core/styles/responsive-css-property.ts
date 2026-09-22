import { assignInlineVars } from '@vanilla-extract/dynamic';
import { typedEntries } from '../../shared/utils/utils.js';
import type { ResponsiveCondition } from './responsive-conditions.js';
import { responsiveConditions } from './responsive-conditions.js';
import type { RequiredInitialResponsiveValue } from './responsive.js';

type ResponsiveCssProperty = {
	classes: Record<ResponsiveCondition, string>;
	vars: Record<ResponsiveCondition, string>;
};

/**
 * Applies classes and inline CSS variables for a responsive value built with
 * `createResponsiveCssProperty`.
 */
export function resolveResponsiveCssProperty(
	value: RequiredInitialResponsiveValue<string | number>,
	property: ResponsiveCssProperty,
	options: {
		expectedValueDescription?: string;
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
			options.expectedValueDescription,
			options.propName,
			styleVars,
			classNames,
		);
	} else {
		for (const [condition, conditionValue] of typedEntries(value)) {
			if (!isResponsiveCondition(condition) || conditionValue == null) continue;
			assignCondition(
				condition,
				conditionValue,
				property,
				format,
				isValid,
				options.expectedValueDescription,
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

function isResponsiveCondition(value: string): value is ResponsiveCondition {
	return Object.hasOwn(responsiveConditions, value);
}

function assignCondition(
	condition: ResponsiveCondition,
	conditionValue: string | number,
	property: ResponsiveCssProperty,
	format: (value: string | number) => string,
	isValid: (value: string | number) => boolean,
	expectedValueDescription: string | undefined,
	propName: string,
	styleVars: Record<string, string>,
	classNames: Array<string>,
): void {
	if (!isValid(conditionValue)) {
		// oxlint-disable-next-line no-console -- match Rainbow Sprinkles invalid-value reporting
		console.error(
			`Invalid value provided to '${propName}'. Expected ${expectedValueDescription ?? 'a valid value'}. Received: ${JSON.stringify(conditionValue)}.`,
		);
		return;
	}
	styleVars[property.vars[condition]] = format(conditionValue);
	classNames.push(property.classes[condition]);
}
