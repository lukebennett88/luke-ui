import { createVar, style } from '@vanilla-extract/css';
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

function createStyles(
	property: string,
	scale: Record<string, string> | true,
	conditions: ConfigConditions | undefined,
	defaultCondition: string,
	options: { '@layer'?: string } = {},
): {
	vars: { default: string } | { conditions: Record<string, string>; default: string };
	dynamic: { default: string } | { conditions: Record<string, string>; default: string };
	dynamicScale: Record<string, string> | true;
	name: string;
} {
	if (!conditions) {
		const cssVar = createVar(property)!;
		const styleValue = { [property]: cssVar };
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
	const vars = mapValues(
		conditions,
		(_, conditionName) => createVar(`${property}-${conditionName}`)!,
	);
	const classes = mapValues(conditions, (conditionValue, conditionName) => {
		const styleValue: Record<string, unknown> = (() => {
			const base = { [property]: vars[conditionName] };
			if (conditionValue['@media']) return { '@media': { [conditionValue['@media']]: base } };
			if (conditionValue['@supports'])
				return { '@supports': { [conditionValue['@supports']]: base } };
			if (conditionValue['@container'])
				return { '@container': { [conditionValue['@container']]: base } };
			if (conditionValue.selector) return { selectors: { [conditionValue.selector]: base } };
			return base;
		})();
		return style(
			options['@layer'] ? { '@layer': { [options['@layer']]: styleValue } } : styleValue,
			`${property}-${conditionName}`,
		);
	});
	return {
		dynamic: { conditions: classes, default: classes[defaultCondition]! },
		dynamicScale: scale,
		name: property,
		vars: { conditions: vars, default: vars[defaultCondition]! },
	};
}

function createStaticStyles(
	property: string,
	scale: ReadonlyArray<string> | Record<string, string>,
	conditions: ConfigConditions | undefined,
	defaultCondition: string,
	options: { '@layer'?: string } = {},
): {
	values: Record<
		string,
		{ default: string } | { conditions: Record<string, string>; default: string }
	>;
	name: string;
	staticScale: ReadonlyArray<string> | Record<string, string>;
} {
	const scaleObj = Array.isArray(scale)
		? Object.assign({}, ...scale.map((s) => ({ [s]: s })))
		: scale;
	const values = mapValues(scaleObj, (scaleValue, scaleKey) => {
		const styleValue = { [property]: scaleValue };
		if (!conditions) {
			return {
				default: style(
					options['@layer'] ? { '@layer': { [options['@layer']]: styleValue } } : styleValue,
					`${property}-${scaleKey}`,
				),
			};
		}
		const classes = mapValues(conditions, (conditionValue, conditionName) => {
			const conditionalStyleValue: Record<string, unknown> = (() => {
				const base: Record<string, unknown> = { [property]: scaleValue };
				if (conditionValue['@media'])
					return { '@media': { [conditionValue['@media']]: base } };
				if (conditionValue['@supports'])
					return { '@supports': { [conditionValue['@supports']]: base } };
				if (conditionValue['@container'])
					return { '@container': { [conditionValue['@container']]: base } };
				if (conditionValue.selector)
					return { selectors: { [conditionValue.selector]: base } };
				return base;
			})();
			return style(
				options['@layer']
					? { '@layer': { [options['@layer']]: conditionalStyleValue } }
					: conditionalStyleValue,
				`${property}-${scaleKey}-${conditionName}`,
			);
		});
		return { conditions: classes, default: classes[defaultCondition]! };
	});
	return { name: property, staticScale: scale, values };
}

type DefinePropertiesOptions = CommonOptions & {
	conditions?: ConfigConditions;
	defaultCondition?: string;
	dynamicProperties?: ConfigDynamicProperties;
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
	staticProperties?: Stat;
}): DefinePropertiesReturn<MakeConfig<Dyn, Stat, Cond>>;
export function defineProperties(options: DefinePropertiesOptions): DefinePropertiesReturn {
	const { conditions, dynamicProperties, staticProperties, defaultCondition } = options;

	const dynamicConfig =
		dynamicProperties &&
		Object.fromEntries(
			Object.keys(dynamicProperties).map((dynamicProp) => [
				dynamicProp,
				createStyles(
					dynamicProp,
					// biome-ignore lint/suspicious/noExplicitAny: dynamic property access
					(dynamicProperties as Record<string, unknown>)[dynamicProp] as
						| Record<string, string>
						| true,
					conditions,
					defaultCondition ?? '',
					{ '@layer': options['@layer'] },
				),
			]),
		);

	const staticConfig =
		staticProperties &&
		Object.fromEntries(
			Object.keys(staticProperties).map((staticProp) => [
				staticProp,
				createStaticStyles(
					staticProp,
					// biome-ignore lint/suspicious/noExplicitAny: dynamic property access
					(staticProperties as Record<string, unknown>)[staticProp] as
						| ReadonlyArray<string>
						| Record<string, string>,
					conditions,
					defaultCondition ?? '',
					{ '@layer': options['@layer'] },
				),
			]),
		);

	const config: SprinkleProperties = { ...dynamicConfig, ...staticConfig } as SprinkleProperties;
	return { config };
}
