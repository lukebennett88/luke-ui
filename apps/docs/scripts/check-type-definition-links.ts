import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	findBuiltTypeDefinitionTables,
	findTypeDefinitionLinkIssues,
} from '../src/lib/check-type-definition-links.js';

const clientAssetsDir = fileURLToPath(new URL('../dist/client/assets/', import.meta.url));
const issues = findTypeDefinitionLinkIssues(clientAssetsDir);

if (issues.length > 0) {
	for (const issue of issues) {
		console.error(`check:type-definition-links: ${issue}`);
	}
	process.exitCode = 1;
} else {
	const { tables } = findBuiltTypeDefinitionTables(clientAssetsDir);
	const assets = new Set(tables.map((table) => table.assetFile));
	console.log(
		`check:type-definition-links: ${String(tables.length)} API table(s) across ${String(assets.size)} definition asset(s) passed at ${resolve(clientAssetsDir)}`,
	);
}
