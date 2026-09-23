import { useObjectRef } from '@react-aria/utils';
import type { JSX } from 'react';
import { useEffect, useLayoutEffect, useState } from 'react';
import { Box, omitUnsupportedSprinklesProps } from '../box/box.js';
import type { LayoutProps } from '../styles/layout-props.js';
import { layoutProperties } from '../styles/layout-props.js';
import type { RequiredAccessibleName } from '../types/accessible-name.js';
import type { BoxLikeElementProps } from '../types/box-like-props.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { scrollMaskRecipe } from './recipe.css.js';

/** Props for `ScrollMask`. */
export type ScrollMaskProps = Prettify<_ScrollMaskDivProps | _ScrollMaskSemanticProps>;

/**
 * Scroll container that masks the logical start and end edges when more content is available to
 * scroll. The scrollport is keyboard-focusable only while it overflows on the active axis.
 */
export function ScrollMask({
	axis = 'inline',
	className,
	elementType = 'div',
	style,
	...props
}: ScrollMaskProps): JSX.Element {
	// `ref` stays on `props` so the compiler can track it through `useObjectRef`.
	const scrollportRef = useObjectRef(props.ref);
	const overflows = useScrollOverflow(scrollportRef, axis);
	const isDiv = elementType === 'div';

	return (
		<Box
			{...omitUnsupportedSprinklesProps(props, scrollMaskProperties)}
			className={scrollMaskRecipe({ axis, className, overflows })}
			elementType={elementType}
			ref={scrollportRef}
			style={style}
			tabIndex={overflows ? 0 : undefined}
			{...(isDiv ? { role: overflows ? 'region' : undefined } : null)}
		/>
	);
}

/** Scroll axis `ScrollMask` can mask. */
export type ScrollMaskAxis = 'inline' | 'block';

type _ScrollMaskElementType = NonNullable<BoxLikeElementProps['elementType']>;

type _ScrollMaskOwnedLayoutProperty = 'overflow' | 'overflowX' | 'overflowY';

type _ScrollMaskLayoutOmit = DistributiveOmit<LayoutProps, _ScrollMaskOwnedLayoutProperty>;

type _ScrollMaskDomOmit = DistributiveOmit<
	BoxLikeElementProps,
	'elementType' | 'render' | 'role' | 'tabIndex'
>;

interface _ScrollMaskOwnProps {
	/**
	 * Axis that scrolls and receives edge masks.
	 * @default inline
	 */
	axis?: ScrollMaskAxis;
	/** ScrollMask owns keyboard focusability from overflow. */
	tabIndex?: never;
	/** ScrollMask owns scrolling on the active axis. */
	overflow?: never;
	/** ScrollMask owns scrolling on the active axis. */
	overflowX?: never;
	/** ScrollMask owns scrolling on the active axis. */
	overflowY?: never;
	/** ScrollMask owns the scrollport element. Use `elementType` instead. */
	render?: never;
}

interface _ScrollMaskDivBase
	extends _ScrollMaskDomOmit, _ScrollMaskLayoutOmit, _ScrollMaskOwnProps {
	/**
	 * Chooses a supported structural element.
	 * @default div
	 */
	elementType?: 'div';
	/** ScrollMask owns `role` for the default `div` root. */
	role?: never;
}

type _ScrollMaskDivProps = _ScrollMaskDivBase & RequiredAccessibleName;

interface _ScrollMaskSemanticProps
	extends _ScrollMaskDomOmit, _ScrollMaskLayoutOmit, _ScrollMaskOwnProps {
	/** Chooses a supported structural element with native semantics. */
	elementType: Exclude<_ScrollMaskElementType, 'div'>;
	/** Role for a semantic root. Defaults to the element's native role. */
	role?: BoxLikeElementProps['role'];
}

const scrollMaskOwnedProperties: ReadonlySet<PropertyKey> = new Set<_ScrollMaskOwnedLayoutProperty>(
	['overflow', 'overflowX', 'overflowY'],
);

const scrollMaskProperties = new Set(layoutProperties);
for (const property of scrollMaskOwnedProperties) {
	scrollMaskProperties.delete(property);
}

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Tracks whether the scrollport overflows on the active axis. */
function useScrollOverflow(
	scrollportRef: { current: HTMLElement | null },
	axis: ScrollMaskAxis,
): boolean {
	const [overflows, setOverflows] = useState(false);

	useIsomorphicLayoutEffect(() => {
		const element = scrollportRef.current;
		if (!element) {
			setOverflows(false);
			return;
		}

		let frameId: number | null = null;

		const measure = () => {
			const next =
				axis === 'inline'
					? element.scrollWidth > element.clientWidth + 1
					: element.scrollHeight > element.clientHeight + 1;
			setOverflows((previous) => (previous === next ? previous : next));
		};

		const scheduleMeasure = () => {
			if (frameId !== null) return;
			frameId = requestAnimationFrame(() => {
				frameId = null;
				measure();
			});
		};

		measure();

		const resizeObserver = new ResizeObserver(scheduleMeasure);
		resizeObserver.observe(element);
		for (const child of element.children) {
			resizeObserver.observe(child);
		}

		const mutationObserver = new MutationObserver((records) => {
			for (const record of records) {
				for (const node of record.addedNodes) {
					if (node instanceof Element) resizeObserver.observe(node);
				}
			}
			scheduleMeasure();
		});
		mutationObserver.observe(element, {
			attributeFilter: ['class', 'style'],
			attributes: true,
			characterData: true,
			childList: true,
			subtree: true,
		});

		const fonts = document.fonts;
		fonts?.addEventListener('loadingdone', scheduleMeasure);
		void fonts?.ready.then(scheduleMeasure);

		return () => {
			if (frameId !== null) cancelAnimationFrame(frameId);
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			fonts?.removeEventListener('loadingdone', scheduleMeasure);
		};
	}, [axis, scrollportRef]);

	return overflows;
}
