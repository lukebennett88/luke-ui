import { rem } from './rem.js';

type LiteralKey<Prefix extends string, Step extends number> = `${Prefix}${Step}`;

/**
 * Builds a curated literal size scale from numeric steps. Each step becomes both the key and the
 * `rem` value at a 16px root (`16` → `px16: rem(16)`), so names cannot drift from values.
 *
 * The prefix names the kind of value, such as `px` for squares or `container.` for presets.
 */
export function literalScale<
	const Prefix extends string,
	const Steps extends ReadonlyArray<number>,
>(
	prefix: Prefix,
	steps: Steps,
): { readonly [Step in Steps[number] as LiteralKey<Prefix, Step>]: `${string}rem` } {
	return Object.fromEntries(steps.map((step) => [`${prefix}${step}`, rem(step)])) as {
		readonly [Step in Steps[number] as LiteralKey<Prefix, Step>]: `${string}rem`;
	};
}
