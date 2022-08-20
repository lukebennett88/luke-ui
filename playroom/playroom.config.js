module.exports = {
	title: '@luke-ui',

	baseUrl: '/playroom/',
	components: './src/components.ts',
	iframeSandbox: 'allow-scripts allow-same-origin',
	openBrowser: false,
	outputPath: '../docs/public/playroom',
	port: 9000,
	typeScriptFiles: ['../packages/**/*.{ts,tsx}', '!**/node_modules'],
};
