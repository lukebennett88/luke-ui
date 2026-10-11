import interMetrics from '@capsizecss/metrics/inter';
import type { ThemeInput } from '@luke-ui/react/theme/compiler';

export const theme: ThemeInput = {
	color: { accent: '#3b82f6', neutralStyle: 'cool' },
	name: 'product',
	typography: {
		fonts: {
			body: { family: "'Inter', system-ui, sans-serif", metrics: interMetrics },
		},
	},
};
