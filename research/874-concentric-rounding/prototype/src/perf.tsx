import { createElement } from 'react';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { BoxComponent, BoxProps } from './box.js';

/** A captured element: padding, radius, border, background, children. See `trees/README.md`. */
type Skeleton = {
	b?: number;
	bg?: 0 | 1;
	k?: Array<Skeleton>;
	p?: [number, number, number, number];
	r?: number;
};

const spaceSteps = [0, 4, 8, 12, 16, 24, 32, 40, 48, 64, 96];
const radiusSteps = [
	['detail', 4],
	['control', 8],
	['surface', 12],
	['overlay', 16],
] as const;

function nearest<Value>(steps: ReadonlyArray<readonly [Value, number]>, target: number): Value {
	let best = steps[0]!;
	for (const step of steps) {
		if (Math.abs(step[1] - target) < Math.abs(best[1] - target)) best = step;
	}
	return best[0];
}

function space(px: number) {
	const step = nearest(
		spaceSteps.map((value) => [value, value] as const),
		px,
	);
	return step === 0 ? '0' : `space.${step}`;
}

/**
 * Rebuilds a captured page with Box. An element with padding, a border, or a radius becomes a Box
 * with the nearest tokens, and every other element a plain `div`. With `adopt`, a rounded element
 * inside another rounded element asks for `concentric` instead of its own radius.
 */
function replay(
	node: Skeleton,
	Box: BoxComponent,
	adopt: boolean,
	count: { concentric: number },
	insideRadius = false,
): ReactNode {
	const children = node.k?.map((child, index) => {
		const element = replay(child, Box, adopt, count, insideRadius || node.r !== undefined);
		return <Keyed key={index}>{element}</Keyed>;
	});
	if (node.p === undefined && node.r === undefined && node.b === undefined) {
		return <div>{children}</div>;
	}
	const props: BoxProps = {};
	if (node.p) {
		const [top, right, bottom, left] = node.p;
		if (top === right && top === bottom && top === left) props.padding = space(top);
		else {
			if (top) props.paddingBlockStart = space(top);
			if (bottom) props.paddingBlockEnd = space(bottom);
			if (left) props.paddingInlineStart = space(left);
			if (right) props.paddingInlineEnd = space(right);
		}
	}
	if (node.b) {
		props.borderStyle = 'solid';
		props.borderWidth = node.b > 1 ? 'thick' : 'thin';
	}
	if (node.r !== undefined) {
		const token = node.r > 100 ? 'full' : nearest(radiusSteps, node.r);
		props.borderRadius = adopt && insideRadius ? 'concentric' : token;
		if (adopt && insideRadius) count.concentric++;
	}
	if (node.bg) props.backgroundColor = 'rgb(0 0 0 / 0.04)';
	return createElement(Box, props, children);
}

function Keyed(props: { children: ReactNode }) {
	return props.children;
}

/** 2,000 cards with three nested rounded Boxes each: the stress case from the first round. */
function stress(): Skeleton {
	const card: Skeleton = {
		k: [{ k: [{ k: [{ p: [4, 4, 4, 4], r: 4 }], p: [4, 8, 4, 8], r: 8 }], p: [4, 4, 4, 4], r: 12 }],
		p: [8, 8, 8, 8],
		r: 16,
	};
	return { k: Array.from({ length: 2000 }, () => card) };
}

/** Runs `step` until 150 ms have passed, five times, and returns the median time per call. */
function time(step: () => void) {
	const batches: Array<number> = [];
	for (let batch = 0; batch < 5; batch++) {
		const start = performance.now();
		let calls = 0;
		let elapsed = 0;
		while (elapsed < 150) {
			step();
			calls++;
			elapsed = performance.now() - start;
		}
		batches.push(elapsed / calls);
	}
	return batches.toSorted((a, b) => a - b)[2]!;
}

/** Forces style and layout, so the time lands inside the measurement. */
function layout() {
	void document.body.offsetHeight;
}

export function mountPerf(Box: BoxComponent) {
	const container = document.querySelector('#root')!;

	const run = async (name: string, adopt: boolean) => {
		const skeleton: Skeleton =
			name === 'stress' ? stress() : await (await fetch(`/trees/${name}.json`)).json();
		const count = { concentric: 0 };
		const app = replay(skeleton, Box, adopt, count);

		let root = createRoot(container);
		const mountMs = time(() => {
			root.unmount();
			root = createRoot(container);
			flushSync(() => root.render(app));
			layout();
		});

		// A theme switch changes every radius token, so every element is restyled.
		const restyleMs = time(() => {
			document.documentElement.classList.toggle('theme-round');
			layout();
		});

		// Adding and removing a rounded subtree is what makes `:has()` re-evaluate on ancestors.
		const rounded = [...container.querySelectorAll<HTMLElement>('#root div')].filter((element) => {
			return Number.parseFloat(getComputedStyle(element).borderTopLeftRadius) > 0;
		});
		const subject = rounded.find((element) => element.querySelector('div')) ?? rounded[0];
		let insertMs = 0;
		if (subject?.parentElement) {
			const parent = subject.parentElement;
			insertMs = time(() => {
				const copy = subject.cloneNode(true);
				parent.append(copy);
				layout();
				copy.remove();
				layout();
			});
		}

		// A state change on one element that has nothing to do with the feature.
		const leaf = container.querySelector<HTMLElement>('#root div:not(:has(*))') ?? container;
		const toggleMs = time(() => {
			leaf.toggleAttribute('data-hovered');
			leaf.style.opacity = leaf.hasAttribute('data-hovered') ? '0.99' : '';
			layout();
		});

		return {
			concentric: count.concentric,
			elements: container.querySelectorAll('*').length,
			insertMs,
			mountMs,
			restyleMs,
			toggleMs,
		};
	};
	Object.assign(window, { runPerf: run });
}
