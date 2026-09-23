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
	const { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, ...domProps } = props;

	return (
		<Box
			{...omitUnsupportedSprinklesProps(isDiv ? domProps : props, scrollMaskProperties)}
			className={scrollMaskRecipe({ axis, className, overflows })}
			elementType={elementType}
			ref={scrollportRef}
			style={style}
			tabIndex={overflows ? 0 : undefined}
			{...(isDiv
				? {
						role: overflows ? 'region' : undefined,
						// Naming is type-required for div because it may become a region; apply it only
						// while that automatic role is active so a fitting div is not a named generic.
						...(overflows
							? {
									...(ariaLabel === undefined ? null : { 'aria-label': ariaLabel }),
									...(ariaLabelledBy === undefined ? null : { 'aria-labelledby': ariaLabelledBy }),
								}
							: null),
					}
				: null)}
		/>
	);
}

/** Scroll axis `ScrollMask` can mask. */
export type ScrollMaskAxis = 'inline' | 'block';

/** Physical side that corresponds to the active axis's logical end. */
export type ScrollMaskPhysicalSide = 'bottom' | 'left' | 'right' | 'top';

type _ScrollMaskElementType = NonNullable<BoxLikeElementProps['elementType']>;

/** Structural roots ScrollMask may render. Excludes `span`, which cannot host this scrollport. */
type _ScrollMaskSupportedElementType = Exclude<_ScrollMaskElementType, 'span'>;

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
	elementType: Exclude<_ScrollMaskSupportedElementType, 'div'>;
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

const scrollMaskEndAttribute = 'scrollMaskEnd';

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Tracks whether the scrollport overflows on the active logical axis. */
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
		const resizeObserver = new ResizeObserver(scheduleMeasure);

		const measure = () => {
			element.dataset[scrollMaskEndAttribute] = logicalEndSide(element, axis);
			const next = overflowsOnAxis(element, axis);
			setOverflows((previous) => (previous === next ? previous : next));
		};

		function scheduleMeasure() {
			if (frameId !== null) return;
			frameId = requestAnimationFrame(() => {
				frameId = null;
				measure();
			});
		}

		observeElementTree(element, resizeObserver);
		measure();

		const mutationObserver = new MutationObserver((records) => {
			for (const record of records) {
				for (const node of record.addedNodes) {
					if (node instanceof Element) observeElementTree(node, resizeObserver);
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

		// Nested images and other replaced content can change intrinsic size after mount without a
		// childList mutation; capture-phase load/error plus subtree ResizeObserver cover that.
		element.addEventListener('load', scheduleMeasure, true);
		element.addEventListener('error', scheduleMeasure, true);

		const fonts = document.fonts;
		fonts?.addEventListener('loadingdone', scheduleMeasure);
		void fonts?.ready.then(scheduleMeasure);

		return () => {
			if (frameId !== null) cancelAnimationFrame(frameId);
			resizeObserver.disconnect();
			mutationObserver.disconnect();
			element.removeEventListener('load', scheduleMeasure, true);
			element.removeEventListener('error', scheduleMeasure, true);
			fonts?.removeEventListener('loadingdone', scheduleMeasure);
			delete element.dataset[scrollMaskEndAttribute];
		};
	}, [axis, scrollportRef]);

	return overflows;
}

/** Whether `element` overflows on the logical `axis` for its writing mode. */
export function overflowsOnAxis(element: HTMLElement, axis: ScrollMaskAxis): boolean {
	const inlineIsHorizontal = isHorizontalWritingMode(getComputedStyle(element).writingMode);
	if (axis === 'inline') {
		return inlineIsHorizontal
			? element.scrollWidth > element.clientWidth + 1
			: element.scrollHeight > element.clientHeight + 1;
	}
	return inlineIsHorizontal
		? element.scrollHeight > element.clientHeight + 1
		: element.scrollWidth > element.clientWidth + 1;
}

/** Physical side that corresponds to logical end for `axis` on `element`. */
export function logicalEndSide(element: HTMLElement, axis: ScrollMaskAxis): ScrollMaskPhysicalSide {
	const { direction, writingMode } = getComputedStyle(element);
	if (axis === 'inline') {
		if (!isHorizontalWritingMode(writingMode)) return 'bottom';
		return direction === 'rtl' ? 'left' : 'right';
	}
	switch (writingMode) {
		case 'sideways-rl':
		case 'tb':
		case 'tb-rl':
		case 'vertical-rl':
			return 'left';
		case 'sideways-lr':
		case 'vertical-lr':
			return 'right';
		default:
			return 'bottom';
	}
}

function isHorizontalWritingMode(writingMode: string): boolean {
	return !(
		writingMode.startsWith('vertical') ||
		writingMode.startsWith('sideways') ||
		writingMode === 'tb' ||
		writingMode === 'tb-rl'
	);
}

function observeElementTree(root: Element, observer: ResizeObserver): void {
	observer.observe(root);
	for (const node of root.querySelectorAll('*')) {
		observer.observe(node);
	}
}
