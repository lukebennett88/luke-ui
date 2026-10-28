import type { ThemeInput } from '@luke-ui/react/theme/compiler';
import { theme as paperTheme } from '@luke-ui/theme-paper/input';

export const theme: ThemeInput = {
	...paperTheme,
	name: 'product',
	color: { ...paperTheme.color, accent: '#3b82f6' },
	radius: { ...paperTheme.radius, control: 8 },
};
