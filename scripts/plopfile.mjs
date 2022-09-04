import chalk from 'chalk';

export default function newPackage(
	/** @type {import('plop').NodePlopAPI} */
	plop
) {
	plop.setHelper('authorName', () => 'Luke Bennett');
	plop.setHelper('authorEmail', () => 'hello@lukebennett.com.au');
	plop.setHelper('repository', () => 'https://github.com/lukebennett88');
	plop.setHelper('website', () => 'https://luke-ui.vercel.app');
	plop.setHelper('year', () => new Date().getFullYear());

	plop.setGenerator('component', {
		description: 'Add new component',
		prompts: [
			{
				type: 'input',
				name: 'packageName',
				message: 'Package name, all lowercase (e.g. button)',
				validate: (answer) => answer.length > 0,
			},
			{
				type: 'input',
				name: 'componentName',
				message:
					'Component name, please use appropriate uppercase (e.g. Button)',
				validate: (answer) => answer.length > 0,
			},
		],

		actions: (data) => {
			const componentName = data?.componentName;
			if (!componentName) {
				throw new Error('You must provide a component name');
			}

			const packageName = data?.componentName.toLowerCase();
			if (!packageName) {
				throw new Error('You must provide a package name');
			}

			const actions = [
				{
					type: 'addMany',
					templateFiles: '../plop-templates/component/**',
					base: '../plop-templates/component/',
					destination: `../packages/${packageName}`,
					data: { componentName, packageName },
				},
			];

			console.log(
				chalk.yellowBright.bold(
					'\n\nPlease rename LICENSE.hbs to LICENSE manually in newly created package.\n'
				)
			);

			return actions;
		},
	});
}
