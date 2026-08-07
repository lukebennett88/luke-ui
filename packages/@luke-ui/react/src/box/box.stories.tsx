import type { BoxProps } from '@luke-ui/react/box';
import { Box } from '@luke-ui/react/box';
import { vars } from '@luke-ui/react/theme';
import type { ComponentPropsWithRef } from 'react';
import { expect } from 'storybook/test';
import preview from '../../.storybook/preview.js';

const meta = preview.meta({
	component: Box,
	tags: ['layout'],
	title: 'Layout/Box',
});

/** Use Box for responsive layout without attaching layout props to semantic components. */
export const Default = meta.story({
	args: {
		children: (
			<>
				<span>First item</span>
				<span>Second item</span>
			</>
		),
		display: 'flex',
		flexDirection: { initial: 'column', medium: 'row' },
		gap: { initial: '200', medium: '600' },
		padding: { initial: '300', medium: '600' },
		style: { backgroundColor: vars.color.surface.recessed },
	} satisfies Partial<BoxProps>,
	play: async ({ canvas }) => {
		const box = canvas.getByText('First item').parentElement;
		if (!box) throw new Error('Expected Box parent.');

		await expect(getComputedStyle(box).display).toBe('flex');
		await expect(getComputedStyle(box).flexDirection).toBe('row');
		await expect(getComputedStyle(box).gap).toBe('24px');
	},
});

/** `elementType` picks the rendered element. Its DOM props follow that element. */
export const CustomElement = meta.story({
	render: () => (
		<Box
			elementType="a"
			href="/account"
			padding="400"
			style={{ backgroundColor: vars.color.surface.recessed }}
		>
			Account summary
		</Box>
	),
	play: async ({ canvas }) => {
		const link = canvas.getByRole('link', { name: 'Account summary' });
		await expect(link.tagName).toBe('A');
		await expect(link).toHaveAttribute('href', '/account');
		await expect(getComputedStyle(link).padding).toBe('16px');
	},
});

export const CustomDiv = meta.story({
	args: {
		'aria-label': 'Account summary',
		children: 'Account summary content',
		className: 'consumer-class',
		id: 'account-summary',
		padding: '400',
		render: (domProps) => <MotionDiv {...domProps} />,
		style: { backgroundColor: vars.color.surface.recessed },
	} satisfies Partial<BoxProps>,
	play: async ({ canvas }) => {
		const div = canvas.getByText('Account summary content');
		await expect(div).toHaveClass('consumer-class');
		await expect(div).toHaveAttribute('data-motion', 'enabled');
		await expect(div).toHaveAttribute('id', 'account-summary');
		await expect(getComputedStyle(div).padding).toBe('16px');
		await expect(getComputedStyle(div).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
	},
});

function MotionDiv(props: ComponentPropsWithRef<'div'>) {
	return <div data-motion="enabled" {...props} />;
}
