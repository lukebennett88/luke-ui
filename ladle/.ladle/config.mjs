/** @type {import('@ladle/react/lib/shared/types').Config} */
const config = {
	stories: '../packages/**/*.stories.{js,jsx,ts,tsx}',
	base: '/ladle/',
	outDir: '../docs/public/ladle',
	addons: {
		a11y: {
			enabled: true,
		},
	},
};

export default config;
