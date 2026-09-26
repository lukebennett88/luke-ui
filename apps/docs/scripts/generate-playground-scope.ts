/**
 * Generates src/generated/playground-scope.generated.ts — the module map the
 * playground preview uses to resolve imports in user code at runtime.
 *
 * Reads the specifier list via playground-core helpers with docs host extras so
 * new `@luke-ui/react` subpaths and the shared third-party allowlist stay
 * aligned. Runs via the `generate:playground` script (wired into `docs#generate`
 * in turbo.json), so dev and build always regenerate it.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPlaygroundScopeModule } from '../../../packages/@luke-ui/playground-core/src/generate-scope.ts';
import { docsPlaygroundRuntimeSpecifierList } from '../src/lib/docs-playground-specifiers.ts';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDir, '../src/generated/playground-scope.generated.ts');

const specifiers = docsPlaygroundRuntimeSpecifierList();
const output = renderPlaygroundScopeModule(specifiers);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, output);
// oxlint-disable-next-line no-console
console.log(
	`generate-playground-scope: wrote ${specifiers.length} modules to src/generated/playground-scope.generated.ts`,
);
