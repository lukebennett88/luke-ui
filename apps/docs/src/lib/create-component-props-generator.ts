import type { GeneratedDoc, Generator, GeneratorOptions } from 'fumadocs-typescript';
import { createGenerator } from 'fumadocs-typescript';
import type { PropProject } from './component-prop-analysis.js';
import {
	filterGeneratedDoc,
	getSharedPropProject,
	loadExportedPropDeclaration,
	lukeUiReactSrcDir,
	typeForwardsDomProps,
} from './component-prop-analysis.js';
import { NATIVE_PROPS_FORWARDING_KEY, renderNativePropsNote } from './component-prop-groups.js';

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
		const forwardsDomProps = typeForwardsDomProps(declaration, reactSrcDir);
		return docs.map((doc) =>
			markNativePropsForwarding(
				filterGeneratedDoc(doc, declaration, reactSrcDir),
				name,
				forwardsDomProps,
			),
		);
	};

	return generator;
}

/**
 * Appends a reserved entry carrying the native-props note markdown, so the client-side table can
 * render it without importing the ts-morph analysis that decided the type forwards DOM props.
 */
function markNativePropsForwarding(
	doc: GeneratedDoc,
	exportName: string,
	forwardsDomProps: boolean,
): GeneratedDoc {
	if (!forwardsDomProps) return doc;

	return {
		...doc,
		entries: [
			...doc.entries,
			{
				deprecated: false,
				description: renderNativePropsNote(exportName),
				name: NATIVE_PROPS_FORWARDING_KEY,
				required: true,
				simplifiedType: '',
				tags: [],
				type: '',
			},
		],
	};
}

function relativeRepoPath(repoRoot: string, absolutePath: string): string {
	return absolutePath.startsWith(`${repoRoot}/`)
		? absolutePath.slice(repoRoot.length + 1)
		: absolutePath;
}
