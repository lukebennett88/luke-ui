import { Button } from '@luke-ui/react/actions';
import { vars } from '@luke-ui/react/theme';
import { tokenKeys, tokens } from '@luke-ui/react/tokens';
import type { IconProps } from '@luke-ui/react/visuals';
import { createIcon, Icon, iconNames } from '@luke-ui/react/visuals';
import type { CSSProperties } from 'react';
import { expect } from 'storybook/test';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: Icon,
	title: 'Visuals/Icon',
});

const baseArgs = {
	name: 'add',
	title: 'add',
} as const satisfies Partial<IconProps>;

const iconSizes: Array<NonNullable<IconProps['size']>> = [
	'xsmall',
	'small',
	'medium',
	'large',
];
const colors = tokenKeys(tokens.foregroundColor);

const wrapStyle = {
	display: 'grid',
	gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))',
	gap: '1rem',
} as const satisfies CSSProperties;

const iconItemStyle = {
	alignItems: 'center',
	display: 'flex',
	gap: '0.5rem',
} as const satisfies CSSProperties;

const iconButtonStyle = {
	blockSize: 'auto',
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
	inlineSize: '100%',
	paddingBlock: '2rem',
	paddingInline: '1rem',
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
 * Icon color follows `currentColor`, so any foreground token can be applied.
 */
export const Color = meta.story({
	args: baseArgs,
	render: (props) => (
		<div style={wrapStyle}>
			{colors.map((color) => (
				<div key={color} style={iconItemStyle}>
					<Icon {...props} style={{ color: vars.color[color] }} />
					<span>{color}</span>
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
				<HeartIcon title="Favorite" size="xsmall" />
				<span>xsmall</span>
			</div>
			<div style={iconItemStyle}>
				<HeartIcon title="Favorite" size="small" />
				<span>small</span>
			</div>
			<div style={iconItemStyle}>
				<HeartIcon title="Favorite" size="medium" />
				<span>medium</span>
			</div>
			<div style={iconItemStyle}>
				<HeartIcon title="Favorite" size="large" />
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
						tone="neutral"
						onPress={() => {
							navigator.clipboard.writeText(name);
						}}
						style={iconButtonStyle}
					>
						<Icon {...props} name={name} title={name} />
						{name}
					</Button>
				</li>
			))}
		</ul>
	),
});
