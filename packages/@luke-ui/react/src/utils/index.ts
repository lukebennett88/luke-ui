/** Joins class names and skips empty values. */
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

type MergeableProps = {
	className?: unknown;
	style?: unknown;
};

/**
 * Merges two prop objects, concatenating `className` with `cx` and shallowly
 * merging `style` objects (later props win). All other properties are overwritten
 * by the later object. Useful for combining component props with `createSprinkles()` output.
 */
export function mergeProps<A extends object, B extends object>(a: A, b: B): Merged<A, B> {
	const result = { ...a } as Record<string, unknown>;
	const aProps = a as MergeableProps;
	const bProps = b as MergeableProps;

	result.className = cx(
		typeof aProps.className === 'string' && aProps.className,
		typeof bProps.className === 'string' && bProps.className,
	);
	result.style = {
		...(typeof aProps.style === 'object' && aProps.style !== null ? aProps.style : {}),
		...(typeof bProps.style === 'object' && bProps.style !== null ? bProps.style : {}),
	};

	for (const key in b) {
		if (key !== 'className' && key !== 'style') {
			result[key] = b[key as keyof B];
		}
	}

	return result as Merged<A, B>;
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
