import { Button } from '@luke-ui/react/button';
import type { IconProps } from '@luke-ui/react/icon';
import { createIcon, Icon, iconNames } from '@luke-ui/react/icon';
import type { TextProps } from '@luke-ui/react/text';
import { vars } from '@luke-ui/react/theme';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';

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
	accent: vars.color.intent.accent.text,
	danger: vars.color.intent.danger.text,
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

/**
 * `Icon` renders a single symbol from the configured spritesheet by name.
 */
export const Default = meta.story({
	args: baseArgs,
	play: async ({ canvas }) => {
		await expect(canvas.getByRole('img', { name: 'add' })).toBeInTheDocument();
	},
});

/**
 * Size maps to the icon size tokens: `xsmall`, `small`, `medium`, and `large`.
 */
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
 * Icon color follows the semantic content color inherited from its parent.
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
 * sizing and accessibility behavior.
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
 * Complete icon catalog. Clicking an item copies its icon name for quick use.
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
