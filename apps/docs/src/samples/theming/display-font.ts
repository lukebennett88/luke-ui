import frauncesMetrics from '@capsizecss/metrics/fraunces';
import interMetrics from '@capsizecss/metrics/inter';
import type { ThemeInput } from '@luke-ui/react/theme/compiler';

export const theme: ThemeInput = {
	color: { accent: '#3b82f6' },
	name: 'editorial',
	typography: {
		fonts: {
			body: { family: "'Inter', system-ui, sans-serif", metrics: interMetrics },
			display: { family: "'Fraunces', Georgia, serif", metrics: frauncesMetrics },
		},
		fontWeight: { heading: 700 },
	},
};
