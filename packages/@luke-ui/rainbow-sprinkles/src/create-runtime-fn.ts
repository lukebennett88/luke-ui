import { assignInlineVars } from '@vanilla-extract/dynamic';
import type {
	DefinePropertiesReturn,
	DynamicConditionalProperty,
	DynamicProperty,
	RuntimeFnReturn,
	SprinkleProperties,
	SprinklesProps,
	StaticConditionalProperty,
	StaticConditionalPropertyArray,
	StaticDynamicConditionalProperty,
	StaticDynamicConditionalPropertyArray,
	StaticDynamicProperty,
	StaticDynamicPropertyArray,
	StaticProperty,
	StaticPropertyArray,
} from './types.js';

export type SprinklesFn<Args extends ReadonlyArray<DefinePropertiesReturn>> = {
	<Props extends SprinklesProps<Args>>(
		props: Props,
	): RuntimeFnReturn & Omit<Props, keyof SprinklesProps<Args> | 'className' | 'style'>;
	properties: Set<keyof SprinklesProps<Args>>;
};

function replaceVarsInValue(
	propValue: string,
	dynamicScale: Record<string, string> | true | undefined,
	staticScale: ReadonlyArray<string> | Record<string, string> | undefined,
): string | false {
	if (Array.isArray(staticScale) && staticScale.indexOf(propValue) > -1) {
		return false;
	}
	// Direct bare-name lookup in dynamic scale (no $ prefix needed)
	if (dynamicScale && typeof dynamicScale === 'object' && propValue in dynamicScale) {
		return dynamicScale[propValue]!;
	}
	if (staticScale && !Array.isArray(staticScale) && propValue in staticScale) {
		return false;
	}
	return propValue;
}

function getValueConfig(
	propValue: string,
	scale: Record<string, { default: string; conditions?: Record<string, string> }>,
): { default: string; conditions?: Record<string, string> } | null {
	if (propValue in scale) {
		return scale[propValue]!;
	}
	return null;
}

function assignClasses(
	propertyConfig: SprinkleProperties[string],
	propValue: unknown,
	cache: Map<string, string>,
	condition?: string,
): string {
	if (!propValue && propValue !== 0) {
		return '';
	}

	if (typeof propValue === 'string' || typeof propValue === 'number') {
		return handleEntry(propertyConfig, `${propValue}`, cache, condition);
	}
	const keys = Object.keys(propValue as Record<string, unknown>);
	if (keys.length < 1) {
		return '';
	}
	const parts: Array<string> = [];
	for (const cond of keys) {
		const rawValueAtCondition = String((propValue as Record<string, unknown>)[cond]);
		const result = handleEntry(propertyConfig, rawValueAtCondition, cache, cond);
		if (result) {
			parts.push(result);
		}
	}
	return parts.join(' ');
}

function hasValues(
	config: SprinkleProperties[string],
): config is
	| StaticProperty
	| StaticConditionalProperty
	| StaticPropertyArray
	| StaticConditionalPropertyArray
	| StaticDynamicProperty
	| StaticDynamicConditionalProperty
	| StaticDynamicPropertyArray
	| StaticDynamicConditionalPropertyArray {
	return 'values' in config;
}

function hasDynamic(
	config: SprinkleProperties[string],
): config is
	| DynamicProperty
	| DynamicConditionalProperty
	| StaticDynamicProperty
	| StaticDynamicConditionalProperty
	| StaticDynamicPropertyArray
	| StaticDynamicConditionalPropertyArray {
	return 'dynamic' in config;
}

function handleEntry(
	propertyConfig: SprinkleProperties[string],
	propValue: string,
	cache: Map<string, string>,
	condition?: string,
): string {
	const propName = (propertyConfig as DynamicProperty).name;
	const staticScale = (propertyConfig as StaticProperty).staticScale as
		| ReadonlyArray<string>
		| Record<string, string>
		| undefined;
	const cacheKey = condition ? `${condition}${propValue}` : propValue;
	const cached = cache.get(cacheKey);
	if (cached !== undefined) {
		return cached;
	}

	if (hasValues(propertyConfig)) {
		const values = propertyConfig.values;
		if (Array.isArray(staticScale) && staticScale.includes(propValue)) {
			const valueConfig = values[propValue] as {
				default: string;
				conditions?: Record<string, string>;
			};
			const result = condition ? valueConfig?.conditions?.[condition] : valueConfig?.default;
			if (typeof result === 'string') {
				cache.set(cacheKey, result);
				return result;
			}
		}
		// Direct bare-name lookup for static record scale (no $ prefix needed)
		if (
			!Array.isArray(staticScale) &&
			staticScale &&
			propValue in staticScale &&
			propValue in values
		) {
			const valueConfig = values[propValue] as {
				default: string;
				conditions?: Record<string, string>;
			};
			const result = condition ? valueConfig?.conditions?.[condition] : valueConfig?.default;
			if (typeof result === 'string') {
				cache.set(cacheKey, result);
				return result;
			}
		}
		const parsedValue = getValueConfig(propValue, values);
		if (parsedValue) {
			const result = condition ? parsedValue.conditions?.[condition] : parsedValue.default;
			if (typeof result === 'string') {
				cache.set(cacheKey, result);
				return result;
			}
		}
	}
	if (hasDynamic(propertyConfig)) {
		const dynamic = propertyConfig.dynamic as {
			default: string;
			conditions?: Record<string, string>;
		};
		const result = condition ? dynamic.conditions?.[condition] : dynamic.default;
		if (typeof result === 'string') {
			cache.set(cacheKey, result);
			return result;
		}
	}

	// eslint-disable-next-line no-console
	console.error(
		`Rainbow Sprinkles: invalid value provided to prop '${propName}'. Expected one of ${
			hasValues(propertyConfig)
				? Object.keys(propertyConfig.values)
						.map((c) => `"${c}"`)
						.join(', ')
				: 'dynamic'
		}. Received: ${JSON.stringify(propValue)}.`,
	);
	return '';
}

