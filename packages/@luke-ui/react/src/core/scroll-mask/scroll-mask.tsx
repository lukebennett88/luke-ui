import { useObjectRef } from '@react-aria/utils';
import type { JSX } from 'react';
import { useEffect, useLayoutEffect, useState } from 'react';
import { cx } from '../../shared/utils/utils.js';
import { Box, omitUnsupportedSprinklesProps } from '../box/box.js';
import type { LayoutProps } from '../styles/layout-props.js';
import { layoutProperties } from '../styles/layout-props.js';
import type { RequiredAccessibleName } from '../types/accessible-name.js';
import type { BoxLikeElementProps } from '../types/box-like-props.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import {
	scrollMaskOverflowingBlock,
	scrollMaskOverflowingInline,
	scrollMaskRecipe,
} from './recipe.css.js';

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
	const { overflows, writingMode } = useScrollOverflow(scrollportRef, axis);
	const isDiv = elementType === 'div';
	const { 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledBy, ...domProps } = props;

	return (
		<Box
			{...omitUnsupportedSprinklesProps(isDiv ? domProps : props, scrollMaskProperties)}
			className={cx(
				scrollMaskRecipe({ axis, className }),
				overflows
					? axis === 'inline'
						? scrollMaskOverflowingInline
						: scrollMaskOverflowingBlock
					: undefined,
			)}
			data-scroll-mask-writing={writingMode}
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

/**
 * Writing-mode token stored on the scrollport for mask CSS. Direction stays in CSS via `:dir()`.
 */
type ScrollMaskWritingMode =
	| 'horizontal-tb'
	| 'sideways-lr'
	| 'sideways-rl'
	| 'vertical-lr'
	| 'vertical-rl';

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

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/** Tracks overflow and the writing-mode token CSS needs for mask direction. */
function useScrollOverflow(
	scrollportRef: { current: HTMLElement | null },
	axis: ScrollMaskAxis,
): { overflows: boolean; writingMode: ScrollMaskWritingMode } {
	const [overflows, setOverflows] = useState(false);
	const [writingMode, setWritingMode] = useState<ScrollMaskWritingMode>('horizontal-tb');

	useIsomorphicLayoutEffect(() => {
		const element = scrollportRef.current;
		if (!element) {
			setOverflows(false);
			return;
		}

		let frameId: number | null = null;
		const resizeObserver = new ResizeObserver(scheduleMeasure);

		const measure = () => {
			const nextWriting = writingModeToken(getComputedStyle(element).writingMode);
			setWritingMode((previous) => (previous === nextWriting ? previous : nextWriting));
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

		// Inherited writing-mode can change via ancestor class/style without resizing this node.
		const inheritedStyleObserver = new MutationObserver(scheduleMeasure);
		observeAncestorStyleInputs(element, inheritedStyleObserver);

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
			inheritedStyleObserver.disconnect();
			element.removeEventListener('load', scheduleMeasure, true);
			element.removeEventListener('error', scheduleMeasure, true);
			fonts?.removeEventListener('loadingdone', scheduleMeasure);
		};
	}, [axis, scrollportRef]);

	return { overflows, writingMode };
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

/**
 * Physical side that corresponds to logical end for `axis` on `element`.
 * Used by tests; mask CSS derives the same mapping from writing mode + `:dir()`.
 */
export function logicalEndSide(element: HTMLElement, axis: ScrollMaskAxis): ScrollMaskPhysicalSide {
	const { direction, writingMode } = getComputedStyle(element);
	const writing = writingModeToken(writingMode);
	const rtl = direction === 'rtl';

	if (axis === 'inline') {
		switch (writing) {
			case 'horizontal-tb':
				return rtl ? 'left' : 'right';
			case 'sideways-lr':
				return rtl ? 'bottom' : 'top';
			default:
				return rtl ? 'top' : 'bottom';
		}
	}

	switch (writing) {
		case 'sideways-rl':
		case 'vertical-rl':
			return 'left';
		case 'sideways-lr':
		case 'vertical-lr':
			return 'right';
		default:
			return 'bottom';
	}
}

/** Normalize computed `writing-mode` to the token CSS mask selectors understand. */
function writingModeToken(writingMode: string): ScrollMaskWritingMode {
	switch (writingMode) {
		case 'sideways-lr':
			return 'sideways-lr';
		case 'sideways-rl':
			return 'sideways-rl';
		case 'tb':
		case 'tb-rl':
		case 'vertical-rl':
			return 'vertical-rl';
		case 'vertical-lr':
			return 'vertical-lr';
		default:
			return 'horizontal-tb';
	}
}

function isHorizontalWritingMode(writingMode: string): boolean {
	return writingModeToken(writingMode) === 'horizontal-tb';
}

function observeElementTree(root: Element, observer: ResizeObserver): void {
	observer.observe(root);
	for (const node of root.querySelectorAll('*')) {
		observer.observe(node);
	}
}

function observeAncestorStyleInputs(element: Element, observer: MutationObserver): void {
	let node: Element | null = element.parentElement;
	while (node) {
		observer.observe(node, {
			attributeFilter: ['class', 'style'],
			attributes: true,
		});
		node = node.parentElement;
	}
}
