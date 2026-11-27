import type { Dispatch, RefObject } from 'react';
import { useEffect, useEffectEvent } from 'react';
import type { ExampleSectionHandle } from './example-section.js';
import type { ReviewAction } from './review-state.js';
import { readingLine } from './scroll-position.js';

type ScrollSpyOptions = {
	/** The example the top bar acts on now. */
	currentId: string | undefined;
	dispatch: Dispatch<ReviewAction>;
	/**
	 * A sheet or drawer locks the page's scroll, which can move it, and an example still to come into
	 * view is about to. Either way the example in view stays put.
	 */
	isPaused: boolean;
	/** The element the sections lay out in. Its size changes whenever they move without a scroll. */
	mainRef: RefObject<HTMLElement | null>;
	/** The rendered sections, by example id. */
	sectionsRef: RefObject<Map<string, ExampleSectionHandle>>;
	/** The examples on the page, in order, including closed examples with unseen captures. */
	sections: ReadonlyArray<{ id: string; isEligible: boolean }>;
};

/**
 * Keeps the example in view current as the page scrolls. It is the last eligible one whose top has
 * passed the reading line, or, above the first, the first eligible one in reach. A little hysteresis
 * keeps the boundary from flickering.
 */
export function useScrollSpy(options: ScrollSpyOptions): void {
	const { dispatch, mainRef, sectionsRef } = options;
	const spy = useEffectEvent(() => {
		if (options.isPaused) return;
		const line = readingLine();
		const rendered = options.sections.flatMap((section) => {
			const handle = sectionsRef.current.get(section.id);
			return handle ? [{ ...section, top: handle.position().top }] : [];
		});
		let candidate = -1;
		for (const [index, section] of rendered.entries()) {
			if (section.isEligible && section.top <= line) candidate = index;
		}
		if (candidate === -1) {
			candidate = rendered.findIndex(
				(section) => section.isEligible && section.top < window.innerHeight * 0.75,
			);
		}
		if (candidate === -1) return;
		const currentIndex = rendered.findIndex((section) => section.id === options.currentId);
		const current = rendered[currentIndex];
		if (
			currentIndex > candidate &&
			current?.isEligible &&
			current.top < line + 48 &&
			current.top > line - 4
		) {
			return;
		}
		const next = rendered[candidate]?.id;
		if (next && next !== options.currentId) dispatch({ exampleId: next, type: 'wentTo' });
	});

	useEffect(() => {
		const main = mainRef.current;
		if (!main) return;
		// Observing fires once at the start, then whenever sections open, fold, filter, or zoom.
		const handleChange = () => spy();
		const observer = new ResizeObserver(handleChange);
		observer.observe(main);
		window.addEventListener('scroll', handleChange, { passive: true });
		return () => {
			observer.disconnect();
			window.removeEventListener('scroll', handleChange);
		};
	}, [mainRef]);
}
