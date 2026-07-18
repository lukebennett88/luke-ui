import type { ComponentPropsWithRef, JSX } from 'react';
import type { SprinklesProps } from '../styles/utilities.css.js';
import { createSprinkles } from '../styles/utilities.css.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import type { RenderProp } from '../types/render-prop.js';
import { mergeProps } from '../utils/index.js';

interface _BoxProps extends ComponentPropsWithRef<'div'>, SprinklesProps {
	/** Renders a compatible custom `div` while carrying Box's DOM props and generated styles. */
	render?: RenderProp<'div'>;
}

/**
 * Props for `Box`. Layout props accept responsive values keyed by Luke UI breakpoints.
 *
 * @tier atom
 */
export type BoxProps = Prettify<_BoxProps>;

/** A layout container backed by Luke UI Sprinkles. */
export function Box(props: BoxProps): JSX.Element {
	const { className, render, style, ...restProps } = props;
	const [sprinklesProps, elementProps] = splitProps(restProps);
	const domProps = mergeProps(elementProps, createSprinkles(sprinklesProps));
	const mergedDomProps = mergeProps(domProps, { className, style });

	return render ? render(mergedDomProps, undefined) : <div {...mergedDomProps} />;
}

function splitProps(
	props: DistributiveOmit<BoxProps, 'className' | 'render' | 'style'>,
): [SprinklesProps, ComponentPropsWithRef<'div'>] {
	const sprinklesProps: Record<string, unknown> = {};
	const elementProps: Record<string, unknown> = {};

	for (const [property, value] of Object.entries(props)) {
		const target = createSprinkles.properties.has(property as keyof SprinklesProps)
			? sprinklesProps
			: elementProps;
		target[property] = value;
	}

	return [sprinklesProps as SprinklesProps, elementProps as ComponentPropsWithRef<'div'>];
}
