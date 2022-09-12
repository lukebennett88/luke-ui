import chalk from 'chalk';

export default function newPackage(
	/** @type {import('plop').NodePlopAPI} */
	plop
) {
	plop.setHelper('authorName', () => 'Luke Bennett');
	plop.setHelper('authorEmail', () => 'hello@lukebennett.com.au');
	plop.setHelper('packageScope', () => '@luke-ui');
	plop.setHelper(
		'repository',
		() => 'https://github.com/lukebennett88/luke-ui'
	);
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

		actions: (answers) => {
			const actions = [];
			if (!answers) return actions;

			const { componentName, packageName } = answers;

			actions.push({
				type: 'addMany',
				templateFiles: '../plop-templates/component/**',
				base: '../plop-templates/component/',
				destination: `../packages/${packageName}`,
				data: { componentName, packageName },
			});

			actions.push({
				type: 'modify',
				path: '../playroom/src/components.ts',
				pattern: /\n/,
				template: "\nexport * from '{{ packageScope }}/{{ packageName }}';\n",
			});

			actions.push({
				type: 'modify',
				path: '../playroom/package.json',
				pattern: /"dependencies": {/,
				template:
					'"dependencies": {\n"{{ packageScope }}/{{ packageName }}": "workspace:*",\n',
			});

			actions.push({
				type: 'modify',
				path: '../docs/package.json',
				pattern: /"dependencies": {/,
				template:
					'"dependencies": {\n"{{ packageScope }}/{{ packageName }}": "workspace:*",\n',
			});

			actions.push(
				chalk.yellowBright.bold(
					'Please run the following to rename your license file:\n'
				) +
					chalk(
						`mv packages/${packageName}/LICENSE.hbs packages/${packageName}/LICENSE`
					)
			);

			actions.push(
				chalk.greenBright.bold(
					'Please run the following script to set up the new package:\n'
				) + chalk('pnpm run groom')
			);

			return actions;
		},
	});
}
