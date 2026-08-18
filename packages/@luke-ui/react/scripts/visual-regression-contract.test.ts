import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vite-plus/test';
import { VISUAL_CACHE_HASH_FILES } from './visual-regression-contract.js';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(packageRoot, '../../..');
const workflowPath = path.join(repoRoot, '.github/workflows/visual-regression.yml');

test('workflow hashFiles matches the visual harness file list', () => {
	const workflow = readFileSync(workflowPath, 'utf8');
	const hashFiles = workflow.match(/hashFiles\(([\s\S]*?)\)/);
	if (hashFiles?.[1] == null) {
		throw new Error(`Expected hashFiles(...) in ${workflowPath}`);
	}

	const listed = [...hashFiles[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
	expect(listed).toEqual([...VISUAL_CACHE_HASH_FILES]);
});
