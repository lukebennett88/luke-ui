import { Box } from '@luke-ui/react/box';
import type { ReactNode } from 'react';

type Layout = 'flow' | 'centered' | 'full-bleed';

const layoutToBoxProps = {
	centered: {
		alignItems: 'center',
		backgroundColor: 'surface.base',
		display: 'flex',
		justifyContent: 'center',
		padding: 'space.32',
		style: { minBlockSize: '6rem' },
	},
	flow: {
		backgroundColor: 'surface.base',
		padding: 'space.32',
		style: { minBlockSize: '6rem' },
	},
	'full-bleed': {},
} as const satisfies Record<Layout, React.ComponentProps<typeof Box>>;

/** Preview widths an example can request. `narrow` suits single-column forms and short text. */
export type PreviewWidth = 'narrow';

/** Inline size of a `narrow` preview, so example source needs no width wrapper. */
const NARROW_PREVIEW_MAX_INLINE_SIZE = '20rem';

type StoryWrapperProps = {
	children: ReactNode;
	layout?: Layout;
	previewWidth?: PreviewWidth;
};

export function StoryWrapper({ children, layout = 'flow', previewWidth }: StoryWrapperProps) {
	const boxProps = layoutToBoxProps[layout];
	return (
		<Box overflow="auto" {...boxProps}>
			{previewWidth === 'narrow' ? (
				<Box data-preview-width="narrow" style={{ maxInlineSize: NARROW_PREVIEW_MAX_INLINE_SIZE }}>
					{children}
				</Box>
			) : (
				children
			)}
		</Box>
	);
}
