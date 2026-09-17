import { Box } from '@luke-ui/react/box';
import type { ContainerProps } from '@luke-ui/react/container';
import { Container } from '@luke-ui/react/container';
import type { ReactNode } from 'react';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: Container,
	tags: ['layout'],
	title: 'Layout/Container',
});

/** Constrain content to a maximum inline size and centre it. */
export const Default = meta.story({
	args: {
		children: <Specimen>Content stays within the selected maximum inline size.</Specimen>,
		maxInlineSize: 'ct672',
		paddingInline: 'sp16',
	} satisfies ContainerProps,
});

export const Main = meta.story({
	args: {
		children: <Specimen>Page content</Specimen>,
		elementType: 'main',
		maxInlineSize: 'ct896',
		paddingInline: 'sp16',
	} satisfies ContainerProps,
});

function Specimen({ children }: { children: ReactNode }) {
	return (
		<Box
			backgroundColor="surface.floating"
			borderColor="decorative"
			borderRadius="detail"
			borderStyle="solid"
			borderWidth="thin"
			padding="sp16"
		>
			{children}
		</Box>
	);
}
