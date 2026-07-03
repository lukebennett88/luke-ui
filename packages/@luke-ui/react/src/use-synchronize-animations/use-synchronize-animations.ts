import { useEffect, useLayoutEffect } from 'react';

// useLayoutEffect causes warnings during SSR; fall back to useEffect on the server.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Synchronises the CSS animation identified by `animationName` across every element currently playing it, so they
 * all pulse in lockstep rather than each starting from their own offset.
 *
 * Pass the animation name string (e.g. `skeletonAnimationName`), or a falsy value to skip syncing (e.g. when the
 * animated element isn't rendered).
 */
export function useSynchronizeAnimations(animationName: string | null | undefined): void {
	useIsomorphicLayoutEffect(() => {
		if (animationName) scheduleSync(animationName);
	}, [animationName]);
}

// Animation names awaiting a sync, drained by a single rAF so any number of
// elements mounting in the same frame costs one pass over document.getAnimations().
const pendingNames = new Set<string>();
let frameId: number | null = null;

function scheduleSync(animationName: string): void {
	// Pre-2020 browsers lack these Web Animations APIs; animations still run, just not in lockstep.
	if (typeof CSSAnimation === 'undefined' || typeof document.getAnimations !== 'function') {
		return;
	}

	pendingNames.add(animationName);
	if (frameId !== null) return;

	frameId = requestAnimationFrame(() => {
		frameId = null;
		// Align every animation to the clock of the first one seen with its name.
		const referenceTimes = new Map<string, number>();
		for (const animation of document.getAnimations()) {
			if (!(animation instanceof CSSAnimation) || !pendingNames.has(animation.animationName)) {
				continue;
			}
			const referenceTime = referenceTimes.get(animation.animationName);
			if (referenceTime !== undefined) {
				animation.currentTime = referenceTime;
			} else if (typeof animation.currentTime === 'number') {
				referenceTimes.set(animation.animationName, animation.currentTime);
			}
		}
		pendingNames.clear();
	});
}
