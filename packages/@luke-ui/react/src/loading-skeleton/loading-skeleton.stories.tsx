import { Button } from '@luke-ui/react/button';
import { LoadingSkeleton, LoadingSkeletonProvider } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: LoadingSkeleton,
	tags: ['feedback'],
	title: 'Feedback/LoadingSkeleton',
});

const stackStyle = {
	alignItems: 'start',
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
} as const satisfies CSSProperties;

const rowStyle = {
	alignItems: 'center',
	display: 'flex',
	gap: '1rem',
} as const satisfies CSSProperties;

/** Text children render as an inline skeleton that matches the final text. */
export const Default = meta.story({
	args: {
		children: 'Loading placeholder text',
	},
	play: async ({ canvas }) => {
		const skeleton = canvas.getByText('Loading placeholder text');

		await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
		await expect(skeleton).toHaveAttribute('tabIndex', '-1');
		await expect(getComputedStyle(skeleton).color).toBe('rgba(0, 0, 0, 0)');

		const [animation] = requireSkeletonAnimations(skeleton);
		if (!animation?.effect) throw new Error('Expected skeleton animation effect.');

		await expect(animation.effect.getTiming()).toMatchObject({
			direction: 'normal',
			duration: 2000,
		});

		try {
			await expect(await samplePulseBrightness(skeleton, animation, 50)).toBe(1);
			await expect(await samplePulseBrightness(skeleton, animation, 150)).toBe(1);

			const outwardBrightness = await samplePulseBrightness(skeleton, animation, 600);
			await expect(outwardBrightness).toBeGreaterThan(0.88);
			await expect(outwardBrightness).toBeLessThan(1);

			await expect(await samplePulseBrightness(skeleton, animation, 1050)).toBe(0.88);
			await expect(await samplePulseBrightness(skeleton, animation, 1150)).toBe(0.88);

			const returnBrightness = await samplePulseBrightness(skeleton, animation, 1600);
			await expect(returnBrightness).toBeGreaterThan(0.88);
			await expect(returnBrightness).toBeLessThan(1);
		} finally {
			animation.play();
		}
	},
});

/** Element children keep their footprint while the skeleton is painted over them. */
export const WrappingComponent = meta.story({
	render: () => (
		<LoadingSkeleton>
			<Button>Submit</Button>
		</LoadingSkeleton>
	),
});

/** Wrap text directly so each line gets its own skeleton shape. */
export const MultilineText = meta.story({
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('span[aria-hidden]')).toBeInTheDocument();
	},
	render: () => (
		<div style={{ maxInlineSize: '16rem' } as const satisfies CSSProperties}>
			<LoadingSkeleton>
				A short paragraph of placeholder copy that wraps across two lines.
			</LoadingSkeleton>
		</div>
	),
});

/** Use `elementType` when parent markup needs an element other than `span`. */
export const ElementType = meta.story({
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelector('li[aria-hidden]')).toBeInTheDocument();
	},
	render: () => (
		<ul>
			<LoadingSkeleton elementType="li">List item placeholder</LoadingSkeleton>
		</ul>
	),
});

/** Use `radius` when the visible control is rounded below the direct child. */
export const Radius = meta.story({
	play: async ({ canvasElement }) => {
		const skeletonSurface = requireElement(canvasElement, '[aria-hidden] > *');

		await advanceSkeletonPulseToFadePoint(skeletonSurface);

		const skeletonOverlayStyles = getComputedStyle(skeletonSurface, '::after');
		const expectedRadius =
			getComputedStyle(canvasElement).getPropertyValue('--luke-radius-control');

		await expect(skeletonOverlayStyles.opacity).toBe('1');
		await expect(skeletonOverlayStyles.borderRadius).toBe(expectedRadius);
		await expect(getBrightnessFilterValue(skeletonOverlayStyles.filter)).toBeLessThanOrEqual(0.9);

		// The surface itself (not just its `::after` overlay) must carry the same radius: its
		// `overflow: hidden` clips to its own corners, and its flat background sits directly
		// beneath the overlay, so a square surface would show through the overlay's rounded recess.
		await expect(getComputedStyle(skeletonSurface).borderRadius).toBe(expectedRadius);
	},
	render: () => (
		<LoadingSkeleton radius="control">
			<TextField label="Email" name="email" />
		</LoadingSkeleton>
	),
});

/** Wrap fixed-size elements for placeholders such as avatars or media blocks. */
export const CustomDimensions = meta.story({
	render: () => (
		<div style={rowStyle}>
			<LoadingSkeleton>
				<div style={{ borderRadius: '9999px', height: '3rem', width: '3rem' }} />
			</LoadingSkeleton>
			<LoadingSkeleton>
				<div style={{ height: '3rem', width: '10rem' }} />
			</LoadingSkeleton>
		</div>
	),
});

/** Pass `isLoading={false}` to render children unchanged. */
export const Loaded = meta.story({
	play: async ({ canvas }) => {
		await expect(canvas.getByRole('button', { name: 'Submit' })).toBeEnabled();
	},
	render: () => (
		<LoadingSkeleton isLoading={false}>
			<Button>Submit</Button>
		</LoadingSkeleton>
	),
});

/** The provider controls descendant skeletons and overrides local `isLoading` props. */
export const Provider = meta.story({
	play: async ({ canvasElement }) => {
		await expect(canvasElement.querySelectorAll('[aria-hidden]')).toHaveLength(3);
	},
	render: () => (
		<LoadingSkeletonProvider isLoading>
			<div style={stackStyle}>
				<LoadingSkeleton isLoading={false}>
					<Text elementType="p">A paragraph of placeholder text</Text>
				</LoadingSkeleton>
				<LoadingSkeleton isLoading={false}>Some more inline placeholder text</LoadingSkeleton>
				<LoadingSkeleton isLoading={false}>
					<Button>Submit</Button>
				</LoadingSkeleton>
			</div>
		</LoadingSkeletonProvider>
	),
});

async function advanceSkeletonPulseToFadePoint(element: Element) {
	const animations = requireSkeletonAnimations(element);

	for (const animation of animations) {
		const timing = animation.effect?.getTiming();

		animation.pause();
		animation.currentTime = Number(timing?.delay ?? 0) + Number(timing?.duration ?? 0) * 0.5;
	}

	await new Promise(requestAnimationFrame);
}

async function samplePulseBrightness(
	element: Element,
	animation: CSSAnimation,
	activeTime: number,
) {
	const timing = animation.effect?.getTiming();
	animation.pause();
	animation.currentTime = Number(timing?.delay ?? 0) + activeTime;
	await new Promise(requestAnimationFrame);
	return getBrightnessFilterValue(getComputedStyle(element).filter);
}

function getBrightnessFilterValue(filter: string) {
	const match = /^brightness\((?<value>[\d.]+)\)$/.exec(filter);

	if (!match?.groups?.value) {
		throw new Error(`Expected brightness filter, received "${filter}".`);
	}

	return Number(match.groups.value);
}

function requireElement(parent: ParentNode, selector: string) {
	const element = parent.querySelector(selector);

	if (!element) {
		throw new Error(`Expected element matching "${selector}".`);
	}

	return element;
}

function requireSkeletonAnimations(element: Element) {
	const animations = element
		.getAnimations({ subtree: true })
		.filter((candidate): candidate is CSSAnimation => {
			return (
				candidate instanceof CSSAnimation &&
				candidate.effect instanceof KeyframeEffect &&
				candidate.effect.target === element
			);
		});

	if (animations.length === 0) {
		throw new Error('Expected skeleton CSS animation.');
	}

	return animations;
}
