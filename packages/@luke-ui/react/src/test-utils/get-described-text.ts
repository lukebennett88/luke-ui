export function getDescribedText(element: Element): string {
	const describedBy = element.getAttribute('aria-describedby');
	if (describedBy == null) return '';

	return describedBy
		.split(' ')
		.map((id) => document.getElementById(id)?.textContent ?? '')
		.join(' ')
		.trim();
}
