// A reduced copy of `@luke-ui/rainbow-sprinkles`'s `defineProperties` with one addition: a property
// can mirror its value into custom properties from the same rule. Because the mirror is declared
// in the rule that sets the real property, the cascade that picks the winning padding (shorthand,
// axis, side, breakpoint) picks the winning mirror too. Nothing is resolved in JavaScript.
//
// It emits the config shape the real `createRuntimeFn` reads, so the prototype Box runs the
// production runtime unchanged.
import { createVar, style } from '@vanilla-extract/css';
import { orderPropertiesBySpecificity } from '../../../../packages/@luke-ui/rainbow-sprinkles/src/property-specificity.js';

type Condition = { '@container'?: string };
type Conditions = Record<string, Condition>;
type Rule = Record<string, unknown>;
/** Extra custom properties a rule declares, given the value the real property receives. */
export type Mirror = (value: string) => Record<string, string>;

type Options = {
	conditions: Conditions;
	layer: string;
	dynamicProperties: Record<string, Record<string, string> | true>;
	/** Keyword properties: one class per value and condition, so a mirror can depend on the value. */
	staticProperties?: Record<string, Record<string, string>>;
	mirrors?: Record<string, Mirror>;
	staticMirrors?: Record<string, (key: string) => Record<string, string>>;
};

function wrap(layer: string, condition: Condition, rule: Rule): Rule {
	const conditional = condition['@container']
		? { '@container': { [condition['@container']]: rule } }
		: rule;
	return { '@layer': { [layer]: conditional } };
}

export function defineProperties(options: Options) {
	const { conditions, layer, dynamicProperties, staticProperties = {}, mirrors = {} } = options;
	const config: Record<string, unknown> = {};
	const names = orderPropertiesBySpecificity([
		...Object.keys(dynamicProperties),
		...Object.keys(staticProperties),
	]);

	for (const property of names) {
		const scale = dynamicProperties[property];
		if (scale !== undefined) {
			const vars: Record<string, string> = {};
			const classes: Record<string, string> = {};
			for (const [name, condition] of Object.entries(conditions)) {
				const cssVar = createVar(`${property}-${name}`);
				vars[name] = cssVar;
				const mirror = mirrors[property]?.(cssVar);
				classes[name] = style(
					wrap(layer, condition, { [property]: cssVar, ...(mirror ? { vars: mirror } : {}) }),
					`${property}-${name}`,
				);
			}
			config[property] = {
				dynamic: { conditions: classes, default: classes.initial },
				dynamicScale: scale,
				name: property,
				vars: { conditions: vars, default: vars.initial },
			};
			continue;
		}

		// Conditions are the outer loop so a wider breakpoint's class follows every narrower one.
		const staticScale = staticProperties[property]!;
		const values: Record<string, { default: string; conditions: Record<string, string> }> = {};
		for (const [name, condition] of Object.entries(conditions)) {
			for (const [key, value] of Object.entries(staticScale)) {
				const mirror = options.staticMirrors?.[property]?.(key);
				const className = style(
					wrap(layer, condition, { [property]: value, ...(mirror ? { vars: mirror } : {}) }),
					`${property}-${key}-${name}`,
				);
				const entry = (values[key] ??= { conditions: {}, default: className });
				entry.conditions[name] = className;
			}
		}
		config[property] = { name: property, staticScale: Object.keys(staticScale), values };
	}
	return { config };
}
