import type { ThemeInput } from '@luke-ui/react/theme/compiler';
import { theme as paperTheme } from '@luke-ui/theme-paper/input';

export const theme: ThemeInput = {
	...paperTheme,
	name: 'product',
	typography: {
		...paperTheme.typography,
		fonts: { ...paperTheme.typography.fonts, code: "'Fira Code', ui-monospace, monospace" },
	},
};
