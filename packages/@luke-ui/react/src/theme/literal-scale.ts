import { rem } from './rem.js';

type LiteralKey<Prefix extends string, Step extends number> = `${Prefix}${Step}`;

/**
 * Builds a curated literal size scale from numeric steps. Each step becomes both the key and the
 * reference measurement in CSS pixels at a 16px root. Values use `rem` and scale with the root
 * font size. For example, `literalScale('container.', [448])` produces `container.448: '28rem'`.
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
