import * as stylex from '@stylexjs/stylex';
import type { CSSProperties } from 'react';
import type { StyleInput } from './recipe.js';

/**
 * Resolves StyleX styles and appends the consumer's `className` and `style`. Consumer classes are
 * plain CSS, so the cascade decides them: unlayered application CSS beats every Luke UI layer.
 */
export function styleProps(
	styles: StyleInput,
	className?: string,
	style?: CSSProperties,
): { className?: string; style?: CSSProperties } {
	const resolved = stylex.props(styles);
	const classes = [resolved.className, className].filter(Boolean).join(' ');
	return {
		className: classes || undefined,
		style: resolved.style || style ? { ...resolved.style, ...style } : undefined,
	};
}

/** Composes a static resolved class with React Aria's string-or-function `className` prop. */
export function composeClassName<T>(
	own: string | undefined,
	consumer: string | ((values: T & { defaultClassName: string | undefined }) => string) | undefined,
) {
	if (typeof consumer !== 'function') return [own, consumer].filter(Boolean).join(' ');
	return (values: T & { defaultClassName: string | undefined }) => {
		return [own, consumer(values)].filter(Boolean).join(' ');
	};
}
