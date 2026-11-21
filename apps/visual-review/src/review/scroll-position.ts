/**
 * Where the review's sticky chrome ends, measured from the rendered page. The top bar and section
 * headers change height with the layout, so reading them keeps scrolling in step with the CSS.
 */

/** Marks the review's top bar, the bottom bar on phones, and each section's sticky header. */
export const CHROME_ATTRIBUTE = {
	bottomBar: 'data-review-bottom-bar',
	sectionHead: 'data-review-section-head',
	topBar: 'data-review-top-bar',
} as const;

/** The DOM id of an example's section. */
export function sectionId(exampleId: string): string {
	return `example-${exampleId.replace('/', '--')}`;
}

/** The bottom edge of the sticky top bar, in viewport pixels. */
export function stickyTop(): number {
	return (
		document.querySelector(`[${CHROME_ATTRIBUTE.topBar}]`)?.getBoundingClientRect().bottom ?? 0
	);
}

/** The top edge of the phone's bottom bar, or the viewport's bottom. */
export function stickyBottom(): number {
	const bar = document.querySelector(`[${CHROME_ATTRIBUTE.bottomBar}]`);
	return bar ? bar.getBoundingClientRect().top : window.innerHeight;
}

/**
 * A little below the top bar. The section whose top has passed this line is the one in view, so a
 * section whose capture has mostly scrolled away hands over early.
 */
export function readingLine(): number {
	return stickyTop() + Math.min(160, window.innerHeight * 0.2);
}

/** The height a section's header takes when it is stuck below the top bar. */
export function stuckHeaderHeight(exampleId: string): number {
	const head = sectionElement(exampleId)?.querySelector<HTMLElement>(
		`[${CHROME_ATTRIBUTE.sectionHead}]`,
	);
	if (!head || getComputedStyle(head).position !== 'sticky') return 0;
	return head.getBoundingClientRect().height;
}

export function sectionElement(exampleId: string): HTMLElement | null {
	return document.getElementById(sectionId(exampleId));
}

/** Scrolls so the section's header sits just below the top bar. */
export function scrollToExample(exampleId: string): void {
	const element = sectionElement(exampleId);
	if (!element) return;
	const top = element.getBoundingClientRect().top + window.scrollY - stickyTop();
	window.scrollTo({ top: Math.max(top, 0) });
}

/** Whether the section's header is stuck below the top bar, so its top has scrolled past it. */
export function isHeaderStuck(exampleId: string): boolean {
	const element = sectionElement(exampleId);
	return element ? element.getBoundingClientRect().top <= stickyTop() + 1 : false;
}
