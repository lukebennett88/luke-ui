import type { ComponentPropsWithRef, JSX } from 'react';
import { createElement } from 'react';
import type { SprinklesProps } from '../styles/utilities.css.js';
import { createSprinkles } from '../styles/utilities.css.js';
import type { RenderProp } from '../types/render-prop.js';
import { mergeProps } from '../utils/index.js';

// Layout and sectioning elements a layout container should render. A curated set keeps the
// generated props table accurate and readable. An unconstrained `keyof JSX.IntrinsicElements`
// drops props from that table. This also rules out elements that carry their own behaviour, such
// as `input` or `button`, which belong to a dedicated component instead.
type BoxElementType =
	| 'a'
	| 'article'
	| 'aside'
	| 'div'
	| 'footer'
	| 'header'
	| 'li'
	| 'main'
	| 'nav'
	| 'ol'
	| 'section'
	| 'span'
	| 'ul';

/**
 * Props for `Box`. Layout props accept responsive values keyed by Luke UI breakpoints.
 *
 * `elementType` and `render` are mutually exclusive ways to choose the rendered element.
 *
 * @tier atom
 */
// `Prettify` is omitted here on purpose, unlike other props types in this repo. Wrapping this
// union in `Prettify` collapses `ElementType` inference back to the `'div'` default, so
// `elementType="a"` would no longer narrow. Do not restore it.
export type BoxProps<ElementType extends BoxElementType = 'div'> =
	| (ComponentPropsWithRef<ElementType> &
			SprinklesProps & {
				/** Chooses the rendered element. Its DOM props follow that element. Cannot be combined with `render`. */
				elementType?: ElementType;
				render?: never;
			})
	| (ComponentPropsWithRef<'div'> &
			SprinklesProps & {
				elementType?: never;
				/** Renders a compatible custom `div` while carrying Box's DOM props and generated styles. Cannot be combined with `elementType`. */
				render?: RenderProp<'div'>;
			});

/** A layout container backed by Luke UI Sprinkles. Renders a `div` unless `elementType` is set. */
export function Box<ElementType extends BoxElementType = 'div'>(
	props: BoxProps<ElementType>,
): JSX.Element {
	const { className, elementType, render, style, ...restProps } = props;
	const [sprinklesProps, elementProps] = splitProps(restProps);
	const domProps = mergeProps(elementProps, createSprinkles(sprinklesProps));
	const mergedDomProps = mergeProps(domProps, { className, style });

	if (render) return render(mergedDomProps, undefined);

	return createElement(elementType ?? 'div', mergedDomProps);
}

// `props` is typed `object`, not the precise `DistributiveOmit` equivalent, because that generic
// form does not typecheck against the two-branch `BoxProps` union. Callers are validated at the
// public `BoxProps` interface before their props reach this function.
function splitProps(props: object): [SprinklesProps, ComponentPropsWithRef<'div'>] {
	const sprinklesProps: Record<string, unknown> = {};
	const elementProps: Record<string, unknown> = {};

	for (const [property, value] of Object.entries(props)) {
		const target = createSprinkles.properties.has(property as keyof SprinklesProps)
			? sprinklesProps
			: elementProps;
		target[property] = value;
	}

	// The DOM props are validated at the public `BoxProps` interface. This concrete `'div'` return
	// type only serves the `render` path, which always targets a `div`.
	return [sprinklesProps as SprinklesProps, elementProps as ComponentPropsWithRef<'div'>];
}
