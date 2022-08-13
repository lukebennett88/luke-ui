export default function newPackage(plop) {
	const currentYear = new Date(Date.now()).getUTCFullYear();
	plop.setHelper('currentYear', () => currentYear);

	plop.setHelper('replace', function (match, replacement, options) {
		const string = options.fn(this);
		return string.replace(match, replacement);
	});

	plop.setHelper('includes', function (array, string) {
		return array.includes(string);
	});

	// controller generator
	plop.setGenerator('component', {
		description: 'add new component',
		prompts: [
			{
				type: 'input',
				name: 'packageName',
				message: 'package name, all lowercase (e.g. textfield)',
				validate: (answer) => answer.length > 0,
			},
			{
				type: 'input',
				name: 'componentName',
				message:
					'component name, please use appropriate uppercase (e.g. TextField)',
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
