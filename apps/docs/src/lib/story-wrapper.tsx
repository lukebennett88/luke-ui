import { Box } from '@luke-ui/react/box';
import type { ReactNode } from 'react';
import * as styles from './story-wrapper.css.js';

type Layout = 'flow' | 'centered' | 'full-bleed';

const layoutToBoxProps = {
	centered: {
		alignItems: 'center',
		backgroundColor: 'surface.base',
		display: 'flex',
		justifyContent: 'center',
		padding: 'space.32',
		className: styles.minimumHeight,
	},
	flow: {
		backgroundColor: 'surface.base',
		padding: 'space.32',
		className: styles.minimumHeight,
	},
	'full-bleed': {},
} as const satisfies Record<Layout, React.ComponentProps<typeof Box>>;

/** Preview widths an example can request. `narrow` suits single-column forms and short text. */
export type PreviewWidth = 'narrow';

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
				<Box className={styles.narrowPreview} data-preview-width="narrow">
					{children}
				</Box>
			) : (
				children
			)}
		</Box>
	);
}
