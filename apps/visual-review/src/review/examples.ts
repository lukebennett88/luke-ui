import type { Capture } from '../report/schema.js';
import { STATUS_LABELS } from './review-params.js';

/**
 * One component example, such as `checkbox-field/kitchen-sink`, with each theme it was captured in.
 * The review shows one section per example and its themes as tabs.
 */
export type Example = {
	captures: Array<Capture>;
	component: string;
	/**
	 * `component/name` for an example captured in themes. A capture with no theme suffix is an example
	 * of its own, with the id `capture:<capture id>`, so it never joins a themed example of the same
	 * name.
	 */
	id: string;
	name: string;
};

const THEME_PATTERN = /-(paper|tactile|flat)-(light|dark)$/;
const THEME_ORDER = [
	'paper-light',
	'paper-dark',
	'tactile-light',
	'tactile-dark',
	'flat-light',
	'flat-dark',
];

/**
 * Groups captures by example. A capture named `primary-paper-dark` belongs to the `primary` example,
 * and its themes sort Paper before Tactile, light before dark. A capture with no theme suffix is an
 * example of its own. Examples keep the order of the captures they first appear in.
 */
export function groupExamples(captures: ReadonlyArray<Capture>): Array<Example> {
	const examples = new Map<string, Example>();
	for (const capture of captures) {
		const isThemed = THEME_PATTERN.test(capture.name);
		const name = capture.name.replace(THEME_PATTERN, '');
		const id = isThemed ? `${capture.component}/${name}` : `capture:${capture.id}`;
		const example = examples.get(id);
		if (example) example.captures.push(capture);
		else examples.set(id, { captures: [capture], component: capture.component, id, name });
	}
	for (const example of examples.values()) {
		example.captures.sort((a, b) => themeRank(a) - themeRank(b));
	}
	return [...examples.values()];
}

/** `Paper dark` for `primary-paper-dark`, or the capture's name when it has no theme. */
export function themeLabel(capture: Capture): string {
	const match = THEME_PATTERN.exec(capture.name);
	if (!match) return capture.name;
	const [, family = '', mode = ''] = match;
	return `${family.charAt(0).toUpperCase()}${family.slice(1)} ${mode}`;
}

/** Whether an example's captures are themes of it, so the review names the theme in view. */
export function hasThemes(example: Example): boolean {
	return example.captures.length > 1 || example.captures.some((c) => THEME_PATTERN.test(c.name));
}

/** The example and theme, such as `primary · Paper dark`, or the name alone. */
export function exampleLabel(example: Example, capture: Capture): string {
	return hasThemes(example) ? `${example.name} · ${themeLabel(capture)}` : example.name;
}

/** How much of a changed capture differs, such as `0.42%`, or the status of any other capture. */
export function describeShare(capture: Capture): string {
	if (capture.status !== 'changed') return STATUS_LABELS[capture.status];
	const { height, mismatchedPixels, width } = capture;
	if (!width || !height || mismatchedPixels === undefined) return STATUS_LABELS.changed;
	const share = (mismatchedPixels / (width * height)) * 100;
	if (share === 0) return '0%';
	return share < 0.01 ? 'under 0.01%' : `${share.toFixed(2)}%`;
}

/** `1024 × 768`, or nothing when the report does not know the size. */
export function describeSize(capture: Capture): string {
	return capture.width && capture.height ? `${capture.width} × ${capture.height}` : '';
}

function themeRank(capture: Capture) {
	const match = THEME_PATTERN.exec(capture.name);
	return match ? THEME_ORDER.indexOf(`${match[1]}-${match[2]}`) : -1;
}
