import type { HeadingProps } from '@luke-ui/react/heading';
import { Heading } from '@luke-ui/react/heading';
import type { CSSProperties } from 'react';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: Heading,
	tags: ['typography'],
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
 * Override visual heading size with `size` while preserving semantic level.
 */
export const SizeOverride = meta.story({
	args: {
		level: 2,
	},
	render: (props) => (
		<div style={stackStyle}>
			<Heading {...props}>Level 2 semantic and visual</Heading>
			<Heading {...props} size="500">
				Level 2 semantic, size 500
			</Heading>
			<Heading {...props} size="900">
				Level 2 semantic, display size 900
			</Heading>
		</div>
	),
});

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
