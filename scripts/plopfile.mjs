export default function newPackage(plop) {
	plop.setHelper('repository', 'https://github.com/lukebennett88');
	plop.setHelper('website', 'https://luke-ui.vercel.app');

	// controller generator
	plop.setGenerator('component', {
		description: 'add new component',
		prompts: [
			{
				type: 'input',
				name: 'packageName',
				message: 'package name, all lowercase (e.g. button)',
				validate: (answer) => answer.length > 0,
			},
			{
				type: 'input',
				name: 'componentName',
				message:
					'component name, please use appropriate uppercase (e.g. Button)',
				validate: (answer) => answer.length > 0,
			},
		],

		actions: function (data) {
			const { componentName, packageName } = data;
			const actions = [
				{
					type: 'addMany',
					templateFiles: '../plop-templates/component/**',
					base: '../plop-templates/component/',
					destination: `../packages/${packageName}`,
					data: { componentName, packageName },
				},
			];

			return actions;
		},
	});
}
