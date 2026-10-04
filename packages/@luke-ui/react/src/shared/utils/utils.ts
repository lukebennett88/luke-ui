/**
 * Joins a space-separated token list, such as class names or an `aria-labelledby` ID list, and
 * skips empty values.
 */
export function cx(...parts: Array<string | undefined | null | false>): string {
	let result = '';
	for (let index = 0; index < parts.length; index++) {
		const part = parts[index];
		if (!part) continue;
		const trimmed = part.trim();
		if (trimmed) {
			result = result ? `${result} ${trimmed}` : trimmed;
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

type MergePossiblyWithArray<A, B> = {
	[K in keyof A | keyof B]: K extends 'className'
		? string
		: K extends 'style'
			? Record<string, unknown>
			: K extends keyof A
				? K extends keyof B
					? A[K] | B[K]
					: A[K]
				: K extends keyof B
					? B[K] | undefined
					: never;
};

type MergedAll<T extends ReadonlyArray<unknown>> = T extends readonly [infer First, ...infer Rest]
	? Rest extends readonly [infer Second, ...infer Others]
		? MergedAll<[Merged<First, Second>, ...Others]>
		: number extends Rest['length']
			? MergePossiblyWithArray<First, Rest[number]>
			: First
	: never;

type MergeableProps = {
	className?: unknown;
	style?: unknown;
};

/**
 * Merges two or more prop objects left to right. Joins `className` with `cx`;
 * shallow-merges `style` (later props win).
 */
export function mergeStyleProps<T extends [object, object, ...Array<object>]>(
	...props: T
): MergedAll<T> {
	const items = props as Array<Record<string, unknown>>;
	const result = { ...items[0] };
	const style: Record<string, unknown> = {};
	let className = '';

	for (let index = 0; index < items.length; index++) {
		const current = items[index] as Record<string, unknown> & MergeableProps;
		const { className: nextClassName, style: nextStyle } = current;

		if (typeof nextClassName === 'string') {
			className = cx(className, nextClassName);
		}
		if (typeof nextStyle === 'object' && nextStyle !== null) {
			Object.assign(style, nextStyle);
		}
		if (index > 0) {
			for (const key in current) {
				if (key !== 'className' && key !== 'style') {
					result[key] = current[key];
				}
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
