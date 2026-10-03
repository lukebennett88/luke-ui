/**
 * Joins a space-separated token list, such as class names or an `aria-labelledby` ID list, and
 * skips empty values.
 */
export function cx(...parts: Array<string | undefined | null | false>): string {
	let result = '';
	for (const part of parts) {
		if (part) {
			result = result ? `${result} ${part.trim()}` : part.trim();
		}
	}
	return result;
}

type Merged<A, B> = {
	[K in keyof A | keyof B]: K extends 'className'
		? string
		: K extends 'style'
			? Record<string, unknown>
			: K extends keyof B
				? B[K]
				: K extends keyof A
					? A[K]
					: never;
};

type MergedAll<T extends ReadonlyArray<unknown>> = T extends readonly [infer First, ...infer Rest]
	? Rest extends readonly [infer Second, ...infer Others]
		? MergedAll<[Merged<First, Second>, ...Others]>
		: First
	: never;

/** Resolves to `never` when `T` is not a fixed-length tuple, so spreading an array is rejected. */
type FixedLength<T extends ReadonlyArray<unknown>> = number extends T['length'] ? never : unknown;

type MergeableProps = {
	className?: unknown;
	style?: unknown;
};

/**
 * Merges two or more prop objects from left to right. Pass each object as its own argument:
 * spreading an array of unknown length is a type error. `className` values are concatenated with
 * `cx`, and `style` objects are shallowly merged (later props win). All other properties are
 * overwritten by the later object, including `on*` handlers — unlike React Aria's `mergeProps`,
 * this does not chain event handlers. Useful for combining component props with
 * `createSprinkles()` output.
 */
export function mergeStyleProps<T extends [object, object, ...Array<object>]>(
	...props: T & FixedLength<T>
): MergedAll<T> {
	const [first, ...rest] = props as Array<object>;
	const result = { ...first } as Record<string, unknown>;
	const firstProps = first as MergeableProps;
	let className = cx(typeof firstProps.className === 'string' && firstProps.className);
	let style: Record<string, unknown> = {
		...(typeof firstProps.style === 'object' && firstProps.style !== null ? firstProps.style : {}),
	};

	for (const current of rest as Array<Record<string, unknown>>) {
		const { className: nextClassName, style: nextStyle } = current as MergeableProps;

		className = cx(className, typeof nextClassName === 'string' && nextClassName);
		if (typeof nextStyle === 'object' && nextStyle !== null) {
			style = { ...style, ...nextStyle };
		}

		for (const key in current) {
			if (key !== 'className' && key !== 'style') {
				result[key] = current[key];
			}
		}
	}

	result.className = className;
	result.style = style;

	return result as MergedAll<T>;
}

/** Converts a pixel value to rem. */
export function pxToRem(px: number, base: number = 16): string {
	return `${px / base}rem`;
}

/** Typed key-value pair from an object. */
export type ObjectEntry<T> = { [K in keyof T]-?: [K, T[K]] }[keyof T];

/**
 * An alternative to `Object.entries()` that avoids type widening.
 *
 * @example
 * Object.entries({ foo: 1, bar: 2 }) // [string, number][]
 * typedEntries({ foo: 1, bar: 2 }) // ["foo" | "bar", number][]
 */
export function typedEntries<T extends object>(value: T) {
	return Object.entries(value) as Array<ObjectEntry<T>>;
}

/**
 * An alternative to `Object.keys()` that avoids type widening.
 *
 * @example
 * Object.keys({ foo: 1, bar: 2 }) // string[]
 * typedKeys({ foo: 1, bar: 2 }) // ("foo" | "bar")[]
 */
export function typedKeys<T extends object>(value: T) {
	return Object.keys(value) as Array<keyof T>;
}

/**
 * An alternative to `Object.fromEntries()` that avoids type widening. Must be
 * used in conjunction with `typedEntries` or `typedKeys`.
 *
 * @example
 * const obj = { name: 'Alice', age: 30 };
 * const rebuilt1 = Object.fromEntries(Object.entries(obj));
 * //    ^? { [k: string]: string | number }
 * const rebuilt2 = typedFromEntries(typedEntries(obj));
 * //    ^? { name: string, age: number }
 */
export function typedFromEntries<T extends object>(entries: Array<ObjectEntry<T>>) {
	return Object.fromEntries(entries) as T;
}
