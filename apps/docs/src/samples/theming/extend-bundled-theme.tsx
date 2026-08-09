import { defineTheme } from '@luke-ui/react/theme';
import { theme as tactileTheme } from '@luke-ui/react/themes/tactile';

export const css = defineTheme({
	color: { accent: '#3b82f6' },
	extends: tactileTheme,
	name: 'product',
});
