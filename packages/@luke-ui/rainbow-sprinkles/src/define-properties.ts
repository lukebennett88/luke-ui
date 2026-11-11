import { createVar, style } from '@vanilla-extract/css';
import { orderPropertiesBySpecificity } from './property-specificity.js';
import type {
	CommonOptions,
	ConfigConditions,
	ConfigDynamicProperties,
	ConfigStaticProperties,
	DefinePropertiesReturn,
	MakeConfig,
	SprinkleProperties,
} from './types.js';

function mapValues<T extends Record<string, unknown>, R>(
	obj: T,
	callback: (value: T[keyof T], key: string, obj: T) => R,
): Record<string, R> {
	const result: Record<string, R> = {};
	for (const key in obj) {
		result[key] = callback(obj[key], key, obj);
	}
	return result;
}

type ConditionValue = {
	'@media'?: string;
	'@supports'?: string;
	'@container'?: string;
	selector?: string;
};

/**
 * Wrap a base style object in each active condition (media query, supports,
 * container, or selector) declared on the condition. Conditions nest in
 * declaration order, matching vanilla-extract's layered style rule shape.
 */
function wrapConditionStyle(
	base: Record<string, unknown>,
	condition: ConditionValue,
): Record<string, unknown> {
	let styleValue: Record<string, unknown> = base;
	if (condition['@media']) {
		styleValue = { '@media': { [condition['@media']]: styleValue } };
	}
	if (condition['@supports']) {
		styleValue = { '@supports': { [condition['@supports']]: styleValue } };
	}
	if (condition['@container']) {
		styleValue = { '@container': { [condition['@container']]: styleValue } };
	}
	if (condition.selector) {
		styleValue = { selectors: { [condition.selector]: styleValue } };
	}
	return styleValue;
}

/**
 * Declarations a property's rule adds alongside the property itself, keyed by custom property name.
 * It receives the value the rule sets the property to.
 */
export type Mirror = (value: string) => Record<string, string>;

/** Adds a mirror's custom properties to a rule that sets one property. */
function withMirror(
	property: string,
	value: string,
	mirror: Mirror | undefined,
): Record<string, unknown> {
	const rule: Record<string, unknown> = { [property]: value };
	if (mirror) rule.vars = mirror(value);
	return rule;
}

function createStyles(
	property: string,
	scale: Record<string, string> | true,
	conditions: ConfigConditions | undefined,
	defaultCondition: string,
	options: { '@layer'?: string; mirror?: Mirror } = {},
): {
	vars: { default: string } | { conditions: Record<string, string>; default: string };
	dynamic: { default: string } | { conditions: Record<string, string>; default: string };
	dynamicScale: Record<string, string> | true;
	name: string;
} {
	if (!conditions) {
		const cssVar = createVar(property);
		const styleValue = withMirror(property, cssVar, options.mirror);
		const className = style(
			options['@layer'] ? { '@layer': { [options['@layer']]: styleValue } } : styleValue,
			property,
		);
		return {
			dynamic: { default: className },
			dynamicScale: scale,
			name: property,
			vars: { default: cssVar },
		};
	}
	const vars = mapValues(conditions, (_, conditionName) => {
		return createVar(`${property}-${conditionName}`);
	});
	const classes = mapValues(conditions, (conditionValue, conditionName) => {
		const styleValue = wrapConditionStyle(
			withMirror(property, vars[conditionName]!, options.mirror),
			conditionValue,
		);
		return style(
			options['@layer'] ? { '@layer': { [options['@layer']]: styleValue } } : styleValue,
			`${property}-${conditionName}`,
		);
	});
	return {
		dynamic: { conditions: classes, default: classes[defaultCondition] ?? '' },
		dynamicScale: scale,
		name: property,
		vars: { conditions: vars, default: vars[defaultCondition] ?? '' },
	};
}

