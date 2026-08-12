import { fileURLToPath } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';

const packageJsonPath = fileURLToPath(new URL('../package.json', import.meta.url));
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as {
	exports: Record<string, string>;
	imports?: Record<string, string>;
};

delete packageJson.exports['./styles/recipe-engine'];

packageJson.imports = {
	...packageJson.imports,
	'#recipe-engine': './dist/styles/recipe-engine.js',
};

await writeFile(packageJsonPath, `${JSON.stringify(packageJson, null, '\t')}\n`);
