import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { getStorybookBaseUrl } from './storybook';

export function baseOptions(): BaseLayoutProps {
	return {
		links: [
			{
				text: 'Playground',
				url: '/playground',
			},
			{
				external: true,
				text: 'Storybook',
				url: `${getStorybookBaseUrl(import.meta.env.BASE_URL)}/`,
			},
		],
		nav: {
			title: 'Luke UI',
		},
	};
}
