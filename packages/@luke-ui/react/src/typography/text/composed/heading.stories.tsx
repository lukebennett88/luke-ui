import type { HeadingProps } from '@luke-ui/react/typography/composed';
import { Heading } from '@luke-ui/react/typography/composed';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../../../../.storybook/preview.js';

const meta = preview.meta({
	component: Heading,
	title: 'Typography/Heading',
});

const stackStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
	maxInlineSize: '40rem',
} as const satisfies CSSProperties;

const levels = [1, 2, 3, 4, 5, 6] as const satisfies Array<NonNullable<HeadingProps['level']>>;

/**
 * Use `level` to define heading hierarchy and default heading size.
 */
export const Level = meta.story({
	play: async ({ canvas }) => {
		await expect(canvas.getByRole('heading', { name: /Level 1/ })).toBeInTheDocument();
	},
	render: (props) => (
		<div style={stackStyle}>
			{levels.map((level) => (
				<Heading {...props} key={level} level={level}>
					Level {level} heading
				</Heading>
			))}
		</div>
	),
});

/**
 * Use `elementType` to control the rendered element while keeping heading styles.
 */
export const ElementType = meta.story({
	args: {
		level: 2,
	},
	render: (props) => (
		<div style={stackStyle}>
			<Heading {...props}>Default element (h2)</Heading>
			<Heading {...props} elementType="div">
				Rendered as div, still level 2 for assistive tech
			</Heading>
			<Heading {...props} elementType="span">
				Rendered as span, still level 2 for assistive tech
			</Heading>
		</div>
	),
});

/**
 * Override visual heading size with `elementType` while preserving semantic level.
 */
export const OverridingFontStyles = meta.story({
	args: {
		level: 2,
	},
	render: (props) => (
		<div style={stackStyle}>
			<Heading {...props}>Level 2 semantic and visual</Heading>
			<Heading {...props} elementType="h4">
				Level 2 semantic, h4 visual style
			</Heading>
			<Heading {...props} elementType="h1">
				Level 2 semantic, h1 visual style
			</Heading>
		</div>
	),
});

/**
 * Truncate heading content when layout is constrained.
 */
export const Truncate = meta.story({
	args: {
		level: 2,
		lineClamp: 1,
	},
	render: (props) => (
		<div style={{ inlineSize: '20rem' }}>
			<Heading {...props}>A flat-file CMS stores content in files rather than a database.</Heading>
		</div>
	),
});
