import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from 'vite-plus/test';
import {
	VISUAL_ARTIFACTS_DIR,
	VISUAL_CACHE_DIR,
	VISUAL_CACHE_HASH_FILES,
	VISUAL_REPORT_DIR,
	VISUAL_REPORT_INDEX,
	VISUAL_SUMMARY_FILE,
	visualPackageRoot,
	visualRepoRootFromPackage,
} from './visual-regression-contract.js';

const packageRoot = visualPackageRoot(import.meta.url);
const repoRoot = visualRepoRootFromPackage(packageRoot);
const workflowPath = path.join(repoRoot, '.github/workflows/visual-regression.yml');
const docsPath = path.join(repoRoot, 'docs/VISUAL_TESTING.md');

test('workflow hashFiles matches the visual harness file list', () => {
	const workflow = readFileSync(workflowPath, 'utf8');
	const hashFiles = workflow.match(/hashFiles\(([\s\S]*?)\)/);
	if (hashFiles?.[1] == null) {
		throw new Error(`Expected hashFiles(...) in ${workflowPath}`);
	}

	const listed = [...hashFiles[1].matchAll(/'([^']+)'/g)].map((match) => match[1]);
	expect(listed).toEqual([...VISUAL_CACHE_HASH_FILES]);
});

test('workflow and docs use VISUAL_ARTIFACTS_DIR', () => {
	const workflow = readFileSync(workflowPath, 'utf8');
	const docs = readFileSync(docsPath, 'utf8');

	expect(workflow).toContain(`path: ${VISUAL_CACHE_DIR}`);
	expect(workflow).toContain(VISUAL_SUMMARY_FILE);
	expect(workflow).toContain(`path: ${VISUAL_REPORT_DIR}`);
	expect(workflow.match(/\.artifacts\/visual-regression/g)?.length).toBe(3);

	expect(docs).toContain(VISUAL_REPORT_INDEX);
	expect(docs).toContain(VISUAL_ARTIFACTS_DIR);
});
