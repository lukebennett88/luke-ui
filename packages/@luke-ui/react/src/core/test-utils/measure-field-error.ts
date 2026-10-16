export interface FieldErrorMeasurement {
	/** Vertical centre of the first line's capitals. */
	firstLineCapCentre: number;
	/** Inline start of the first line of message text. */
	firstLineStart: number;
	/** Vertical centre of the error icon's rail, which centres the glyph. */
	iconCentre: number;
	/** Inline end of the error icon's rail. */
	iconEnd: number;
	/** Inline start of the second line of message text, when the message wraps. */
	secondLineStart: number | undefined;
}

/**
 * Measures a rendered `FieldError` from the element that holds its text, the one `getByText`
 * resolves for a plain message. A zero-width cap-height probe measures its first line.
 */
export function measureFieldError(textElement: Element): FieldErrorMeasurement {
	const icon = textElement.parentElement?.firstElementChild?.querySelector('[aria-hidden="true"]');
	if (icon == null || icon.getAttribute('aria-hidden') !== 'true') {
		throw new Error('Expected the error icon before the message text.');
	}

	const capProbe = document.createElement('span');
	Object.assign(capProbe.style, {
		blockSize: '1cap',
		display: 'inline-block',
		inlineSize: '0',
		verticalAlign: 'baseline',
	});
	textElement.prepend(capProbe);
	const capRect = capProbe.getBoundingClientRect();
	capProbe.remove();

	const range = document.createRange();
	range.selectNodeContents(textElement);
	const [firstLine, ...otherLines] = range.getClientRects();
	if (firstLine == null) throw new Error('Expected the message to have text.');

	const secondLine = otherLines.find((line) => line.top >= firstLine.bottom - 1);
	const iconRect = icon.getBoundingClientRect();

	return {
		firstLineCapCentre: capRect.top + capRect.height / 2,
		firstLineStart: firstLine.left,
		iconCentre: iconRect.top + iconRect.height / 2,
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
