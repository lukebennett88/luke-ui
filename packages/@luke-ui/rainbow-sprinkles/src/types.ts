import type { Properties } from './css.js';

interface CSSProperties extends Properties {}

type PropertyCssValue<T> = T extends keyof CSSProperties ? CSSProperties[T] : never;

export type ConfigStaticProperties = {
	[k in keyof CSSProperties]?: ReadonlyArray<CSSProperties[k]> | Record<string, CSSProperties[k]>;
};

export type ConfigDynamicProperties = {
	[k in keyof CSSProperties]?: Record<string, CSSProperties[k]> | true;
};

export type ConfigConditions = {
	[conditionName: string]: {
		'@media'?: string;
		'@supports'?: string;
		'@container'?: string;
		selector?: string;
	};
};

type ConditionalPropertyValue = {
	default: string;
	conditions: {
		[conditionName: string]: string;
	};
};

type NonConditionalPropertyValue = {
	default: string;
};

export type DynamicProperty = {
	dynamic: NonConditionalPropertyValue;
	vars: NonConditionalPropertyValue;
	dynamicScale:
		| {
				[token: string]: string;
		  }
		| true;
	name: string;
};

export type DynamicConditionalProperty = {
	dynamic: ConditionalPropertyValue;
	vars: ConditionalPropertyValue;
	dynamicScale:
		| {
				[token: string]: string;
		  }
		| true;
	name: string;
};

export type StaticPropertyArray = {
	values: {
		[value: string]: NonConditionalPropertyValue;
	};
	staticScale: ReadonlyArray<string>;
	name: string;
};

export type StaticConditionalPropertyArray = {
	values: {
		[value: string]: ConditionalPropertyValue;
	};
	staticScale: ReadonlyArray<string>;
	name: string;
};

export type StaticProperty = {
	values: {
		[value: string]: NonConditionalPropertyValue;
	};
	staticScale: {
		[token: string]: string;
	};
	name: string;
};

export type StaticConditionalProperty = {
	values: {
		[value: string]: ConditionalPropertyValue;
	};
	staticScale: {
		[token: string]: string;
	};
	name: string;
};

export type StaticDynamicPropertyArray = {
	dynamic: NonConditionalPropertyValue;
	values: {
		[value: string]: NonConditionalPropertyValue;
	};
	name: string;
	staticScale: ReadonlyArray<string>;
	dynamicScale: true;
	vars: NonConditionalPropertyValue;
};

export type StaticDynamicConditionalPropertyArray = {
	dynamic: ConditionalPropertyValue;
	values: {
		[value: string]: ConditionalPropertyValue;
	};
	name: string;
	staticScale: ReadonlyArray<string>;
	dynamicScale: true;
	vars: ConditionalPropertyValue;
};

export type StaticDynamicProperty = {
	dynamic: NonConditionalPropertyValue;
	values: {
		[value: string]: NonConditionalPropertyValue;
	};
	name: string;
	vars: NonConditionalPropertyValue;
	staticScale: {
		[token: string]: string;
	};
	dynamicScale: true;
};

export type StaticDynamicConditionalProperty = {
	dynamic: ConditionalPropertyValue;
	values: {
		[value: string]: ConditionalPropertyValue;
	};
	name: string;
	vars: ConditionalPropertyValue;
	staticScale: {
		[token: string]: string;
	};
	dynamicScale: true;
};

export type SprinkleProperties = {
	[k: string]:
		| DynamicProperty
		| StaticProperty
		| StaticPropertyArray
		| StaticDynamicPropertyArray
		| StaticDynamicProperty
		| DynamicConditionalProperty
		| StaticConditionalProperty
		| StaticConditionalPropertyArray
		| StaticDynamicConditionalPropertyArray
		| StaticDynamicConditionalProperty;
};

// Mapped config types produced by defineProperties, preserving literal scale key types.
type DynamicConfigEntry<
	K extends string,
	Scale extends Record<string, unknown> | true,
	HasCond extends boolean,
> = Scale extends true
	? HasCond extends true
		? {
				dynamic: ConditionalPropertyValue;
				vars: ConditionalPropertyValue;
				dynamicScale: true;
				name: K;
			}
		: {
				dynamic: NonConditionalPropertyValue;
				vars: NonConditionalPropertyValue;
				dynamicScale: true;
				name: K;
			}
	: Scale extends Record<string, unknown>
		? HasCond extends true
			? {
					dynamic: ConditionalPropertyValue;
					vars: ConditionalPropertyValue;
					dynamicScale: { [T in keyof Scale & string]: string };
					name: K;
				}
			: {
					dynamic: NonConditionalPropertyValue;
					vars: NonConditionalPropertyValue;
					dynamicScale: { [T in keyof Scale & string]: string };
					name: K;
				}
		: never;

