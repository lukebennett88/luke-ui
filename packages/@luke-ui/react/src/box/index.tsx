import type { ComponentPropsWithRef, JSX } from 'react';
import { boxProperties, createSprinkles } from '../styles/utilities.js';
import type { SprinklesProps } from '../styles/utilities.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import type { RenderProp } from '../types/render-prop.js';
import { mergeProps } from '../utils/index.js';

interface _BoxProps extends ComponentPropsWithRef<'div'>, SprinklesProps {
	/** Renders a compatible custom div while carrying Box's DOM props and generated styles. */
	render?: RenderProp<'div'>;
}

export type BoxProps = Prettify<_BoxProps>;

/** A layout container with curated layout properties. */
export function Box(props: BoxProps): JSX.Element {
	const { className, render, style, ...restProps } = props;
	const [boxProps, elementProps] = splitProps(restProps);
	const domProps = mergeProps(elementProps, createSprinkles(boxProps));
	const mergedDomProps = mergeProps(domProps, { className, style });

	return render ? render(mergedDomProps, undefined) : <div {...mergedDomProps} />;
}

function splitProps(
	props: DistributiveOmit<BoxProps, 'className' | 'render' | 'style'>,
): [Partial<SprinklesProps>, ComponentPropsWithRef<'div'>] {
	const boxProps: Partial<SprinklesProps> = {};
	const elementProps: ComponentPropsWithRef<'div'> = {};

	for (const [property, value] of Object.entries(props)) {
		if (isBoxProperty(property)) Object.assign(boxProps, { [property]: value });
		else Object.assign(elementProps, { [property]: value });
	}

	return [boxProps, elementProps];
}

function isBoxProperty(property: string): property is keyof SprinklesProps {
	return boxProperties.has(property);
}
