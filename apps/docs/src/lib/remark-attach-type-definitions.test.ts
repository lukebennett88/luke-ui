import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vite-plus/test';
import {
	remarkAttachTypeDefinitions,
	resetTypeDefinitionsOutputCleanGuardForTests,
} from './remark-attach-type-definitions.js';

const outputDirs: Array<string> = [];

afterEach(() => {
	for (const dir of outputDirs) {
		rmSync(dir, { recursive: true, force: true });
	}
	outputDirs.length = 0;
	resetTypeDefinitionsOutputCleanGuardForTests();
});

test('clears obsolete definition assets once when the plugin is created', () => {
	const outputDir = makeOutputDir('stale-clean');
	writeFileSync(join(outputDir, 'obsolete.json'), '{"Stale":{"definition":"x","name":"Stale"}}\n');

	const plugin = remarkAttachTypeDefinitions({ outputDir });
	expect(existsSync(join(outputDir, 'obsolete.json'))).toBe(false);

	const docId = 'docs/components/layout/grid';
	const fileId = createHash('sha1').update(docId).digest('hex').slice(0, 16);
	const tree = {
		type: 'root',
		children: [
			{
				type: 'mdxJsxFlowElement',
				name: 'ComponentPropsTable',
				attributes: [
					{
						type: 'mdxJsxAttribute',
						name: 'type',
						value: {
							type: 'mdxJsxAttributeValueExpression',
							value: JSON.stringify({
								id: docId,
								entries: [],
								typeDefinitions: {
									RequiredInitialResponsiveValue: {
										definition: 'type RequiredInitialResponsiveValue<Value> = Value;',
										name: 'RequiredInitialResponsiveValue',
									},
								},
							}),
						},
					},
				],
			},
		],
	};

	plugin(tree);

	const writtenPath = join(outputDir, `${fileId}.json`);
	expect(existsSync(writtenPath)).toBe(true);
	expect(JSON.parse(readFileSync(writtenPath, 'utf8'))).toEqual({
		RequiredInitialResponsiveValue: {
			definition: 'type RequiredInitialResponsiveValue<Value> = Value;',
			name: 'RequiredInitialResponsiveValue',
		},
	});

	const node = tree.children[0]!;
	expect(node.attributes.some((attr) => attr.name === 'definitionsHref')).toBe(true);
	expect(node.attributes.some((attr) => attr.name === 'definitionNames')).toBe(true);

	// A second plugin for the same dir must not wipe assets written in this process.
	writeFileSync(join(outputDir, 'keep-me.json'), '{}\n');
	remarkAttachTypeDefinitions({ outputDir });
	expect(existsSync(join(outputDir, 'keep-me.json'))).toBe(true);
	expect(existsSync(writtenPath)).toBe(true);
});

function makeOutputDir(label: string): string {
	const outputDir = join(
		process.cwd(),
		'node_modules',
		'.cache',
		'luke-ui-type-definitions-tests',
		`${label}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
	);
	mkdirSync(outputDir, { recursive: true });
	outputDirs.push(outputDir);
	return outputDir;
}
