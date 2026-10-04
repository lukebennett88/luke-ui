import type { ResponsiveCondition } from './responsive-conditions.js';

/** Arrays are direct values. Other objects are reserved for responsive breakpoint maps. */
type DirectValue<Value> =
	Value extends ReadonlyArray<unknown> ? Value : Value extends object ? never : Value;

type ResponsiveObject<Value> = Exclude<Extract<NonNullable<Value>, object>, ReadonlyArray<unknown>>;

/**
 * A direct value, or a responsive object keyed by breakpoint. A breakpoint that is omitted, `null`,
 * or `undefined` does not provide a new value.
 */
export type ResponsivePropValue<Value> =
	| Value
	| {
			[Condition in ResponsiveCondition]?: Value | null;
	  };

/** A responsive value whose initial condition is required. */
export type RequiredInitialResponsive<Value> =
	| DirectValue<NonNullable<Value>>
	| (ResponsiveObject<Value> & {
			initial: NonNullable<
				ResponsiveObject<Value> extends { initial?: infer Initial } ? Initial : never
			>;
	  });

/**
 * A required-initial responsive prop for a scalar or array value. Prefer this over
 * `RequiredInitialResponsive<Value>` when the value is not already a Sprinkles responsive union.
 */
export type RequiredInitialResponsiveValue<Value> = RequiredInitialResponsive<
	ResponsivePropValue<Value>
>;

/** Adds a component default for the initial condition of a responsive value. */
export function withResponsiveDefault<Value>(
	value: Value | null | undefined,
	defaultValue: NonNullable<Value>,
): NonNullable<Value> {
	if (value == null) return defaultValue;
	if (typeof value !== 'object') return value;
	if (Array.isArray(value)) return value;
	if ('initial' in value) {
		return { ...value, initial: value.initial ?? defaultValue };
	}
	return { ...value, initial: defaultValue };
}

/** True when `value` is an integer greater than zero. */
export function isPositiveInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/** True when `value` is a string with at least one non-whitespace character. */
export function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.trim().length > 0;
}
