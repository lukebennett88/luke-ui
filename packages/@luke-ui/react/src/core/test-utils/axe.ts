import axe from 'axe-core';
import { expect } from 'vite-plus/test';

export async function expectNoAxeViolations(container: HTMLElement) {
	const results = await axe.run(container);

	expect(
		results.violations.map((violation) => ({
			id: violation.id,
			nodes: violation.nodes.map((node) => node.html),
		})),
	).toEqual([]);
}

/** Elements that hold visible text directly, the nodes axe's colour-contrast rule evaluates. */
export function visibleTextElements(container: HTMLElement): Array<Element> {
	return [...container.querySelectorAll('*')].filter((element) => {
		const holdsText = [...element.childNodes].some((node) => {
			return node.nodeType === Node.TEXT_NODE && node.textContent?.trim() !== '';
		});
		return (
			holdsText && element.checkVisibility({ opacityProperty: true, visibilityProperty: true })
		);
	});
}

/**
 * Runs axe's colour-contrast rule and requires a measured pass for every visible text element in
 * `container`. Zero violations alone is not enough: axe reports a node it cannot measure, such as
 * text over a gradient, as incomplete, and skips a node it does not recognise as text.
 */
export async function expectAxeContrastPasses(container: HTMLElement) {
	const results = await axe.run(container, { runOnly: ['color-contrast'] });
	const nodes = (outcome: 'incomplete' | 'passes' | 'violations') => {
		return results[outcome].flatMap((rule) => rule.nodes);
	};
	const passed = new Set(
		nodes('passes').map((node) => document.querySelector(String(node.target[0]))),
	);

	expect({
		incomplete: nodes('incomplete').map((node) => ({
			html: node.html,
			reason: node.any[0]?.message,
		})),
		unevaluated: visibleTextElements(container)
			.filter((element) => !passed.has(element))
			.map((element) => element.outerHTML),
		violations: nodes('violations').map((node) => node.html),
	}).toEqual({ incomplete: [], unevaluated: [], violations: [] });
}