function createStaticStyles(
	property: string,
	scale: ReadonlyArray<string> | Record<string, string>,
	conditions: ConfigConditions | undefined,
	defaultCondition: string,
	options: { '@layer'?: string; mirror?: Mirror } = {},
): {
	values: Record<
		string,
		{ default: string } | { conditions: Record<string, string>; default: string }
	>;
	name: string;
	staticScale: ReadonlyArray<string> | Record<string, string>;
} {
	const scaleObj: Record<string, string> = Array.isArray(scale)
		? Object.assign({}, ...scale.map((s) => ({ [s]: s })))
		: scale;
	const layered = (styleValue: Record<string, unknown>) =>
		options['@layer'] ? { '@layer': { [options['@layer']]: styleValue } } : styleValue;
	if (!conditions) {
		const values = mapValues(scaleObj, (scaleValue, scaleKey) => ({
			default: style(
				layered(withMirror(property, scaleValue, options.mirror)),
				`${property}-${scaleKey}`,
			),
		}));
		return { name: property, staticScale: scale, values };
	}
	// Conditions are the outer loop, so every value's rule for a wider condition follows every
	// value's rule for the narrower ones. A responsive value then resolves in condition order.
	const classes: Record<string, Record<string, string>> = {};
	for (const [conditionName, conditionValue] of Object.entries(conditions)) {
		for (const [scaleKey, scaleValue] of Object.entries(scaleObj)) {
			const styleValue = wrapConditionStyle(
				withMirror(property, scaleValue, options.mirror),
				conditionValue,
			);
			(classes[scaleKey] ??= {})[conditionName] = style(
				layered(styleValue),
				`${property}-${scaleKey}-${conditionName}`,
			);
		}
	}
	const values = mapValues(classes, (conditionClasses) => ({
		conditions: conditionClasses,
		default: conditionClasses[defaultCondition] ?? '',
	}));
	return { name: property, staticScale: scale, values };
}

type DefinePropertiesOptions = CommonOptions & {
	conditions?: ConfigConditions;
	defaultCondition?: string;
	dynamicProperties?: ConfigDynamicProperties;
	mirrors?: Record<string, Mirror>;
	staticProperties?: ConfigStaticProperties;
};

export function defineProperties<
	const Dyn extends ConfigDynamicProperties | undefined = undefined,
	const Stat extends ConfigStaticProperties | undefined = undefined,
	const Cond extends ConfigConditions | undefined = undefined,
>(options: {
	'@layer'?: string;
	conditions?: Cond;
	defaultCondition?: string;
	dynamicProperties?: Dyn;
	/** Custom properties each property's rules also set. See `Mirror`. */
	mirrors?: Record<string, Mirror>;
	staticProperties?: Stat;
}): DefinePropertiesReturn<MakeConfig<Dyn, Stat, Cond>>;
export function defineProperties(options: DefinePropertiesOptions): DefinePropertiesReturn {
	const { conditions, dynamicProperties, staticProperties, defaultCondition } = options;
	const config: SprinkleProperties = {};
	const layerOptions = { '@layer': options['@layer'] };
	const mirrors = options.mirrors ?? {};
	const dynamicByName = new Map(Object.entries(dynamicProperties ?? {}));
	const staticByName = new Map(Object.entries(staticProperties ?? {}));
	const propertyNames = orderPropertiesBySpecificity([
		...new Set([...dynamicByName.keys(), ...staticByName.keys()]),
	]);

	for (const propertyName of propertyNames) {
		const dynamicScale = dynamicByName.get(propertyName);
		if (dynamicScale !== undefined) {
			config[propertyName] = createStyles(
				propertyName,
				dynamicScale as Record<string, string> | true,
				conditions,
				defaultCondition ?? '',
				{ ...layerOptions, mirror: mirrors[propertyName] },
			);
		}

		const staticScale = staticByName.get(propertyName);
		if (staticScale !== undefined) {
			const staticStyle = createStaticStyles(
				propertyName,
				staticScale as ReadonlyArray<string> | Record<string, string>,
				conditions,
				defaultCondition ?? '',
				{ ...layerOptions, mirror: mirrors[propertyName] },
			);
			config[propertyName] = Object.assign({}, config[propertyName], staticStyle);
		}
	}

	return { config };
}
