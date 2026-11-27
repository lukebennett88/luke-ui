/**
 * Where the review's sticky chrome ends, measured from the rendered page. The top bar and section
 * headers change height with the layout, so reading them keeps scrolling in step with the CSS.
 */

/** The DOM id of the top bar. */
export const TOP_BAR_ID = 'top-bar';

/** The bottom edge of the sticky top bar, in viewport pixels. */
function stickyTop(): number {
	return document.getElementById(TOP_BAR_ID)?.getBoundingClientRect().bottom ?? 0;
}

/**
 * A little below the top bar. The section whose top has passed this line is the one in view, so a
 * section whose capture has mostly scrolled away hands over early.
 */
export function readingLine(): number {
	return stickyTop() + Math.min(160, window.innerHeight * 0.2);
}

/** The height a section's header takes when it is stuck below the top bar. */
function stuckHeaderHeight(head: HTMLElement | null): number {
	if (!head || getComputedStyle(head).position !== 'sticky') return 0;
	return head.getBoundingClientRect().height;
}

/** A section's top on screen and how far its capture is scrolled sideways, to come back to. */
export type CapturePosition = { left: number; top: number };

export function capturePosition(
	section: HTMLElement | null,
	stage: HTMLElement | null,
): CapturePosition {
	return {
		left: stage?.scrollLeft ?? 0,
		top: section?.getBoundingClientRect().top ?? stickyTop(),
	};
}

export function restoreCapturePosition(
	section: HTMLElement,
	stage: HTMLElement | null,
	position: CapturePosition,
): void {
	window.scrollBy({ top: section.getBoundingClientRect().top - position.top });
	stage?.scrollTo({ left: position.left });
}

/** Scrolls so the section's header sits just below the top bar. */
export function scrollToSection(section: HTMLElement): void {
	const top = section.getBoundingClientRect().top + window.scrollY - stickyTop();
	window.scrollTo({ top: Math.max(top, 0) });
}

/** The elements around a difference's outline that scrolling to it reads. */
type DifferenceFrame = {
	/** The sticky header of the outline's section. */
	head: HTMLElement | null;
	section: HTMLElement;
	/** The stage that scrolls a capture wider than it sideways. */
	stage: HTMLElement | null;
};

/**
 * Centres a difference's outline between the sticky chrome, and a capture wider than its stage
 * scrolls sideways to it. The section's own top never scrolls below the reading line, or the example
 * in view, and so what the top bar acts on, would change under the reviewer.
 */
export function scrollDifferenceIntoView(
	outline: HTMLElement,
	{ head, section, stage }: DifferenceFrame,
): void {
	const box = outline.getBoundingClientRect();
	const top = stickyTop() + stuckHeaderHeight(head);
	const bottom = window.innerHeight;
	const minDelta = section.getBoundingClientRect().top - readingLine() + 8;
	window.scrollBy({ top: Math.max(box.top + box.height / 2 - (top + bottom) / 2, minDelta) });
	if (!stage || stage.scrollWidth <= stage.clientWidth) return;
	const stageBox = stage.getBoundingClientRect();
	stage.scrollLeft += box.left + box.width / 2 - (stageBox.left + stageBox.width / 2);
}