function assignVars(
	style: Record<string, string>,
	propertyConfig: SprinkleProperties[string],
	propValue: unknown,
	cache: Map<string, string | false>,
): void {
	if (!hasDynamic(propertyConfig)) {
		return;
	}
	const vars = propertyConfig.vars as
		| { default: string; conditions?: Record<string, string> }
		| undefined;
	const dynamicScale = propertyConfig.dynamicScale as Record<string, string> | true | undefined;
	const staticScale = (propertyConfig as StaticProperty).staticScale as
		| ReadonlyArray<string>
		| Record<string, string>
		| undefined;

	if (typeof propValue === 'string' || typeof propValue === 'number') {
		const cacheKey = `${propValue}`;
		const cached = cache.get(cacheKey);
		if (cached !== undefined) {
			if (cached && vars) {
				style[vars.default] = cached;
			}
			return;
		}
		const parsedValue = replaceVarsInValue(cacheKey, dynamicScale, staticScale);
		cache.set(cacheKey, parsedValue);
		if (parsedValue && vars) {
			style[vars.default] = parsedValue;
		}
		return;
	}

	if (propValue && typeof propValue === 'object') {
		const propObj = propValue as Record<string, unknown>;
		const keys = Object.keys(propObj);
		if (keys.length < 1) {
			return;
		}
		for (const condition of keys) {
			const value = propObj[condition];
			if (typeof value === 'string' || typeof value === 'number') {
				const cacheKey = `${value}`;
				const cached = cache.get(cacheKey);
				if (cached !== undefined) {
					if (cached && vars?.conditions) {
						const conditionVar = vars.conditions[condition];
						if (conditionVar) {
							style[conditionVar] = cached;
						}
					}
					continue;
				}
				const parsedValue = replaceVarsInValue(cacheKey, dynamicScale, staticScale);
				cache.set(cacheKey, parsedValue);
				if (parsedValue && vars?.conditions) {
					const conditionVar = vars.conditions[condition];
					if (conditionVar) {
						style[conditionVar] = parsedValue;
					}
				}
			}
		}
	}
}

export function createRuntimeFn<Configs extends ReadonlyArray<DefinePropertiesReturn>>(
	...configs: Configs
): SprinklesFn<Configs> {
	const cssConfig: SprinkleProperties = Object.assign(
		{},
		...configs.map((c) => c.config),
	) as SprinkleProperties;
	const properties = Object.keys(cssConfig);
	const propertiesSet = new Set(properties);

	type PropertyCache = {
		class: Map<string, string>;
		style: Map<string, string | false>;
	};

	const cache = new Map<string, PropertyCache>();

	const fn = (props: Record<string, unknown>) => {
		const style: Record<string, string> = {};
		const className: Array<string> = [];
		const otherProps: Record<string, unknown> = {};

		const propsKeys = Object.keys(props);
		for (const property of propsKeys) {
			if (!propertiesSet.has(property)) {
				otherProps[property] = props[property];
				continue;
			}
			const propertyConfig = cssConfig[property];
			const propValue = props[property];
			if (!propertyConfig) {
				continue;
			}
			let classCache: Map<string, string> | undefined;
			let styleCache: Map<string, string | false> | undefined;
			const c = cache.get(property);
			if (c) {
				classCache = c.class;
				styleCache = c.style;
			} else {
				classCache = new Map();
				styleCache = new Map();
				cache.set(property, { class: classCache, style: styleCache });
			}
			className.push(assignClasses(propertyConfig, propValue, classCache));
			assignVars(style, propertyConfig, propValue, styleCache);
		}
		return {
			...otherProps,
			className: className.join(' ').trim(),
			style: assignInlineVars(style),
		};
	};
	return Object.assign(fn, {
		properties: propertiesSet as unknown as Set<keyof SprinklesProps<Configs>>,
	}) as SprinklesFn<Configs>;
}
