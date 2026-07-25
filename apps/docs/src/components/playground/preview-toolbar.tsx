import { IconButton } from '@luke-ui/react/icon-button';
import type { Dispatch, SetStateAction } from 'react';
import type { ViewportWidth } from './viewport-toggle.js';
import { ViewportToggle } from './viewport-toggle.js';

interface PreviewToolbarProps {
	/** Whether the preview panel currently fills the viewport. */
	isFullscreen: boolean;
	/** Called with the next fullscreen state when the toggle is pressed. */
	onFullscreenChange: Dispatch<SetStateAction<boolean>>;
	/** Called when the preview viewport width changes. */
	onViewportChange: (width: ViewportWidth) => void;
	/** Current preview viewport width. */
	viewportWidth: ViewportWidth;
}

/**
 * Toolbar for controls that act only on the preview pane, not the whole
 * playground page. Rendered by the preview panel so it stays with the thing
 * it controls, and stays available whether or not the panel is fullscreen.
 */
export function PreviewToolbar({
	isFullscreen,
	onFullscreenChange,
	onViewportChange,
	viewportWidth,
}: PreviewToolbarProps) {
	return (
		<div className="flex shrink-0 items-center justify-between gap-2 border-fd-border border-b bg-fd-background px-2 py-1.5 sm:px-3">
			<ViewportToggle onChange={onViewportChange} value={viewportWidth} />
			<IconButton
				appearance="ghost"
				aria-label={isFullscreen ? 'Exit fullscreen preview' : 'Enter fullscreen preview'}
				icon={isFullscreen ? 'minimize' : 'expand'}
				onPress={() => onFullscreenChange((prev) => !prev)}
				size="small"
			/>
		</div>
	);
}
