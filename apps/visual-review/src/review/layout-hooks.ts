import { breakpoints } from '@luke-ui/react/theme';
import type { RefObject } from 'react';
import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react';

/** Below this width the review is the phone layout: a bottom bar, sheets, and full-bleed captures. */
export const COMPACT_QUERY = `(width < ${breakpoints.bp768}px)`;
/** Below this width Contents opens as a drawer over the captures instead of narrowing them. */
export const DRAWER_QUERY = `(width < ${breakpoints.bp1280}px)`;

export function useMediaQuery(query: string): boolean {
	return useSyncExternalStore(
		(listener) => {
			const list = window.matchMedia(query);
			list.addEventListener('change', listener);
			return () => list.removeEventListener('change', listener);
		},
		() => window.matchMedia(query).matches,
	);
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
