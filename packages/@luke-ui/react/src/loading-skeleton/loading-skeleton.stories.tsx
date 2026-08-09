import { Button } from '@luke-ui/react/button';
import { LoadingSkeleton, LoadingSkeletonProvider } from '@luke-ui/react/loading-skeleton';
import { Text } from '@luke-ui/react/text';
import { TextField } from '@luke-ui/react/text-field';
import type { CSSProperties } from 'react';
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
	render: () => (
		<ul>
			<LoadingSkeleton elementType="li">List item placeholder</LoadingSkeleton>
		</ul>
	),
});

/** Use `radius` when the visible control is rounded below the direct child. */
export const Radius = meta.story({
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

export const Loaded = meta.story({
	render: () => (
		<LoadingSkeleton isLoading={false}>
			<Button>Submit</Button>
		</LoadingSkeleton>
	),
});

/** The provider controls descendant skeletons and overrides local `isLoading` props. */
export const Provider = meta.story({
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
