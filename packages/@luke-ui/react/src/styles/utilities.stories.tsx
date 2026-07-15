import { Button } from '@luke-ui/react/button';
import { createSprinkles } from '@luke-ui/react/styles';
import { mergeProps } from '@luke-ui/react/utils';
import type { CSSProperties } from 'react';
import preview from '../../.storybook/preview.js';
import { vars } from '../theme/index.js';

const meta = preview.meta({
	title: 'Foundation/Utilities',
});

const panelStyle = {
	borderColor: vars.color.border.decorative,
	borderStyle: 'dashed',
	borderWidth: 1,
	padding: '1rem',
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
			gap: '400',
			padding: '600',
		});
		const row = createSprinkles({
			alignItems: 'center',
			display: 'flex',
			gap: '300',
		});
		return (
			<div {...mergeProps({ style: panelStyle }, container)}>
				<div {...row}>
					<div
						{...mergeProps(
							{ style: { background: vars.color.surface.resting } },
							createSprinkles({ inlineSize: '100%', minInlineSize: '0', padding: '400' }),
						)}
					>
						Row item 1
					</div>
					<div
						{...mergeProps(
							{ style: { background: vars.color.surface.resting } },
							createSprinkles({ flexGrow: '1', padding: '400' }),
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
			gap: { medium: '600', xsmall: '300' },
			padding: { large: '800', xsmall: '300' },
		});
		return (
			<div {...mergeProps({ style: panelStyle }, responsive)}>
				<div
					style={{
						background: vars.color.surface.resting,
						padding: '1rem',
					}}
				>
					Resize viewport to see flex direction change at 768px.
				</div>
				<div
					style={{
						background: vars.color.surface.resting,
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
 * Combine `createSprinkles` with React Aria Components' `render` prop to style the
 * underlying DOM element while preserving RAC behavior and accessibility.
 * Use `mergeProps` to merge the provided DOM props with `createSprinkles()` output.
 */
export const WithRenderProp = meta.story({
	render: () => {
		const buttonBox = createSprinkles({
			padding: '400',
		});
		const customStyle = mergeProps(buttonBox, {
			style: { backgroundColor: vars.color.intent.accent.surface.solid },
		});
		return (
			<Button
				render={(props) => (
					<button {...mergeProps(props, customStyle)} type="button">
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
 * Sprinkles controls the layout and overflow needed for truncation. Consumer styles provide the
 * single-line text behaviour that is deliberately outside the layout utility surface.
 */
export const OverflowAndSizing = meta.story({
	render: () => {
		const truncate = createSprinkles({
			display: 'block',
			inlineSize: '100%',
			maxInlineSize: '20rem',
			minInlineSize: '0',
			overflowX: 'hidden',
		});
		const truncateText = mergeProps(truncate, {
			style: { textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
		});
		return (
			<div>
				<div {...truncateText}>
					This text is truncated with an ellipsis when it exceeds the max-inline-size of 20rem.
					Lorem ipsum dolor sit amet.
				</div>
			</div>
		);
	},
});
