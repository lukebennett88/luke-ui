import { useObjectRef } from '@react-aria/utils';
import type { JSX } from 'react';
import { useLayoutEffect, useState } from 'react';
import { cx } from '../../shared/utils/utils.js';
import { Box, omitUnsupportedSprinklesProps } from '../box/box.js';
import type { LayoutProps } from '../styles/layout-props.js';
import { layoutProperties } from '../styles/layout-props.js';
import type { RequiredAccessibleName } from '../types/accessible-name.js';
import type { BoxLikeElementProps } from '../types/box-like-props.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import {
	scrollFadeOverflowingBlock,
	scrollFadeOverflowingInline,
	scrollFadeRecipe,
} from './recipe.css.js';

/** Props for `ScrollFade`. */
export type ScrollFadeProps = Prettify<_ScrollFadeProps>;

/**
 * Scroll container that fades at the logical start and end while more content is available to
 * scroll. Always renders a `div` scrollport. The scrollport is a keyboard-focusable, named region
 * only while it overflows on the active axis.
 */
export function ScrollFade(props: ScrollFadeProps): JSX.Element {
	const {
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledBy,
		axis = 'inline',
		className,
		ref,
		style,
		...domProps
	} = props;
	const scrollportRef = useObjectRef(ref);
	const { logicalEnd, overflows } = useScrollOverflow(scrollportRef, axis);

	return (
		<Box
			{...omitUnsupportedSprinklesProps(domProps, scrollFadeProperties)}
			{...(overflows
				? {
						// Overflow regions must be keyboard-focusable (tabIndex=0) and
						// named so screen readers know what has focus.
						// Apply these only when content overflows. Otherwise they add an
						// extra tab stop and announce a region that does not need one.
						...(ariaLabel ? { 'aria-label': ariaLabel } : null),
						...(ariaLabelledBy ? { 'aria-labelledby': ariaLabelledBy } : null),
						role: 'region',
						tabIndex: 0,
					}
				: null)}
			className={cx(
				scrollFadeRecipe({ axis, className }),
				overflows && scrollFadeOverflowingClassByAxis[axis],
			)}
			data-scroll-fade-end={logicalEnd}
			ref={scrollportRef}
			style={style}
		/>
	);
}

/** Logical axis whose start and end fade while content overflows. */
export type ScrollFadeAxis = 'inline' | 'block';

/** Physical side that corresponds to the active axis's logical end. */
export type ScrollFadePhysicalSide = 'bottom' | 'left' | 'right' | 'top';

type _ScrollFadeOwnedLayoutProperty = 'overflow' | 'overflowX' | 'overflowY';

type _ScrollFadeLayoutOmit = DistributiveOmit<LayoutProps, _ScrollFadeOwnedLayoutProperty>;

type _ScrollFadeDomOmit = DistributiveOmit<
	BoxLikeElementProps,
	'elementType' | 'render' | 'role' | 'tabIndex'
>;

type _ScrollFadeProps = _ScrollFadeDomOmit &
	_ScrollFadeLayoutOmit &
	RequiredAccessibleName & {
		/**
		 * Logical axis to scroll on and fade at while more content is available.
		 * @default inline
		 */
		axis?: ScrollFadeAxis;
		/** ScrollFade owns keyboard focusability from overflow. */
		tabIndex?: never;
		/** ScrollFade owns scrolling on the active axis. */
		overflow?: never;
		/** ScrollFade owns scrolling on the active axis. */
		overflowX?: never;
		/** ScrollFade owns scrolling on the active axis. */
		overflowY?: never;
		/** ScrollFade always renders a `div` scrollport. */
		elementType?: never;
		/** ScrollFade owns `role` for the `div` root. */
		role?: never;
		/** ScrollFade owns the scrollport element. Compose semantics around or inside it. */
		render?: never;
	};

const scrollFadeOwnedProperties: ReadonlySet<PropertyKey> = new Set<_ScrollFadeOwnedLayoutProperty>(
	['overflow', 'overflowX', 'overflowY'],
);

const scrollFadeProperties = new Set(layoutProperties);
for (const property of scrollFadeOwnedProperties) {
	scrollFadeProperties.delete(property);
}

const scrollFadeOverflowingClassByAxis: Record<ScrollFadeAxis, string> = {
	block: scrollFadeOverflowingBlock,
	inline: scrollFadeOverflowingInline,
};

type ScrollOverflowState = {
	logicalEnd: ScrollFadePhysicalSide;
	overflows: boolean;
};

