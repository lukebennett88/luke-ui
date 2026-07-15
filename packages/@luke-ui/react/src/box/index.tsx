import type { ComponentPropsWithRef, JSX, ReactElement } from 'react';
import type { SprinklesProps } from '../styles/index.js';
import { createSprinkles } from '../styles/index.js';
import { mergeProps } from '../utils/index.js';

type BoxRender = (props: ComponentPropsWithRef<'div'>, renderProps: undefined) => ReactElement;

/**
 * Props for `Box`. Layout props accept responsive values keyed by Luke UI breakpoints.
 *
 * @tier atom
 */
export type BoxProps = Omit<ComponentPropsWithRef<'div'>, keyof SprinklesProps | 'render'> &
	SprinklesProps & {
		/** Renders a compatible custom `div` while carrying Box's DOM props and generated styles. */
		render?: BoxRender;
	};

/** A layout container backed by Luke UI Sprinkles. */
export function Box(props: BoxProps): JSX.Element {
	const { className, render, style, ...restProps } = props;
	const [sprinklesProps, elementProps] = splitProps(restProps);
	const domProps = mergeProps(elementProps, createSprinkles(sprinklesProps));
	const mergedDomProps = mergeProps(domProps, { className, style });

	return render ? render(mergedDomProps, undefined) : <div {...mergedDomProps} />;
}

function splitProps(
	props: Omit<BoxProps, 'className' | 'render' | 'style'>,
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
