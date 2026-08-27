import { Button } from '@luke-ui/react/button';
import type { IconProps } from '@luke-ui/react/icon';
import { createIcon, Icon, iconNames } from '@luke-ui/react/icon';
import type { TextProps } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import type { CSSProperties } from 'react';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: Icon,
	tags: ['visuals'],
	title: 'Visuals/Icon',
});

const baseArgs = {
	name: 'add',
	title: 'add',
} as const satisfies Partial<IconProps>;

const iconSizes: Array<NonNullable<IconProps['size']>> = ['xsmall', 'small', 'medium', 'large'];
const colors = {
	accent: vars.color.foreground.accent.rest,
	danger: vars.color.foreground.danger.rest,
	primary: vars.color.text.primary,
	secondary: vars.color.text.secondary,
} as const satisfies Partial<Record<NonNullable<TextProps['color']>, string>>;

const wrapStyle = {
	display: 'grid',
	gap: '1rem',
	gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))',
} as const satisfies CSSProperties;

const iconItemStyle = {
	alignItems: 'center',
	display: 'flex',
	gap: '0.5rem',
} as const satisfies CSSProperties;

const HeartIcon = createIcon({
	path: (
		<path d="M12 21a1 1 0 0 1-.7-.3L5 14.5a5 5 0 1 1 7-6 5 5 0 1 1 7 6l-6.3 6.2a1 1 0 0 1-.7.3Z" />
	),
});

export const Default = meta.story({
	args: baseArgs,
});

export const Sizes = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={wrapStyle}>
			{iconSizes.map((size) => (
				<Icon key={size} {...props} size={size} />
			))}
		</div>
	),
});

/**
 * Icon colour follows the semantic content colour inherited from its parent.
 */
export const Color = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={wrapStyle}>
			{Object.entries(colors).map(([name, color]) => (
				<div key={name} style={{ ...iconItemStyle, color }}>
					<Icon {...props} />
					<span>{name}</span>
				</div>
			))}
		</div>
	),
});

/**
 * Build a one-off icon component with `createIcon` while keeping Luke UI icon
 * sizing and accessibility behaviour.
 */
export const CreateYourOwnIcon = meta.story({
	render: () => (
		<div style={wrapStyle}>
			<div style={iconItemStyle}>
				<HeartIcon size="xsmall" title="Favorite" />
				<span>xsmall</span>
			</div>
			<div style={iconItemStyle}>
				<HeartIcon size="small" title="Favorite" />
				<span>small</span>
			</div>
			<div style={iconItemStyle}>
				<HeartIcon size="medium" title="Favorite" />
				<span>medium</span>
			</div>
			<div style={iconItemStyle}>
				<HeartIcon size="large" title="Favorite" />
				<span>large</span>
			</div>
		</div>
	),
});

/**
 * Select an item in the complete icon catalogue to copy its name.
 */
export const AllIcons = meta.story({
	args: baseArgs,
	render: (props) => (
		<ul style={wrapStyle}>
			{iconNames.map((name) => (
				<li key={name} style={iconItemStyle}>
					<Button
						appearance="subtle"
						isBlock
						onPress={async () => {
							await navigator.clipboard.writeText(name);
						}}
						startIcon={<Icon {...props} name={name} title={name} />}
						tone="neutral"
					>
						{name}
					</Button>
				</li>
			))}
		</ul>
	),
});
