import { getCentre, measureCapCentre } from './measure-cap-centre.js';

export interface FieldErrorMeasurement {
	/** Vertical centre of the cap height of the first line of message text. */
	capCentre: number;
	/** Inline start of the first line of message text. */
	firstLineStart: number;
	/** Vertical centre of the drawn error glyph. */
	iconCentre: number;
	/** Inline end of the error icon's box. */
	iconEnd: number;
	/** Inline start of the second line of message text, when the message wraps. */
	secondLineStart: number | undefined;
}

/**
 * Measures a rendered `FieldError` from the element that holds its text, the one `getByText`
 * resolves for a plain message. The message is that element's parent, and the icon is its
 * first child, which wraps the box that draws the glyph.
 */
export function measureFieldError(textElement: Element): FieldErrorMeasurement {
	const rail = textElement.parentElement?.firstElementChild;
	if (rail == null || rail.getAttribute('aria-hidden') !== 'true') {
		throw new Error('Expected the error icon before the message text.');
	}
	const icon = rail.firstElementChild;
	if (icon == null) throw new Error('Expected the error icon box inside its rail.');

	const range = document.createRange();
	range.selectNodeContents(textElement);
	const [firstLine, ...otherLines] = range.getClientRects();
	if (firstLine == null) throw new Error('Expected the message to have text.');

	const secondLine = otherLines.find((line) => line.top >= firstLine.bottom - 1);
	const iconRect = icon.getBoundingClientRect();
	const capCentre = measureCapCentre(textElement);

	return {
		capCentre,
		firstLineStart: firstLine.left,
		iconCentre: getCentre(icon),
		iconEnd: iconRect.right,
		secondLineStart: secondLine?.left,
	};
}

/** Inline start of the text node under `root` whose content is exactly `text`. */
export function getTextStart(root: Node, text: string): number {
	const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
	for (let node = walker.nextNode(); node != null; node = walker.nextNode()) {
		if (node.nodeValue?.trim() !== text) continue;

		const range = document.createRange();
		range.selectNodeContents(node);
		const [firstLine] = range.getClientRects();
		if (firstLine == null) break;

		return firstLine.left;
	}

	throw new Error(`Expected a rendered text node reading "${text}".`);
}
