import { Button } from '@luke-ui/react/button';
import { createSprinkles } from '@luke-ui/react/styles';
import { mergeProps } from '@luke-ui/react/utils';
import type { CSSProperties } from 'react';
import preview from '../../.storybook/preview.js';
import { vars } from '../theme.css.js';

const meta = preview.meta({
	title: 'Foundation/Utilities',
});

const panelStyle = {
	borderColor: vars.border.default,
	borderStyle: 'dashed',
	borderWidth: 1,
	padding: '1rem',
} as const satisfies CSSProperties;

const stackStyle = {
	display: 'flex',
	flexDirection: 'column',
	gap: '1rem',
} as const satisfies CSSProperties;

/**
 * `createSprinkles` returns a `className` and `style` object for token-aware, type-safe
 * layout utilities. Use it with any element's `className` and `style` props.
 */
export const Layout = meta.story({
	render: () => {
		const container = createSprinkles({
			display: 'flex',
			flexDirection: 'column',
			gap: 'medium',
			padding: 'large',
		});
		const row = createSprinkles({
			alignItems: 'center',
			display: 'flex',
			gap: 'small',
		});
		return (
			<div {...mergeProps({ style: panelStyle }, container)}>
				<div {...row}>
					<div
						{...mergeProps(
							{ style: { background: vars.backgroundColor.neutral } },
							createSprinkles({ inlineSize: '100%', minInlineSize: '0', padding: 'medium' }),
						)}
					>
						Row item 1
					</div>
					<div
						{...mergeProps(
							{ style: { background: vars.backgroundColor.neutral } },
							createSprinkles({ flexGrow: '1', padding: 'medium' }),
						)}
					>
						Row item 2 (grows)
					</div>
				</div>
			</div>
		);
	},
});

/**
 * Responsive values use object notation keyed by breakpoint names. Values
 * cascade from smaller to larger breakpoints, so only changes need to be
 * specified.
 */
export const Responsive = meta.story({
	render: () => {
		const responsive = createSprinkles({
			display: 'flex',
			flexDirection: { medium: 'row', xsmall: 'column' },
			gap: { medium: 'large', xsmall: 'small' },
			padding: { large: 'xlarge', xsmall: 'small' },
		});
		return (
			<div {...mergeProps({ style: panelStyle }, responsive)}>
				<div
					style={{
						background: vars.backgroundColor.neutral,
						padding: '1rem',
					}}
				>
					Resize viewport to see flex direction change at 768px.
				</div>
				<div
					style={{
						background: vars.backgroundColor.neutral,
						padding: '1rem',
					}}
				>
					Second item
				</div>
			</div>
		);
	},
});

/**
 * Pseudo-state conditions apply styles on hover or focus-visible. Use
 * `backgroundColor` with a condition object.
 */
export const PseudoStates = meta.story({
	render: () => {
		const interactive = createSprinkles({
			backgroundColor: { default: 'neutral', focusVisible: 'input', hover: 'neutralHover' },
			padding: 'medium',
		});
		return (
			<div style={stackStyle}>
				<button {...mergeProps({ type: 'button' }, interactive)}>
					Hover or focus this button to see backgroundColor change
				</button>
			</div>
		);
	},
});

/**
 * Combine `createSprinkles` with React Aria Components' `render` prop to style the
 * underlying DOM element while preserving RAC behavior and accessibility.
 * Use `mergeProps` to merge the provided DOM props with `createSprinkles()` output.
 */
export const WithRenderProp = meta.story({
	render: () => {
		const buttonBox = createSprinkles({
			backgroundColor: { default: 'neutral', hover: 'neutralHover' },
			padding: 'medium',
		});
		return (
			<Button
				render={(props) => (
					<button {...mergeProps(props, buttonBox)} type="button">
						Button with createSprinkles utilities
					</button>
				)}
			>
				Button with createSprinkles utilities
			</Button>
		);
	},
});

/**
 * Overflow and sizing utilities control content clipping and element
 * dimensions. Use `textOverflow: 'ellipsis'` with `inlineSize` constraints
 * for truncation patterns.
 */
export const OverflowAndSizing = meta.story({
	render: () => {
		const truncate = createSprinkles({
			display: 'block',
			inlineSize: '100%',
			maxInlineSize: '20rem',
			minInlineSize: '0',
			overflowX: 'clip',
			textOverflow: 'ellipsis',
		});
		return (
			<div style={stackStyle}>
				<div {...truncate}>
					This text is truncated with an ellipsis when it exceeds the max-inline-size of 20rem.
					Lorem ipsum dolor sit amet.
				</div>
			</div>
		);
	},
});
