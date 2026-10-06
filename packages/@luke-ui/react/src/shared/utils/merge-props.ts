import { chain, mergeIds, mergeRefs } from '@react-aria/utils';
import type { Ref as ReactRef, RefCallback } from 'react';
import { cx } from './utils.js';

/**
 * Merges two or more prop objects left to right. Joins `className` with `cx`, shallow-merges
 * `style`, chains `on*` handlers, merges `ref`, and deduplicates `id`. Non-string `className`
 * and non-object `style` are ignored. Absent presentation stays `undefined`. Every other prop
 * takes the last defined value. Event callbacks are typed to return `void`.
 */
export function mergeProps<T extends [object, object, ...Array<object>]>(
	...props: T
): MergedAll<T> {
	const result: Record<string, unknown> = { ...props[0] };
	result.className = typeof result.className === 'string' ? result.className : undefined;
	let style =
		typeof result.style === 'object' && result.style !== null
			? Object.assign({}, result.style)
			: undefined;
	result.style = style;

	for (let index = 1; index < props.length; index++) {
		const current = props[index] as Record<string, unknown>;
		for (const key in current) {
			const a = result[key];
			const b = current[key];

			if (key === 'className') {
				if (typeof b === 'string') result.className = typeof a === 'string' ? cx(a, b) : b;
				continue;
			}
			if (key === 'style') {
				if (typeof b === 'object' && b !== null) {
					style = Object.assign(style ?? {}, b);
					result.style = style;
				}
				continue;
			}
			if (typeof a === 'function' && typeof b === 'function' && EVENT_NAME_PATTERN.test(key)) {
				result[key] = chain(a, b);
				continue;
			}
			if (key === 'id' && a && b) {
				result.id = mergeIds(a as string, b as string);
				continue;
			}
			if (key === 'ref' && a && b) {
				result.ref = mergeRefs(a as ReactRef<unknown>, b as ReactRef<unknown>);
				continue;
			}
			result[key] = b !== undefined ? b : a;
		}
	}
	return result as MergedAll<T>;
}

const EVENT_NAME_PATTERN = /^on[A-Z]/;

type Value<T, K extends PropertyKey> = K extends keyof T ? T[K] : undefined;
type Retained<A, B> = undefined extends B ? Exclude<B, undefined> | A : B;
type Callback<T> = Extract<T, (...args: Array<never>) => unknown>;
type UppercaseLetter =
	| 'A'
	| 'B'
	| 'C'
	| 'D'
	| 'E'
	| 'F'
	| 'G'
	| 'H'
	| 'I'
	| 'J'
	| 'K'
	| 'L'
	| 'M'
	| 'N'
	| 'O'
	| 'P'
	| 'Q'
	| 'R'
	| 'S'
	| 'T'
	| 'U'
	| 'V'
	| 'W'
	| 'X'
	| 'Y'
	| 'Z';

type Presentation<A, B, Accepted, Output> = [A] extends [Accepted]
	? Output
	: [B] extends [Accepted]
		? Output
		: [Extract<A | B, Accepted>] extends [never]
			? Accepted extends A | B
				? Output | undefined
				: undefined
			: Output | undefined;

type CallbackArgs<T> = Callback<T> extends (...args: infer Args) => unknown ? Args : never;

type HandlerArgs<A, B> = [Callback<A>] extends [never]
	? CallbackArgs<B>
	: [Callback<B>] extends [never]
		? CallbackArgs<A>
		: CallbackArgs<A> extends CallbackArgs<B>
			? CallbackArgs<A>
			: CallbackArgs<A> & CallbackArgs<B>;

type Handler<A, B> = [Callback<Retained<A, B>>] extends [never]
	? Retained<A, B>
	: ((...args: HandlerArgs<A, B>) => void) | Exclude<Retained<A, B>, Callback<A> | Callback<B>>;

type RefTarget<T> = T extends (...args: infer Args) => unknown
	? Args[0]
	: T extends { current: infer Target }
		? Target
		: never;

type Ref<A, B> = [NonNullable<A>] extends [never]
	? Retained<A, B>
	: [NonNullable<B>] extends [never]
		? Retained<A, B>
		:
				| RefCallback<RefTarget<A> & RefTarget<B>>
				| (Extract<A | B, null | undefined> extends never ? never : Retained<A, B>);

type MergedValue<A, B, K extends PropertyKey> = K extends 'className'
	? Presentation<A, B, string, string>
	: K extends 'style'
		? Presentation<A, B, object, Record<string, unknown>>
		: K extends `on${UppercaseLetter}${string}`
			? Handler<A, B>
			: K extends 'ref'
				? Ref<A, B>
				: Retained<A, B>;

type Merged<A, B> = {
	[K in keyof A | keyof B]: MergedValue<Value<A, K>, Value<B, K>, K>;
};

type MergedAll<T extends ReadonlyArray<unknown>> = T extends readonly [infer First, ...infer Rest]
	? Rest extends readonly [infer Second, ...infer Others]
		? MergedAll<[Merged<First, Second>, ...Others]>
		: number extends Rest['length']
			? Merged<First, Partial<Rest[number]>>
			: First
	: never;
