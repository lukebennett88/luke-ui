import type { Generator, GeneratorOptions } from 'fumadocs-typescript';
import { createGenerator, createProject } from 'fumadocs-typescript';
import type { PropProject } from './component-prop-documentation.js';
import {
	filterGeneratedDoc,
	loadExportedPropDeclaration,
	lukeUiReactSrcDir,
} from './component-prop-documentation.js';

interface GenerateDocumentationOptions {
	basePath?: string;
}

/** Wraps the fumadocs generator and removes generic DOM props from component Props tables. */
export function createComponentPropsGenerator(options: GeneratorOptions = {}): Generator {
	const generator = createGenerator(options);
	const generateDocumentation = generator.generateDocumentation.bind(generator);

	generator.generateDocumentation = async (file, name, generateOptions = {}) => {
		const docs = await generateDocumentation(file, name, generateOptions);
		const basePath = (generateOptions as GenerateDocumentationOptions).basePath;
		if (name === undefined || file.path === undefined || basePath === undefined) {
			return docs;
		}

		const repoRoot = basePath;
		const project = await getSharedProject(repoRoot);
		const declaration = loadExportedPropDeclaration(
			project as PropProject,
			repoRoot,
			relativeRepoPath(repoRoot, file.path),
			name,
		);
		if (declaration === undefined) return docs;

		const reactSrcDir = lukeUiReactSrcDir(repoRoot);
		return docs.map((doc) => filterGeneratedDoc(doc, declaration, reactSrcDir));
	};

	return generator;
}

let sharedProject: Awaited<ReturnType<typeof createProject>> | undefined;

async function getSharedProject(
	repoRoot: string,
): Promise<Awaited<ReturnType<typeof createProject>>> {
	const project = await createProject({
		tsconfigPath: `${repoRoot}/apps/docs/tsconfig.json`,
	});
	sharedProject ??= project;
	return project;
}

function relativeRepoPath(repoRoot: string, absolutePath: string): string {
	return absolutePath.startsWith(`${repoRoot}/`)
		? absolutePath.slice(repoRoot.length + 1)
		: absolutePath;
}
