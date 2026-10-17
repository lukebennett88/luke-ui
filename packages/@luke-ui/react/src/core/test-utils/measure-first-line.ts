/**
 * Vertical centre of the cap height of the first line of text in `textElement`, measured with the
 * element's own font.
 */
export function measureCapCentre(textElement: Element): number {
	const { height, top } = measureProbe(textElement, '1cap');
	return top + height / 2;
}

/** Vertical position of the baseline of the first line of text in `textElement`. */
export function measureBaseline(textElement: Element): number {
	return measureProbe(textElement, '0').bottom;
}

/**
 * Measures a zero-width inline box placed on the baseline at the start of `textElement`'s first
 * line. It inherits the element's font. The probe is removed before returning.
 */
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
