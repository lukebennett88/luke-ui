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
			className={cx(
				scrollFadeRecipe({ axis, className }),
				overflows
					? axis === 'inline'
						? scrollFadeOverflowingInline
						: scrollFadeOverflowingBlock
					: undefined,
			)}
			data-scroll-fade-end={logicalEnd}
			elementType="div"
			ref={scrollportRef}
			role={overflows ? 'region' : undefined}
			style={style}
			tabIndex={overflows ? 0 : undefined}
			{...(overflows
				? {
						// Naming is type-required because the div may become a region; apply it only
						// while that automatic role is active so the div is never a named generic.
						...(ariaLabel === undefined ? null : { 'aria-label': ariaLabel }),
						...(ariaLabelledBy === undefined ? null : { 'aria-labelledby': ariaLabelledBy }),
					}
				: null)}
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

/** Tracks overflow and the physical side of the active axis's logical end. */
function useScrollOverflow(
	scrollportRef: { current: HTMLElement | null },
	axis: ScrollFadeAxis,
): { logicalEnd: ScrollFadePhysicalSide; overflows: boolean } {
	const [overflows, setOverflows] = useState(false);
	const [logicalEnd, setLogicalEnd] = useState<ScrollFadePhysicalSide>(
		axis === 'inline' ? 'right' : 'bottom',
	);

	useLayoutEffect(() => {
		const element = scrollportRef.current;
		if (!element) {
			setOverflows(false);
			return;
		}

		let frameId: number | null = null;
		const resizeObserver = new ResizeObserver(scheduleMeasure);

		const measure = () => {
			const nextEnd = logicalEndSide(element, axis);
			setLogicalEnd((prev) => (prev === nextEnd ? prev : nextEnd));
			const next = overflowsOnAxis(element, axis);
			setOverflows((prev) => (prev === next ? prev : next));
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

	return { logicalEnd, overflows };
}

/** Whether `element` overflows on the logical `axis` for its writing mode. */
export function overflowsOnAxis(element: HTMLElement, axis: ScrollFadeAxis): boolean {
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
 * Physical side of logical end for `axis`.
 *
 * Measured from used layout (CSS `direction`, writing mode, `text-orientation`, etc.) via a logical
 * inset probe — not from `:dir()`, which ignores `style={{ direction }}`.
 */
export function logicalEndSide(element: HTMLElement, axis: ScrollFadeAxis): ScrollFadePhysicalSide {
	return physicalSideOfLogicalEnd(element, axis === 'inline' ? 'inline-end' : 'block-end');
}

function physicalSideOfLogicalEnd(
	element: HTMLElement,
	edge: 'block-end' | 'inline-end',
): ScrollFadePhysicalSide {
	const style = getComputedStyle(element);
	// Measure on a detached box so scrollport scroll offset cannot move the probe. Copy the used
	// writing mode, CSS direction, and text-orientation — not `:dir()`, which ignores CSS direction.
	const measure = document.createElement('div');
	measure.style.cssText = [
		'position:absolute',
		'inset-inline-start:-9999px',
		'inset-block-start:0',
		'inline-size:100px',
		'block-size:100px',
		`writing-mode:${style.writingMode}`,
		`direction:${style.direction}`,
		`text-orientation:${style.textOrientation}`,
	].join(';');

	const probe = document.createElement('div');
	probe.style.cssText =
		edge === 'inline-end'
			? 'position:absolute;inset-inline-end:0;inset-block-start:50%;inline-size:1px;block-size:1px;margin-block-start:-0.5px'
			: 'position:absolute;inset-block-end:0;inset-inline-start:50%;inline-size:1px;block-size:1px;margin-inline-start:-0.5px';

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
