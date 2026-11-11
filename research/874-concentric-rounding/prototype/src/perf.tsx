import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { BoxComponent } from './box.js';

// 2,000 cards, each a surface with three nested Boxes: 8,000 Boxes with geometry, 6,000 of them
// nested. The concentric build asks for `concentric` on those; the baseline sets a token radius by hand.
function Cards({ Box, inner }: { Box: BoxComponent; inner: string }) {
	const cards: Array<ReactNode> = [];
	for (let index = 0; index < 2000; index++) {
		cards.push(
			<Box borderRadius="overlay" key={index} padding={{ bp768: 'space.12', initial: 'space.8' }}>
				<Box borderRadius={inner} padding="space.4">
					<Box borderRadius={inner} paddingBlock="space.4" paddingInline="space.8">
						<Box borderRadius={inner} padding="space.4">
							{index}
						</Box>
					</Box>
				</Box>
			</Box>,
		);
	}
	return <>{cards}</>;
}

function median(values: Array<number>) {
	return values.toSorted((a, b) => a - b)[values.length >> 1]!;
}

const Parity = createContext<'a' | 'b' | null>(null);

/**
 * The React cost of the #876 design, without its inline properties: every Box reads a context and
 * every Box with geometry provides one.
 */
function withContext(Box: BoxComponent): BoxComponent {
	return function ContextBox(props) {
		const parent = useContext(Parity);
		const hasGeometry = Object.keys(props).some((name) => /^(padding|border)/.test(name));
		const element = <Box {...props} />;
		if (!hasGeometry) return element;
		return <Parity value={parent === 'a' ? 'b' : 'a'}>{element}</Parity>;
	};
}

export function mountPerf(PlainBox: BoxComponent, defaultInner: string) {
	// `?inner=control` on the concentric build measures Boxes that never ask for the feature.
	const inner = new URLSearchParams(location.search).get('inner') ?? defaultInner;
	const Box = location.search.includes('context') ? withContext(PlainBox) : PlainBox;
	const container = document.querySelector('#root')!;
	const run = () => {
		const mounts: Array<number> = [];
		for (let index = 0; index < 9; index++) {
			const root = createRoot(container);
			const start = performance.now();
			flushSync(() => root.render(<Cards Box={Box} inner={inner} />));
			void document.body.offsetHeight;
			mounts.push(performance.now() - start);
			if (index < 8) root.unmount();
		}
		// A theme switch changes every radius token, so every Box's style is recomputed.
		const restyles: Array<number> = [];
		for (let index = 0; index < 40; index++) {
			const start = performance.now();
			document.documentElement.classList.toggle('theme-round');
			void getComputedStyle(container.lastElementChild!.querySelector('div div div')!)
				.borderTopLeftRadius;
			void document.body.offsetHeight;
			restyles.push(performance.now() - start);
		}
		const styled = [...container.querySelectorAll('[style]')];
		return {
			boxes: container.querySelectorAll('div').length,
			inlineProperties: styled.reduce((sum, element) => {
				return sum + (element as HTMLElement).style.length;
			}, 0),
			mountMs: median(mounts),
			restyleMs: median(restyles),
		};
	};
	Object.assign(window, { runPerf: run });
}
