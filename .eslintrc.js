/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
	root: true,
	// This tells ESLint to load the config from the package `eslint-config-luke-ui`
	extends: ['luke-ui'],
	settings: {
		next: {
			rootDir: ['apps/*/'],
		},
	},
};
