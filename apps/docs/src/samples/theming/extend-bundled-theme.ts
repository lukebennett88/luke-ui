import type { ExtendingThemeInput } from '@luke-ui/react/theme/compiler';
import { theme as paperTheme } from '@luke-ui/theme-paper/input';

export const theme: ExtendingThemeInput = {
	color: { accent: '#3b82f6' },
	extends: paperTheme,
	name: 'product',
};
