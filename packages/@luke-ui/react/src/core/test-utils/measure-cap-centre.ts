/**
 * Vertical centre of the cap height of the first line of text in `textElement`.
 *
 * A zero-width inline box that is `1cap` tall sits at the start of the element's first text run
 * and inherits that element's font, so its centre is the cap centre. The probe is removed before
 * returning.
 */
export function measureCapCentre(textElement: Element): number {
	const probe = document.createElement('span');
	probe.style.display = 'inline-block';
	probe.style.inlineSize = '0';
	probe.style.blockSize = '1cap';
	textElement.prepend(probe);
	try {
		const { height, top } = probe.getBoundingClientRect();
		return top + height / 2;
	} finally {
		probe.remove();
	}
}

/** Vertical centre of `element`'s border box. */
export function getCentre(element: Element): number {
	const { height, top } = element.getBoundingClientRect();
	return top + height / 2;
}

/** Vertical position of the baseline of the first line of text in `textElement`. */
export function measureBaseline(textElement: Element): number {
	const probe = document.createElement('span');
	probe.style.display = 'inline-block';
	probe.style.blockSize = '0';
	probe.style.inlineSize = '0';
	textElement.prepend(probe);
	try {
		return probe.getBoundingClientRect().bottom;
	} finally {
		probe.remove();
	}
}
