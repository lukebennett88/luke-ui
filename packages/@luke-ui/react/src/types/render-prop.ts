import type { ComponentPropsWithRef, JSX, ReactElement } from 'react';

/**
 * Render-delegation prop shared across Luke UI. Mirrors react-aria-components' `render` prop:
 * receive the component's resolved DOM props (and optional render state) and return the element to
 * render, so a caller can swap the underlying element while keeping the component's props and styles.
 *
 * `react-aria-components` does not publicly export its equivalent render-function type, so this is the
 * canonical Luke UI definition. Reuse it instead of hand-rolling a new render prop per component.
 */
export type RenderProp<
	ElementType extends keyof JSX.IntrinsicElements = 'div',
	RenderState = undefined,
> = (props: ComponentPropsWithRef<ElementType>, renderState: RenderState) => ReactElement;
