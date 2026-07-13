import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared';
import { ThemeControls } from '../components/theme-controls';
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
			children: <ThemeControls />,
			title: 'Luke UI',
		},
		themeSwitch: {
			enabled: false,
		},
	};
}
