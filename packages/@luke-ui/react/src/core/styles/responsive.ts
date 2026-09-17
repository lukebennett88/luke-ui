type ResponsiveObject<Value> = Extract<NonNullable<Value>, object>;

/** A responsive value whose initial condition is required. */
export type RequiredInitialResponsive<Value> =
	| Exclude<Value, null | object | undefined>
	| (ResponsiveObject<Value> & {
			initial: NonNullable<
				ResponsiveObject<Value> extends { initial?: infer Initial } ? Initial : never
			>;
	  });

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
