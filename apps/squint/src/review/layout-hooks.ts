import { breakpoints } from '@luke-ui/react/theme';
import type { RefObject } from 'react';
import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react';

/** Below this width the review is the phone layout: sheets and full-bleed captures. */
export function useIsCompact(): boolean {
	return useSyncExternalStore(subscribeToRoot, () => readRootInlineSize() < breakpoints.bp768);
}

/** Below this width Contents opens as a drawer over the captures instead of narrowing them. */
export function useIsDrawer(): boolean {
	return useSyncExternalStore(subscribeToRoot, () => readRootInlineSize() < breakpoints.bp1280);
}

/**
 * The root's inline size: what the styles' unnamed `@container` queries measure. It leaves out a
 * classic scrollbar, which a `width` media query counts, so reading it keeps the layout the code
 * chooses in step with the one the styles draw. `undefined` until read, and again once nothing
 * observes the root.
 */
let rootInlineSize: number | undefined;
const rootListeners = new Set<() => void>();
let rootObserver: ResizeObserver | undefined;

function readRootInlineSize(): number {
	rootInlineSize ??= document.documentElement.getBoundingClientRect().width;
	return rootInlineSize;
}

function subscribeToRoot(listener: () => void) {
	rootListeners.add(listener);
	rootObserver ??= new ResizeObserver(([entry]) => {
		const size = entry?.contentBoxSize[0]?.inlineSize;
		if (size === undefined || size === rootInlineSize) return;
		rootInlineSize = size;
		for (const rootListener of rootListeners) rootListener();
	});
	if (rootListeners.size === 1) rootObserver.observe(document.documentElement);
	return () => {
		rootListeners.delete(listener);
		if (rootListeners.size > 0) return;
		rootObserver?.disconnect();
		rootInlineSize = undefined;
	};
}

export function useViewportHeight(): number {
	return useSyncExternalStore(
		(listener) => {
			window.addEventListener('resize', listener);
			return () => window.removeEventListener('resize', listener);
		},
		() => window.innerHeight,
	);
}

/** An element's content-box width, kept current. */
export function useContentWidth(ref: RefObject<HTMLElement | null>): number {
	const [width, setWidth] = useState(0);
	useLayoutEffect(() => {
		const element = ref.current;
		if (!element) return;
		function measure(target: HTMLElement) {
			const style = getComputedStyle(target);
			setWidth(
				target.clientWidth -
					Number.parseFloat(style.paddingInlineStart) -
					Number.parseFloat(style.paddingInlineEnd),
			);
		}
		measure(element);
		const observer = new ResizeObserver(() => measure(element));
		observer.observe(element);
		return () => observer.disconnect();
	}, [ref]);
	return width;
}

/** True once the element comes within a screen of the viewport, and true from then on. */
export function useNearViewport(ref: RefObject<HTMLElement | null>): boolean {
	const [isNear, setIsNear] = useState(false);
	useEffect(() => {
		const element = ref.current;
		if (!element || isNear) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) setIsNear(true);
			},
			{ rootMargin: '100% 0px' },
		);
		observer.observe(element);
		return () => observer.disconnect();
	}, [ref, isNear]);
	return isNear;
}
