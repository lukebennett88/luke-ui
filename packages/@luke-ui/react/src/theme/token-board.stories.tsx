import preview from '../../.storybook/preview.js';
import { TokenBoard } from './token-board.js';

const meta = preview.meta({
	component: TokenBoard,
	tags: ['theme'],
	title: 'Theme/Token board',
});

/**
 * Compare every resolved contract leaf across themes and colour modes. The visual test detects
 * mapping changes even when no component consumes the affected leaf. Leaf completeness lives in
 * `token-board.test.ts`.
 */
export const Board = meta.story({});