/** Tracks overflow and the physical side of the active axis's logical end. */
function useScrollOverflow(
	scrollportRef: {
		current: HTMLElement | null;
	},
	axis: ScrollFadeAxis,
): ScrollOverflowState {
	const [state, setState] = useState<ScrollOverflowState>(() => ({
		logicalEnd: axis === 'inline' ? 'right' : 'bottom',
		overflows: false,
	}));

	useLayoutEffect(() => {
		const element = scrollportRef.current;
		if (!element) {
			setState((prev) => {
				if (!prev.overflows) return prev;
				return {
					logicalEnd: prev.logicalEnd,
					overflows: false,
				};
			});
			return;
		}

		let frameId: number | null = null;
		const resizeObserver = new ResizeObserver(scheduleMeasure);

		const measure = () => {
			const writingMode = getComputedStyle(element).writingMode;
			const logicalEnd = logicalEndSide(element, axis);
			const overflows = overflowsOnAxisForWritingMode(element, axis, writingMode);
			setState((prev) => {
				if (prev.logicalEnd === logicalEnd && prev.overflows === overflows) return prev;
				return {
					logicalEnd,
					overflows,
				};
			});
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
				for (const node of record.removedNodes) {
					if (node instanceof Element) unobserveElementTree(node, resizeObserver);
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

		// Inherited writing-mode / direction can change via ancestor class/style without resizing.
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

	return state;
}

/** Whether `element` overflows on the logical `axis` for its writing mode. */
export function overflowsOnAxis(element: HTMLElement, axis: ScrollFadeAxis): boolean {
	return overflowsOnAxisForWritingMode(element, axis, getComputedStyle(element).writingMode);
}

function overflowsOnAxisForWritingMode(
	element: HTMLElement,
	axis: ScrollFadeAxis,
	writingMode: string,
): boolean {
	const inlineIsHorizontal = isHorizontalWritingMode(writingMode);
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
 * Physical side of logical end for `axis`.
 *
 * Measured from used layout (CSS `direction`, writing mode, `text-orientation`, etc.) via a logical
 * inset probe — not from `:dir()`, which ignores `style={{ direction }}`.
 */
export function logicalEndSide(element: HTMLElement, axis: ScrollFadeAxis): ScrollFadePhysicalSide {
	return physicalSideOfLogicalEnd(element, axis === 'inline' ? 'inline-end' : 'block-end');
}

const logicalEndMeasureStyle = {
	position: 'absolute',
	insetInlineStart: '-9999px',
	insetBlockStart: '0',
	inlineSize: '100px',
	blockSize: '100px',
} as const;

const logicalEndProbeInlineEndStyle = {
	position: 'absolute',
	inlineSize: '1px',
	blockSize: '1px',
	insetInlineEnd: '0',
	insetBlockStart: '50%',
	marginBlockStart: '-0.5px',
} as const;

const logicalEndProbeBlockEndStyle = {
	position: 'absolute',
	inlineSize: '1px',
	blockSize: '1px',
	insetBlockEnd: '0',
	insetInlineStart: '50%',
	marginInlineStart: '-0.5px',
} as const;

function physicalSideOfLogicalEnd(
	element: HTMLElement,
	edge: 'block-end' | 'inline-end',
): ScrollFadePhysicalSide {
	const style = getComputedStyle(element);
	// Measure on a detached box so scrollport scroll offset cannot move the probe. Copy the used
	// writing mode, CSS direction, and text-orientation — not `:dir()`, which ignores CSS direction.
	const measure = document.createElement('div');
	Object.assign(measure.style, logicalEndMeasureStyle);
	measure.style.writingMode = style.writingMode;
	measure.style.direction = style.direction;
	measure.style.textOrientation = style.textOrientation;

	const probe = document.createElement('div');
	Object.assign(
		probe.style,
		edge === 'inline-end' ? logicalEndProbeInlineEndStyle : logicalEndProbeBlockEndStyle,
	);

	measure.append(probe);
	document.body.append(measure);

	const measureRect = measure.getBoundingClientRect();
	const probeRect = probe.getBoundingClientRect();
	measure.remove();

	const probeCenterX = (probeRect.left + probeRect.right) / 2;
	const probeCenterY = (probeRect.top + probeRect.bottom) / 2;
	const measureCenterX = (measureRect.left + measureRect.right) / 2;
	const measureCenterY = (measureRect.top + measureRect.bottom) / 2;

	const inlineIsHorizontal = isHorizontalWritingMode(style.writingMode);
	const preferHorizontal = edge === 'inline-end' ? inlineIsHorizontal : !inlineIsHorizontal;

	if (preferHorizontal) {
		return probeCenterX < measureCenterX ? 'left' : 'right';
	}
	return probeCenterY < measureCenterY ? 'top' : 'bottom';
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

function unobserveElementTree(root: Element, observer: ResizeObserver): void {
	observer.unobserve(root);
	for (const node of root.querySelectorAll('*')) {
		observer.unobserve(node);
	}
}

function observeAncestorStyleInputs(element: Element, observer: MutationObserver): void {
	let node: Element | null = element.parentElement;
	while (node) {
		observer.observe(node, {
			attributeFilter: ['class', 'style', 'dir'],
			attributes: true,
		});
		node = node.parentElement;
	}
}
