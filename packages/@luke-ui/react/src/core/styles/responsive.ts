type ResponsiveObject<Value> = Extract<NonNullable<Value>, object>;

/** Breakpoint keys accepted by responsive layout props. */
export type ResponsiveCondition = 'initial' | 'bp640' | 'bp768' | 'bp1024' | 'bp1280' | 'bp1536';

/** A direct value, or a responsive object keyed by breakpoint. */
type ResponsivePropValue<Value> =
	| Value
	| {
			[Condition in ResponsiveCondition]?: Value | null;
	  };

/** A responsive value whose initial condition is required. */
export type RequiredInitialResponsive<Value> =
	| Exclude<Value, null | object | undefined>
	| (ResponsiveObject<Value> & {
			initial: NonNullable<
				ResponsiveObject<Value> extends { initial?: infer Initial } ? Initial : never
			>;
	  });

/**
 * A required responsive prop for a scalar value. Prefer this over
 * `RequiredInitialResponsive<Scalar>` when the scalar is not already a Sprinkles responsive union.
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
	if ('initial' in value) {
		return { ...value, initial: value.initial ?? defaultValue };
	}
	return { ...value, initial: defaultValue };
}

/** True when `value` is an integer greater than zero. */
export function isPositiveInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value) && value > 0;
}
