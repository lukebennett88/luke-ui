import { STAGE_PADDING, TOP_BAR_HEIGHT } from '../styles/sizes.js';
import type { StageMetrics } from './stage.js';

/** Room kept below a capture fitted to the screen. */
const SCREEN_MARGIN = 16;
const MIN_WIDTH = 120;
const MIN_SCREEN_HEIGHT = 160;

/**
 * The space a capture can take. Phones show the stages edge to edge.
 */
export function stageMetrics({
	isCompact,
	mainWidth,
	viewportHeight,
}: {
	isCompact: boolean;
	/** The content width of the column the examples scroll in. */
	mainWidth: number;
	viewportHeight: number;
}): StageMetrics {
	const chromeHeight = isCompact ? TOP_BAR_HEIGHT.compact : TOP_BAR_HEIGHT.regular;
	return {
		availableWidth: Math.max(mainWidth - (isCompact ? 0 : 2 * STAGE_PADDING.inline), MIN_WIDTH),
		screenHeight: Math.max(viewportHeight - chromeHeight - SCREEN_MARGIN, MIN_SCREEN_HEIGHT),
	};
}
