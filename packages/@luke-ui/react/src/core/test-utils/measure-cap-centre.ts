/**
 * Vertical centre of the cap height of the first line of text in `textElement`.
 *
 * A zero-width inline box that is `1cap` tall sits on the baseline at the start of the element's
 * first line and inherits its font, so its centre is the cap centre. The probe is removed before
 * returning.
 */
export function measureCapCentre(textElement: Element): number {
	const { height, top } = measureProbe(textElement, '1cap');
	return top + height / 2;
}

/** Vertical position of the baseline of the first line of text in `textElement`. */
export function measureBaseline(textElement: Element): number {
	return measureProbe(textElement, '0').bottom;
}

function measureProbe(textElement: Element, blockSize: string): DOMRect {
	const probe = document.createElement('span');
	probe.style.display = 'inline-block';
	probe.style.inlineSize = '0';
	probe.style.blockSize = blockSize;
	textElement.prepend(probe);
	try {
		return probe.getBoundingClientRect();
	} finally {
		probe.remove();
	}
}
