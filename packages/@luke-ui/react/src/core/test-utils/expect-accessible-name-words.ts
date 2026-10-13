import { computeAccessibleName } from 'dom-accessibility-api';
import { expect } from 'vite-plus/test';
import { cdp } from 'vite-plus/test/context';

/**
 * Asserts that Chromium's accessibility tree and `dom-accessibility-api` both name `element` with
 * exactly the words in `expected`. Words compare in any order, because the order React Aria joins
 * name parts in is not a contract.
 */
export async function expectAccessibleNameWords(element: Element, expected: string): Promise<void> {
	const expectedWords = toSortedWords(expected);
	const chromiumName = await getChromiumAccessibleName(element);
	const domName = computeAccessibleName(element);
	expect(
		toSortedWords(chromiumName),
		`Chromium accessibility tree name: ${JSON.stringify(chromiumName)}`,
	).toEqual(expectedWords);
	expect(toSortedWords(domName), `dom-accessibility-api name: ${JSON.stringify(domName)}`).toEqual(
		expectedWords,
	);
}

const WHITESPACE_PATTERN = /\s+/;
const PROBE_ATTRIBUTE = 'data-accessible-name-probe';

function toSortedWords(name: string): Array<string> {
	return name
		.split(WHITESPACE_PATTERN)
		.filter((word) => word !== '')
		.sort();
}

/** Reads the element's name from Chromium's own accessibility tree. */
async function getChromiumAccessibleName(element: Element): Promise<string> {
	const session = cdp();
	const probe = crypto.randomUUID();
	element.setAttribute(PROBE_ATTRIBUTE, probe);

	try {
		// Tests run in an iframe, so pierce frames to find the element from the top document.
		await session.send('DOM.getDocument', { depth: -1, pierce: true });
		const { resultCount, searchId } = await session.send('DOM.performSearch', {
			query: `[${PROBE_ATTRIBUTE}="${probe}"]`,
		});

		try {
			if (resultCount !== 1) {
				throw new Error(`Expected one element to probe, found ${resultCount}.`);
			}
			const { nodeIds } = await session.send('DOM.getSearchResults', {
				fromIndex: 0,
				searchId,
				toIndex: 1,
			});
			const { nodes } = await session.send('Accessibility.getPartialAXTree', {
				fetchRelatives: false,
				nodeId: nodeIds[0],
			});
			const name = nodes[0]?.name?.value;
			if (typeof name !== 'string') throw new Error('Expected Chromium to name the element.');
			return name;
		} finally {
			await session.send('DOM.discardSearchResults', { searchId });
		}
	} finally {
		element.removeAttribute(PROBE_ATTRIBUTE);
	}
}