type StaticConfigEntry<
	K extends string,
	Scale extends ReadonlyArray<string> | Record<string, unknown>,
	HasCond extends boolean,
> =
	Scale extends ReadonlyArray<infer V extends string>
		? HasCond extends true
			? { values: { [X in V]: ConditionalPropertyValue }; staticScale: Scale; name: K }
			: { values: { [X in V]: NonConditionalPropertyValue }; staticScale: Scale; name: K }
		: Scale extends Record<string, unknown>
			? HasCond extends true
				? {
						values: { [T in keyof Scale & string]: ConditionalPropertyValue };
						staticScale: { [T in keyof Scale & string]: string };
						name: K;
					}
				: {
						values: { [T in keyof Scale & string]: NonConditionalPropertyValue };
						staticScale: { [T in keyof Scale & string]: string };
						name: K;
					}
			: never;

export type MakeConfig<
	Dyn extends ConfigDynamicProperties | undefined,
	Stat extends ConfigStaticProperties | undefined,
	Cond extends ConfigConditions | undefined,
> = (Dyn extends ConfigDynamicProperties
	? {
			[K in keyof Dyn & string]: DynamicConfigEntry<
				K,
				NonNullable<Dyn[K]>,
				Cond extends undefined ? false : true
			>;
		}
	: Record<never, never>) &
	(Stat extends ConfigStaticProperties
		? {
				[K in keyof Stat & string]: StaticConfigEntry<
					K,
					NonNullable<Stat[K]>,
					Cond extends undefined ? false : true
				>;
			}
		: Record<never, never>);

export type DefinePropertiesReturn<Config = SprinkleProperties> = {
	config: Config;
};

type ValueOrConditionObject<T, Conditions extends ConditionalPropertyValue> =
	| T
	| null
	| Partial<Record<keyof Conditions['conditions'], T | null>>;

type ValueOrConditionObjectStatic<T, Values extends { [k: string]: ConditionalPropertyValue }> =
	| T
	| null
	| {
			[Condition in keyof Values[keyof Values]['conditions']]?: T | null;
	  };

type ChildSprinkle<Sprinkle> = Sprinkle extends StaticDynamicConditionalProperty
	? ValueOrConditionObject<
			PropertyCssValue<Sprinkle['name']> | (keyof Sprinkle['staticScale'] & string),
			Sprinkle['vars']
		>
	: Sprinkle extends StaticDynamicConditionalPropertyArray
		? ValueOrConditionObject<PropertyCssValue<Sprinkle['name']>, Sprinkle['vars']>
		: Sprinkle extends DynamicConditionalProperty
			? Sprinkle['dynamicScale'] extends boolean
				? ValueOrConditionObject<PropertyCssValue<Sprinkle['name']>, Sprinkle['vars']>
				: ValueOrConditionObject<keyof Sprinkle['dynamicScale'] & string, Sprinkle['vars']>
			: Sprinkle extends StaticDynamicConditionalPropertyArray
				? ValueOrConditionObject<Sprinkle['staticScale'][number], Sprinkle['dynamic']>
				: Sprinkle extends StaticDynamicConditionalProperty
					? ValueOrConditionObjectStatic<keyof Sprinkle['staticScale'] & string, Sprinkle['values']>
					: Sprinkle extends StaticConditionalProperty
						? ValueOrConditionObjectStatic<
								keyof Sprinkle['staticScale'] & string,
								Sprinkle['values']
							>
						: Sprinkle extends StaticConditionalPropertyArray
							? ValueOrConditionObjectStatic<Sprinkle['staticScale'][number], Sprinkle['values']>
							: Sprinkle extends StaticDynamicProperty
								? (keyof Sprinkle['staticScale'] & string) | PropertyCssValue<Sprinkle['name']>
								: Sprinkle extends StaticDynamicPropertyArray
									? PropertyCssValue<Sprinkle['name']>
									: Sprinkle extends DynamicProperty
										? Sprinkle['dynamicScale'] extends boolean
											? PropertyCssValue<Sprinkle['name']>
											: keyof Sprinkle['dynamicScale'] & string
										: Sprinkle extends StaticProperty
											? keyof Sprinkle['staticScale'] & string
											: Sprinkle extends StaticPropertyArray
												? Sprinkle['staticScale'][number]
												: never;

type ChildSprinkles<Sprinkles extends Record<string, unknown>> = {
	[Prop in keyof Sprinkles]?: ChildSprinkle<Sprinkles[Prop]>;
};

export type SprinklesProps<Args extends ReadonlyArray<unknown>> = Args extends [infer L, ...infer R]
	? (L extends DefinePropertiesReturn<infer Config extends Record<string, unknown>>
			? ChildSprinkles<Config>
			: never) &
			SprinklesProps<R>
	: Record<never, never>;

export interface CommonOptions {
	'@layer'?: string;
}

export type RuntimeFnReturn = {
	style: Record<string, string>;
	className: string;
};
