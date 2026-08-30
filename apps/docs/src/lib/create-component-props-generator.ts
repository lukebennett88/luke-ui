import type { Generator, GeneratorOptions } from 'fumadocs-typescript';
import { createGenerator } from 'fumadocs-typescript';
import type { PropProject } from './component-prop-analysis.js';
import {
	filterGeneratedDoc,
	getSharedPropProject,
	loadExportedPropDeclaration,
	lukeUiReactSrcDir,
} from './component-prop-analysis.js';

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
		const project = await getSharedPropProject(repoRoot);
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

function relativeRepoPath(repoRoot: string, absolutePath: string): string {
	return absolutePath.startsWith(`${repoRoot}/`)
		? absolutePath.slice(repoRoot.length + 1)
		: absolutePath;
}
