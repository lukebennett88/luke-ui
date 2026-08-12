import { fileURLToPath, pathToFileURL } from 'node:url';
import { readFile, writeFile } from 'node:fs/promises';

const packageJsonPath = fileURLToPath(new URL('../package.json', import.meta.url));

/** Strip internal-only pack entries from the public export map and wire `#recipe-engine`. */
export async function finalizePackageManifest(targetPath: string = packageJsonPath): Promise<void> {
	const packageJson = JSON.parse(await readFile(targetPath, 'utf8')) as {
		exports: Record<string, string>;
		imports?: Record<string, string>;
	};

	delete packageJson.exports['./styles/recipe-engine'];
	delete packageJson.exports['./stylesheet'];

	packageJson.imports = {
		...packageJson.imports,
		'#recipe-engine': './dist/styles/recipe-engine.js',
	};

	await writeFile(targetPath, `${JSON.stringify(packageJson, null, '\t')}\n`);
}

const isDirectExecution =
	process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
	await finalizePackageManifest();
}
