import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { getStorybookBaseUrl } from './storybook';

export function baseOptions(): BaseLayoutProps {
	return {
		nav: {
			title: 'Luke UI',
		},
		links: [
			{
				text: 'Storybook',
				url: `${getStorybookBaseUrl(import.meta.env.BASE_URL)}/`,
				external: true,
			},
		],
	};
}
