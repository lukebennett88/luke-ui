# AI-Native Package Docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship versioned, AI-readable documentation under `packages/@luke-ui/react/docs/`, generated from JSDoc + TypeScript types, with the same Markdown rendered by both the npm tarball and the hosted Fumadocs site.

**Architecture:** A single `tsx` script (`scripts/generate-docs.ts`) parses `package.json#exports`, walks each export's TypeScript surface with `ts-morph`, extracts JSDoc and prop types, and emits one Markdown file per export under `packages/@luke-ui/react/docs/`. Co-located prose lives in `*.docs.md` (renamed from `*.docs.mdx`); the generator splices it into the rendered page. The hosted `apps/docs` site renders the same generated `.md` via a thin `<RenderMarkdown>` component, ensuring hosted and packaged outputs are byte-identical. Generated artifacts are committed; CI fails if regeneration would change the working tree.

**Tech Stack:** `ts-morph` (type/JSDoc parsing), `tsdown` (existing bundler with lifecycle hooks), Fumadocs (existing MDX docs), `tsx`, vanilla-extract, react-aria-components, pnpm workspace, Turbo.

**Decisions reference:** All structural choices are documented in [docs/adr/0003-package-docs-surface.md](../../adr/0003-package-docs-surface.md). When this plan and the ADR conflict, the ADR wins; update the plan.

---

## File map

### New files

| Path                                                                     | Purpose                                                                             |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| `packages/@luke-ui/react/scripts/generate-docs.ts`                       | Generator entry; orchestrates discovery, parsing, rendering, writing                |
| `packages/@luke-ui/react/scripts/lib/discover-exports.ts`                | Reads `package.json#exports`, classifies each as `component` / `barrel` / `asset`   |
| `packages/@luke-ui/react/scripts/lib/parse-types.ts`                     | `ts-morph` wrapper: extracts props, JSDoc, defaults from a TS source file           |
| `packages/@luke-ui/react/scripts/lib/render-page.ts`                     | Renders a single per-export `.md` page from extracted data + prose                  |
| `packages/@luke-ui/react/scripts/lib/render-index.ts`                    | Renders `README.md` index region and `llms.txt`; takes `includeLibraryAuthors` flag |
| `packages/@luke-ui/react/scripts/lib/render-llms-full.ts`                | Concatenates per-export pages into `llms-full.md`                                   |
| `packages/@luke-ui/react/scripts/lib/__tests__/discover-exports.test.ts` | Unit tests                                                                          |
| `packages/@luke-ui/react/scripts/lib/__tests__/parse-types.test.ts`      | Unit tests                                                                          |
| `packages/@luke-ui/react/scripts/lib/__tests__/render-page.test.ts`      | Snapshot tests                                                                      |
| `packages/@luke-ui/react/scripts/lib/__tests__/render-index.test.ts`     | Unit tests with audience flag matrix                                                |
| `packages/@luke-ui/react/.gitattributes`                                 | Marks `docs/**` as `linguist-generated=true`                                        |
| `packages/@luke-ui/react/README.md`                                      | Hand-authored entry point (~30 lines)                                               |
| `packages/@luke-ui/react/LICENSE`                                        | Hand-committed copy of workspace MIT license                                        |
| `packages/@luke-ui/react/docs/*.md`                                      | Generated, committed (per-export pages + `llms.txt`)                                |
| `packages/@luke-ui/react/dist/docs/llms-full.md`                         | Generated at build, gitignored, shipped in tarball                                  |
| `apps/docs/src/components/render-markdown.tsx`                           | Renders a Markdown string to React using Fumadocs' remark stack                     |
| `apps/docs/src/lib/rewrite-package-doc-links.ts`                         | Remark plugin; rewrites `./other.md` package-relative links to hosted URLs          |

### Modified files

| Path                                                                       | Change                                                                                                                       |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `packages/@luke-ui/react/package.json`                                     | Add `files` allowlist, `generate:docs`, `check:docs` scripts; extend `generate`                                              |
| `packages/@luke-ui/react/tsdown.config.ts`                                 | Invoke generator from `build:prepare` after dist clean                                                                       |
| `packages/@luke-ui/react/AGENTS.md`                                        | Add JSDoc-driven docs convention + RAC re-declaration rule                                                                   |
| `packages/@luke-ui/react/scripts/tsconfig.json`                            | Add `ts-morph` if not picked up automatically                                                                                |
| `packages/@luke-ui/react/src/*/index.tsx` (×17)                            | JSDoc backfill: function descriptions, prop JSDoc, RAC re-declarations on atom/composed                                      |
| `packages/@luke-ui/react/src/*/{component}.docs.mdx` (×10 → renamed `.md`) | Strip Props table, Import block, "extends" pointer (now generated); keep prose only                                          |
| `apps/docs/content/docs/components/**/*.mdx` (×10)                         | Switch from `<XDocs />` MDX import to raw `.md` import + `<RenderMarkdown>`                                                  |
| `apps/docs/src/routes/llms[.]txt.ts`                                       | Refactor to call shared `render-index` builder with `includeLibraryAuthors: false`                                           |
| `apps/docs/src/routes/llms[.]mdx/docs/$.ts`                                | Simplify: stream `packages/@luke-ui/react/docs/<slug>.md` directly                                                           |
| `apps/docs/vite.config.ts`                                                 | Add `?raw` import for `.md` files (Vite supports natively; verify)                                                           |
| `turbo.json`                                                               | Add `@luke-ui/react#generate:docs` task with `outputs: ["docs/**", "dist/docs/**"]`; declare `apps/docs#build` depends on it |
| `.gitignore`                                                               | Add `packages/@luke-ui/react/docs/llms-full.md`-equivalent path under dist (covered by existing `dist/`)                     |

### Renamed files

`packages/@luke-ui/react/src/*/{component}.docs.mdx` → `{component}.docs.md` (10 files; prose-only sources for the generator).

---

## Task 1: Project plumbing — package scripts, gitattributes, ts-morph dep

**Goal:** Lay the foundation. After this task, `pnpm --filter @luke-ui/react generate:docs` exists as a no-op, the project knows how to invoke it, and `ts-morph` is available.

**Files:**

- Modify: `packages/@luke-ui/react/package.json`
- Create: `packages/@luke-ui/react/.gitattributes`
- Create: `packages/@luke-ui/react/scripts/generate-docs.ts` (skeleton only)
- Create: `packages/@luke-ui/react/docs/.gitkeep`

- [ ] **Step 1.1: Add ts-morph as a devDependency**

```bash
pnpm --filter @luke-ui/react add -D ts-morph
```

Expected: `package.json` updated, `pnpm-lock.yaml` updated.

- [ ] **Step 1.2: Add `generate:docs` and `check:docs` scripts**

Edit `packages/@luke-ui/react/package.json`:

```json
"scripts": {
  ...
  "generate": "pnpm run generate:icons && pnpm run generate:color-tokens && pnpm run generate:docs",
  "generate:docs": "tsx scripts/generate-docs.ts",
  "check:docs": "pnpm run generate:docs && git diff --exit-code packages/@luke-ui/react/docs",
  ...
}
```

Note: `generate` already chains existing `generate:icons` and `generate:color-tokens`; appending `generate:docs` keeps the existing turbo `generate` task wiring working without changes.

- [ ] **Step 1.3: Add files allowlist to package.json**

Edit `packages/@luke-ui/react/package.json` — add at the top level:

```json
"files": [
  "dist",
  "docs",
  "README.md",
  "LICENSE"
]
```

- [ ] **Step 1.4: Create .gitattributes**

Create `packages/@luke-ui/react/.gitattributes`:

```
docs/**           linguist-generated=true
dist/docs/**      linguist-generated=true
```

- [ ] **Step 1.5: Create skeleton generator that prints "ok" and exits**

Create `packages/@luke-ui/react/scripts/generate-docs.ts`:

```ts
console.log('generate-docs: stub');
```

- [ ] **Step 1.6: Create empty docs directory placeholder**

```bash
mkdir -p packages/@luke-ui/react/docs
touch packages/@luke-ui/react/docs/.gitkeep
```

- [ ] **Step 1.7: Verify the script runs**

```bash
pnpm --filter @luke-ui/react generate:docs
```

Expected: prints `generate-docs: stub`, exits 0.

- [ ] **Step 1.8: Commit**

```bash
git add packages/@luke-ui/react/package.json packages/@luke-ui/react/.gitattributes packages/@luke-ui/react/scripts/generate-docs.ts packages/@luke-ui/react/docs/.gitkeep pnpm-lock.yaml
git commit -m "chore(react): scaffold generate:docs script + ts-morph"
```

---

## Task 2: Discover exports module

**Goal:** Read `package.json#exports`, classify each export by shape (`component` / `barrel` / `asset`) and tier (`atom` / `composed` / `primitive` / `n/a`).

**Files:**

- Create: `packages/@luke-ui/react/scripts/lib/discover-exports.ts`
- Create: `packages/@luke-ui/react/scripts/lib/__tests__/discover-exports.test.ts`

Why: every downstream stage (rendering, indexing) needs a structured list of exports. Centralising classification makes the rest of the generator simple.

**Classification rules** (from ADR-0003, ADR-0001, ADR-0002):

| Pattern                                                   | Shape                           | Tier source                                          |
| --------------------------------------------------------- | ------------------------------- | ---------------------------------------------------- |
| `./{name}` (single export from `src/{name}/index.tsx`)    | `component`                     | infer from JSDoc `@tier` tag, fallback to `composed` |
| `./{name}/primitive`                                      | `component` (still single-page) | `primitive`                                          |
| `./recipes`, `./theme`, `./tokens`, `./utils`             | `barrel`                        | `n/a`                                                |
| `./stylesheet.css`, `./spritesheet.svg`, `./package.json` | `asset`                         | `n/a`                                                |

`@tier` is a custom JSDoc tag we read from the _exported value_ of each component-shaped export. Authors write `@tier atom` or `@tier composed`. If absent, the generator falls back to `composed` (most common default for atom-shape exports gets fixed in Task 5 by adding tags).

- [ ] **Step 2.1: Write failing tests for discover-exports**

Create `packages/@luke-ui/react/scripts/lib/__tests__/discover-exports.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { discoverExports } from '../discover-exports.js';

describe('discoverExports', () => {
	it('classifies component-shaped exports as component shape', () => {
		const exports = {
			'./button': './dist/button/index.js',
			'./close-button': './dist/close-button/index.js',
		};
		const result = discoverExports(exports, '/fake/package/root');
		expect(result.find((e) => e.path === './button')?.shape).toBe('component');
	});

	it('classifies primitive paths as component shape with primitive tier', () => {
		const exports = { './button/primitive': './dist/button/primitive/index.js' };
		const result = discoverExports(exports, '/fake/package/root');
		const entry = result.find((e) => e.path === './button/primitive');
		expect(entry?.shape).toBe('component');
		expect(entry?.tier).toBe('primitive');
	});

	it('classifies recipes/theme/tokens/utils as barrel', () => {
		const exports = {
			'./recipes': './dist/recipes/index.js',
			'./theme': './dist/theme/index.js',
			'./tokens': './dist/tokens/index.js',
			'./utils': './dist/utils/index.js',
		};
		const result = discoverExports(exports, '/fake/package/root');
		expect(result.every((e) => e.shape === 'barrel')).toBe(true);
	});

	it('classifies stylesheet/spritesheet/package.json as asset', () => {
		const exports = {
			'./stylesheet.css': './dist/stylesheet.css',
			'./spritesheet.svg': './dist/spritesheet.svg',
			'./package.json': './package.json',
		};
		const result = discoverExports(exports, '/fake/package/root');
		expect(result.every((e) => e.shape === 'asset')).toBe(true);
	});

	it('skips ./package.json from the page-emitting list (asset)', () => {
		const exports = { './package.json': './package.json' };
		const result = discoverExports(exports, '/fake/package/root');
		const entry = result.find((e) => e.path === './package.json');
		expect(entry?.shape).toBe('asset');
	});
});
```

- [ ] **Step 2.2: Run tests, verify failure**

```bash
pnpm --filter @luke-ui/react exec vitest run scripts/lib/__tests__/discover-exports.test.ts
```

Expected: FAIL with "discoverExports not found" or similar.

- [ ] **Step 2.3: Implement discover-exports**

Create `packages/@luke-ui/react/scripts/lib/discover-exports.ts`:

```ts
export type ExportShape = 'component' | 'barrel' | 'asset';
export type ExportTier = 'atom' | 'composed' | 'primitive' | 'n/a';

export interface DiscoveredExport {
	/** The export specifier from package.json#exports, e.g. './button'. */
	path: string;
	/** The dist target path (right-hand side of #exports). */
	target: string;
	/** The slug used for the generated .md filename, e.g. 'button' or 'button-primitive'. */
	slug: string;
	shape: ExportShape;
	tier: ExportTier;
	/** Absolute path to the source `index.tsx` for components/barrels; undefined for assets. */
	sourcePath?: string;
}

const BARREL_PATHS = new Set(['./recipes', './theme', './tokens', './utils']);
const ASSET_PATHS = new Set(['./stylesheet.css', './spritesheet.svg', './package.json']);

export function discoverExports(
	exportsField: Record<string, string>,
	packageRoot: string,
): Array<DiscoveredExport> {
	const result: Array<DiscoveredExport> = [];
	for (const [path, target] of Object.entries(exportsField)) {
		let shape: ExportShape;
		let tier: ExportTier;
		if (ASSET_PATHS.has(path)) {
			shape = 'asset';
			tier = 'n/a';
		} else if (BARREL_PATHS.has(path)) {
			shape = 'barrel';
			tier = 'n/a';
		} else {
			shape = 'component';
			tier = path.endsWith('/primitive') ? 'primitive' : 'composed';
		}
		const slug = path
			.replace(/^\.\//, '')
			.replace(/\//g, '-')
			.replace(/\.[^.]+$/, '');
		result.push({ path, target, slug, shape, tier });
	}
	return result;
}
```

Note: this version does not yet read `@tier` JSDoc tags; that's added in Task 3 once the type parser exists. Defaulting non-primitive component exports to `composed` is correct; Task 5 will add `@tier atom` tags to the right components, and Task 3 will surface them.

- [ ] **Step 2.4: Run tests, verify pass**

```bash
pnpm --filter @luke-ui/react exec vitest run scripts/lib/__tests__/discover-exports.test.ts
```

Expected: PASS.

- [ ] **Step 2.5: Commit**

```bash
git add packages/@luke-ui/react/scripts/lib/
git commit -m "feat(react): discover-exports module with shape/tier classification"
```

---

## Task 3: Type extraction with ts-morph

**Goal:** Given a TypeScript source file path, extract: the exported function/value's JSDoc description, the `Props` interface name and its members (with JSDoc, types, and defaults), and any `extends` chain pointing to an external module.

**Files:**

- Create: `packages/@luke-ui/react/scripts/lib/parse-types.ts`
- Create: `packages/@luke-ui/react/scripts/lib/__tests__/parse-types.test.ts`
- Create: `packages/@luke-ui/react/scripts/lib/__tests__/fixtures/sample-component.ts`

The shape we'll extract:

```ts
interface ParsedComponent {
	description: string; // JSDoc on the exported function
	tier?: ExportTier; // from @tier JSDoc tag
	propsInterface?: {
		name: string;
		extends: Array<{ from: 'package' | 'external'; module?: string; typeName: string }>;
		members: Array<ParsedProp>;
	};
}

interface ParsedProp {
	name: string;
	type: string; // serialised TS type, e.g. "'small' | 'medium'"
	optional: boolean;
	default?: string; // from `@default` JSDoc tag
	description: string; // JSDoc text
}
```

- [ ] **Step 3.1: Create test fixture**

Create `packages/@luke-ui/react/scripts/lib/__tests__/fixtures/sample-component.ts`:

```ts
import type { ButtonProps as RACButtonProps } from 'react-aria-components';

interface SampleStyleProps {
	/** Controls the button size. @default 'medium' */
	size?: 'small' | 'medium';
	/** Visual tone variant. @default 'primary' */
	tone?: 'primary' | 'critical';
}

/**
 * Sample composed button.
 * @tier composed
 */
export interface SampleProps
	extends Omit<RACButtonProps, keyof SampleStyleProps>, SampleStyleProps {}

/** Sample composed button with size and tone variants. */
export function Sample(_props: SampleProps): null {
	return null;
}
```

- [ ] **Step 3.2: Write failing tests**

Create `packages/@luke-ui/react/scripts/lib/__tests__/parse-types.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { fileURLToPath } from 'node:url';
import { parseComponent } from '../parse-types.js';

const fixturePath = fileURLToPath(new URL('./fixtures/sample-component.ts', import.meta.url));

describe('parseComponent', () => {
	it('extracts the function description', () => {
		const parsed = parseComponent(fixturePath);
		expect(parsed.description).toContain('Sample composed button with size and tone variants');
	});

	it('extracts @tier JSDoc tag from the props interface', () => {
		const parsed = parseComponent(fixturePath);
		expect(parsed.tier).toBe('composed');
	});

	it('extracts own props (declared on SampleStyleProps) with JSDoc and defaults', () => {
		const parsed = parseComponent(fixturePath);
		const sizeProp = parsed.propsInterface?.members.find((p) => p.name === 'size');
		expect(sizeProp).toMatchObject({
			name: 'size',
			type: "'small' | 'medium'",
			optional: true,
			default: "'medium'",
			description: expect.stringContaining('Controls the button size'),
		});
	});

	it('detects external extends (react-aria-components)', () => {
		const parsed = parseComponent(fixturePath);
		const externalExtends = parsed.propsInterface?.extends.find((e) => e.from === 'external');
		expect(externalExtends?.module).toBe('react-aria-components');
		expect(externalExtends?.typeName).toContain('ButtonProps');
	});
});
```

- [ ] **Step 3.3: Run tests, verify failure**

```bash
pnpm --filter @luke-ui/react exec vitest run scripts/lib/__tests__/parse-types.test.ts
```

Expected: FAIL.

- [ ] **Step 3.4: Implement parse-types**

Create `packages/@luke-ui/react/scripts/lib/parse-types.ts`:

```ts
import { Project, SyntaxKind, type InterfaceDeclaration, type PropertySignature } from 'ts-morph';
import type { ExportTier } from './discover-exports.js';

export interface ParsedProp {
	name: string;
	type: string;
	optional: boolean;
	default?: string;
	description: string;
}

export interface ParsedExtends {
	from: 'package' | 'external';
	module?: string;
	typeName: string;
}

export interface ParsedComponent {
	description: string;
	tier?: ExportTier;
	propsInterface?: {
		name: string;
		extends: Array<ParsedExtends>;
		members: Array<ParsedProp>;
	};
}

const TIER_VALUES: ReadonlyArray<ExportTier> = ['atom', 'composed', 'primitive'];

export function parseComponent(sourcePath: string): ParsedComponent {
	const project = new Project({
		tsConfigFilePath: undefined,
		skipAddingFilesFromTsConfig: true,
		compilerOptions: { allowJs: false, jsx: 4 /* React */ },
	});
	const sourceFile = project.addSourceFileAtPath(sourcePath);

	const exportedFn =
		sourceFile.getFunctions().find((f) => f.isExported() && f.getJsDocs().length > 0) ??
		sourceFile.getFunctions().find((f) => f.isExported());

	const description = exportedFn?.getJsDocs()[0]?.getDescription().trim() ?? '';

	const propsInterface = sourceFile
		.getInterfaces()
		.find((i) => i.isExported() && i.getName().endsWith('Props'));

	if (!propsInterface) {
		return { description };
	}

	const tier = readTierTag(propsInterface);
	const extendsList = readExtends(propsInterface);
	const members = collectMembers(propsInterface, sourceFile);

	return {
		description,
		tier,
		propsInterface: {
			name: propsInterface.getName(),
			extends: extendsList,
			members,
		},
	};
}

function readTierTag(decl: InterfaceDeclaration): ExportTier | undefined {
	for (const jsDoc of decl.getJsDocs()) {
		for (const tag of jsDoc.getTags()) {
			if (tag.getTagName() === 'tier') {
				const value = tag.getCommentText()?.trim().toLowerCase();
				if (value && (TIER_VALUES as ReadonlyArray<string>).includes(value)) {
					return value as ExportTier;
				}
			}
		}
	}
	return undefined;
}

function readExtends(decl: InterfaceDeclaration): Array<ParsedExtends> {
	const result: Array<ParsedExtends> = [];
	for (const heritage of decl.getExtends()) {
		const expr = heritage.getExpression();
		const typeName = expr.getText();
		const symbol = expr.getSymbol();
		const declarations = symbol?.getDeclarations() ?? [];
		if (declarations.length === 0) {
			result.push({ from: 'external', typeName });
			continue;
		}
		const firstDecl = declarations[0];
		const sourceFilePath = firstDecl.getSourceFile().getFilePath();
		if (sourceFilePath.includes('/node_modules/')) {
			const module = sourceFilePath.split('/node_modules/')[1]?.split('/')[0];
			result.push({ from: 'external', module, typeName });
		} else {
			result.push({ from: 'package', typeName });
		}
	}
	return result;
}

function collectMembers(
	decl: InterfaceDeclaration,
	_sourceFile: ReturnType<Project['addSourceFileAtPath']>,
): Array<ParsedProp> {
	const out: Array<ParsedProp> = [];
	for (const prop of decl.getProperties()) {
		out.push(toParsedProp(prop));
	}
	for (const heritage of decl.getExtends()) {
		const expr = heritage.getExpression();
		const symbol = expr.getSymbol();
		const target = symbol
			?.getDeclarations()
			.find((d) => d.getKind() === SyntaxKind.InterfaceDeclaration);
		if (target && !target.getSourceFile().getFilePath().includes('/node_modules/')) {
			for (const prop of (target as InterfaceDeclaration).getProperties()) {
				if (out.some((m) => m.name === prop.getName())) continue;
				out.push(toParsedProp(prop));
			}
		}
	}
	return out;
}

function toParsedProp(prop: PropertySignature): ParsedProp {
	const jsDoc = prop.getJsDocs()[0];
	const description = jsDoc?.getDescription().trim() ?? '';
	let defaultValue: string | undefined;
	for (const tag of jsDoc?.getTags() ?? []) {
		if (tag.getTagName() === 'default') {
			defaultValue = tag.getCommentText()?.trim();
		}
	}
	return {
		name: prop.getName(),
		type: prop.getTypeNode()?.getText() ?? prop.getType().getText(prop),
		optional: prop.hasQuestionToken(),
		default: defaultValue,
		description,
	};
}
```

- [ ] **Step 3.5: Run tests, verify pass**

```bash
pnpm --filter @luke-ui/react exec vitest run scripts/lib/__tests__/parse-types.test.ts
```

Expected: PASS. If `tsx` complains about JSX flag, the fixture file uses no JSX so it can just be `.ts`.

- [ ] **Step 3.6: Commit**

```bash
git add packages/@luke-ui/react/scripts/lib/parse-types.ts packages/@luke-ui/react/scripts/lib/__tests__/parse-types.test.ts packages/@luke-ui/react/scripts/lib/__tests__/fixtures/
git commit -m "feat(react): parse-types module via ts-morph"
```

---

## Task 4: Render a single component page (tracer bullet)

**Goal:** Wire discover + parse + render for the single export `./button`. After this task, `pnpm generate:docs` produces `packages/@luke-ui/react/docs/button.md` from real source. JSDoc is still sparse — Task 5 backfills it.

**Files:**

- Create: `packages/@luke-ui/react/scripts/lib/render-page.ts`
- Create: `packages/@luke-ui/react/scripts/lib/__tests__/render-page.test.ts`
- Modify: `packages/@luke-ui/react/scripts/generate-docs.ts`

**Page template** (per ADR-0003 / Q6):

````markdown
# Button

> Button with composed label and pending spinner styles.

## Import

```ts
import { Button } from '@luke-ui/react/button';
```
````

## Usage

<authored prose from button.docs.md goes here>

## Props

Extends [`react-aria-components` `ButtonProps`](https://react-spectrum.adobe.com/react-aria/Button.html).

| Prop        | Type                  | Default    | Description                  |
| ----------- | --------------------- | ---------- | ---------------------------- |
| `size`      | `'small' \| 'medium'` | `'medium'` | Sets the button size.        |
| `isPending` | `boolean`             | —          | Shows pending button styles. |

````

For primitives (no `*.docs.md`), the Usage section is omitted. For barrels (Task 7), a different template applies.

- [ ] **Step 4.1: Write failing tests for render-page**

Create `packages/@luke-ui/react/scripts/lib/__tests__/render-page.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderComponentPage } from '../render-page.js';
import type { ParsedComponent } from '../parse-types.js';

const sampleParsed: ParsedComponent = {
  description: 'Sample composed button.',
  tier: 'composed',
  propsInterface: {
    name: 'SampleProps',
    extends: [{ from: 'external', module: 'react-aria-components', typeName: 'ButtonProps' }],
    members: [
      {
        name: 'size',
        type: "'small' | 'medium'",
        optional: true,
        default: "'medium'",
        description: 'Sets the size.',
      },
    ],
  },
};

describe('renderComponentPage', () => {
  it('emits H1 from the export slug, titlecased', () => {
    const page = renderComponentPage({
      slug: 'button',
      importPath: '@luke-ui/react/button',
      tier: 'composed',
      parsed: sampleParsed,
      proseMarkdown: '<authored usage>',
    });
    expect(page).toMatch(/^# Button\n/);
  });

  it('inserts the description as a blockquote', () => {
    const page = renderComponentPage({
      slug: 'button',
      importPath: '@luke-ui/react/button',
      tier: 'composed',
      parsed: sampleParsed,
      proseMarkdown: '<authored usage>',
    });
    expect(page).toContain('> Sample composed button.');
  });

  it('renders the import block', () => {
    const page = renderComponentPage({
      slug: 'button',
      importPath: '@luke-ui/react/button',
      tier: 'composed',
      parsed: sampleParsed,
      proseMarkdown: '',
    });
    expect(page).toContain("import { Button } from '@luke-ui/react/button';");
  });

  it('renders the props table with own props only', () => {
    const page = renderComponentPage({
      slug: 'button',
      importPath: '@luke-ui/react/button',
      tier: 'composed',
      parsed: sampleParsed,
      proseMarkdown: '',
    });
    expect(page).toMatch(/\| `size` \| `'small' \\\| 'medium'` \| `'medium'` \| Sets the size\. \|/);
  });

  it('emits an extends pointer for external types', () => {
    const page = renderComponentPage({
      slug: 'button',
      importPath: '@luke-ui/react/button',
      tier: 'composed',
      parsed: sampleParsed,
      proseMarkdown: '',
    });
    expect(page).toContain("Extends [`react-aria-components` `ButtonProps`]");
  });

  it('omits Usage section for primitives', () => {
    const page = renderComponentPage({
      slug: 'button-primitive',
      importPath: '@luke-ui/react/button/primitive',
      tier: 'primitive',
      parsed: sampleParsed,
      proseMarkdown: undefined,
    });
    expect(page).not.toContain('## Usage');
  });

  it('renders a (primitive) suffix on the title for primitive tier', () => {
    const page = renderComponentPage({
      slug: 'button-primitive',
      importPath: '@luke-ui/react/button/primitive',
      tier: 'primitive',
      parsed: sampleParsed,
      proseMarkdown: undefined,
    });
    expect(page).toMatch(/^# Button \(primitive\)\n/);
  });
});
````

- [ ] **Step 4.2: Run tests, verify failure**

```bash
pnpm --filter @luke-ui/react exec vitest run scripts/lib/__tests__/render-page.test.ts
```

Expected: FAIL.

- [ ] **Step 4.3: Implement render-page**

Create `packages/@luke-ui/react/scripts/lib/render-page.ts`:

````ts
import type { ExportTier } from './discover-exports.js';
import type { ParsedComponent } from './parse-types.js';

const RAC_DOCS_BASE = 'https://react-spectrum.adobe.com/react-aria';

export interface RenderComponentPageInput {
	slug: string;
	importPath: string;
	tier: ExportTier;
	parsed: ParsedComponent;
	/** Authored Markdown prose for the Usage section. Undefined for primitives. */
	proseMarkdown: string | undefined;
}

export function renderComponentPage(input: RenderComponentPageInput): string {
	const { slug, importPath, tier, parsed, proseMarkdown } = input;
	const lines: Array<string> = [];

	lines.push(`# ${slugToTitle(slug, tier)}`);
	lines.push('');
	if (parsed.description) {
		lines.push(`> ${parsed.description.replace(/\n/g, ' ')}`);
		lines.push('');
	}

	lines.push('## Import');
	lines.push('');
	lines.push('```ts');
	const importIdent = exportIdentifier(slug, tier);
	lines.push(`import { ${importIdent} } from '${importPath}';`);
	lines.push('```');
	lines.push('');

	if (tier !== 'primitive' && proseMarkdown) {
		lines.push('## Usage');
		lines.push('');
		lines.push(proseMarkdown.trim());
		lines.push('');
	}

	if (parsed.propsInterface) {
		lines.push('## Props');
		lines.push('');
		const externalExtends = parsed.propsInterface.extends.find((e) => e.from === 'external');
		if (externalExtends?.module === 'react-aria-components') {
			const componentName = externalExtends.typeName.replace(/Props$/, '');
			lines.push(
				`Extends [\`react-aria-components\` \`${externalExtends.typeName}\`](${RAC_DOCS_BASE}/${componentName}.html).`,
			);
			lines.push('');
		}
		lines.push('| Prop | Type | Default | Description |');
		lines.push('| --- | --- | --- | --- |');
		for (const prop of parsed.propsInterface.members) {
			const type = prop.type.replace(/\|/g, '\\|');
			const def = prop.default ? `\`${prop.default}\`` : '—';
			lines.push(
				`| \`${prop.name}\` | \`${type}\` | ${def} | ${prop.description.replace(/\n/g, ' ')} |`,
			);
		}
		lines.push('');
	}

	return lines.join('\n');
}

function slugToTitle(slug: string, tier: ExportTier): string {
	const isPrimitive = slug.endsWith('-primitive');
	const base = (isPrimitive ? slug.slice(0, -'-primitive'.length) : slug)
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(' ');
	if (tier === 'primitive') return `${base} (primitive)`;
	return base;
}

function exportIdentifier(slug: string, tier: ExportTier): string {
	const stripped = slug.endsWith('-primitive') ? slug.slice(0, -'-primitive'.length) : slug;
	return stripped
		.split('-')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
	// Note: this is the *primary* identifier per export. Multi-export primitives
	// (e.g. combobox-field/primitive) are handled in Task 6 with an alternative
	// template that lists multiple imports.
}
````

- [ ] **Step 4.4: Run tests, verify pass**

```bash
pnpm --filter @luke-ui/react exec vitest run scripts/lib/__tests__/render-page.test.ts
```

Expected: PASS.

- [ ] **Step 4.5: Wire generate-docs.ts to produce button.md**

Replace `packages/@luke-ui/react/scripts/generate-docs.ts`:

```ts
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { discoverExports } from './lib/discover-exports.js';
import { parseComponent } from './lib/parse-types.js';
import { renderComponentPage } from './lib/render-page.js';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const docsDir = join(packageRoot, 'docs');

const pkg = JSON.parse(await readFile(join(packageRoot, 'package.json'), 'utf8')) as {
	name: string;
	exports: Record<string, string>;
};

const discovered = discoverExports(pkg.exports, packageRoot);

await mkdir(docsDir, { recursive: true });

for (const entry of discovered) {
	if (entry.shape !== 'component') continue;
	if (entry.path !== './button') continue; // Tracer bullet: button only.

	const sourcePath = sourceFromExport(packageRoot, entry.target);
	const parsed = parseComponent(sourcePath);
	const proseMarkdown = await readProse(packageRoot, entry).catch(() => undefined);

	const md = renderComponentPage({
		slug: entry.slug,
		importPath: `${pkg.name}${entry.path.replace(/^\./, '')}`,
		tier: parsed.tier ?? entry.tier,
		parsed,
		proseMarkdown,
	});

	await writeFile(join(docsDir, `${entry.slug}.md`), md, 'utf8');
}

console.log(
	'generate-docs: wrote',
	discovered.filter((e) => e.shape === 'component').length,
	'pages',
);

function sourceFromExport(root: string, distTarget: string): string {
	const distRel = distTarget.replace(/^\.\/dist\//, '').replace(/\/index\.js$/, '');
	return join(root, 'src', distRel, 'index.tsx');
}

async function readProse(
	root: string,
	entry: { slug: string; path: string },
): Promise<string | undefined> {
	if (entry.path.endsWith('/primitive')) return undefined;
	const dirSlug = entry.path.replace(/^\.\//, '');
	const prosePath = join(root, 'src', dirSlug, `${dirSlug}.docs.md`);
	return readFile(prosePath, 'utf8');
}
```

- [ ] **Step 4.6: Run the generator end-to-end**

```bash
pnpm --filter @luke-ui/react generate:docs
```

Expected: `packages/@luke-ui/react/docs/button.md` is written. Open it and read it. The Props table will be sparse (only 3 props from `ButtonStyleProps`: `isPending`, `size`; and inherited; description sparse) because Button's JSDoc is minimal. That's expected — Task 5 fills this in.

- [ ] **Step 4.7: Note known gap and commit**

Commit the work-in-progress generator and the first generated file:

```bash
git add packages/@luke-ui/react/scripts/lib/render-page.ts packages/@luke-ui/react/scripts/lib/__tests__/render-page.test.ts packages/@luke-ui/react/scripts/generate-docs.ts packages/@luke-ui/react/docs/button.md
git commit -m "feat(react): tracer-bullet generator emits docs/button.md"
```

---

## Task 5: Backfill JSDoc on Button (the pattern)

**Goal:** Establish the JSDoc-authoring pattern for atom/composed components by fully backfilling Button. After this task, `docs/button.md` looks correct; the diff is the canonical example for the rest of the components.

**Files:**

- Modify: `packages/@luke-ui/react/src/button/index.tsx`
- Modify: `packages/@luke-ui/react/src/button/primitive/index.tsx`
- Rename: `packages/@luke-ui/react/src/button/button.docs.mdx` → `button.docs.md`
- Modify: `packages/@luke-ui/react/src/button/button.docs.md` (strip Props table)

**Pattern** (the convention to apply to every component in Task 6):

1. **Function-level JSDoc** describes what the component is for an app dev. One sentence, optionally followed by usage notes.
2. **`@tier` JSDoc tag** on the exported `Props` interface with one of `atom`, `composed`, `primitive`. (Falls back to `composed` when absent; primitive paths always parse as `primitive`.)
3. **Own props** declared on a `*StyleProps` (or similar) interface — one prop per JSDoc, with `@default` tags where defaults exist in the React component's destructure.
4. **Re-declare important RAC props** on the package's interface with full JSDoc, so they appear in the local "own props" table even though they semantically pass through. Per ADR-0003, do this for atom/composed. Don't re-declare every RAC prop — pick the load-bearing ones.

For Button, the load-bearing RAC props worth re-declaring are: `isDisabled`, `isPending`, `onPress`, `type`. Long-tail (`autoFocus`, `excludeFromTabOrder`, `slot`, etc.) stays under the "extends" pointer.

- [ ] **Step 5.1: Backfill `button/primitive/index.tsx` JSDoc**

Read the current file first:

```bash
cat packages/@luke-ui/react/src/button/primitive/index.tsx
```

Then add JSDoc to the exported `Button` function and `ButtonProps` interface. Pattern:

```ts
/**
 * Primitive button. A bare `<button>` with composed render props for size and tone variants.
 * Library-author audience: use this when you need full control over children layout.
 *
 * @tier primitive
 */
export interface ButtonProps extends ... { ... }

/**
 * Primitive button — see ButtonProps.
 */
export function Button(...) { ... }
```

(The actual prop members and their JSDoc depend on what's already in the file. Open it, add `/** ... */` blocks above each prop, and `@default` tags where defaults exist.)

- [ ] **Step 5.2: Backfill `button/index.tsx` JSDoc**

Apply the pattern to the composed Button. Concretely, edit `packages/@luke-ui/react/src/button/index.tsx`:

```ts
import type { ButtonProps as RACButtonProps } from 'react-aria-components';
// ... existing imports ...

interface ButtonStyleProps {
	/**
	 * Visual tone. Controls colour scheme.
	 * @default 'primary'
	 */
	tone?: 'primary' | 'critical' | 'ghost' | 'neutral';
	/**
	 * Sets the button size.
	 * @default 'medium'
	 */
	size?: PrimitiveButtonVariantProps['size'];
	/** Shows pending button styles. When true, a spinner overlays the label. */
	isPending?: ComposedButtonVariantProps['isPending'];
	/** Whether the button takes up the full inline size of its container. */
	isBlock?: PrimitiveButtonVariantProps['isBlock'];
}

interface ButtonRedeclaredRACProps {
	/** Whether the button is disabled. Disabled buttons can't be focused or pressed. */
	isDisabled?: RACButtonProps['isDisabled'];
	/** Press handler. Called on click, Enter, or Space. */
	onPress?: RACButtonProps['onPress'];
	/** HTML button type. */
	type?: RACButtonProps['type'];
}

/**
 * Composed button with size, tone, pending, and block variants.
 *
 * @tier composed
 */
export interface ButtonProps
	extends
		Omit<PrimitiveButtonProps, keyof ButtonStyleProps | keyof ButtonRedeclaredRACProps>,
		ButtonStyleProps,
		ButtonRedeclaredRACProps {}

/** Composed button. Wraps children in a `Text` for ellipsis truncation; shows a spinner when `isPending`. */
export function Button(props: ButtonProps): JSX.Element {
	/* unchanged */
}
```

Note: re-declared RAC props are typed as `RACButtonProps['isDisabled']` etc., so the TypeScript surface is identical to today. The change is purely: locally declared = generator picks them up; locally documented = JSDoc shows in the generated table.

- [ ] **Step 5.3: Run typecheck on the package**

```bash
pnpm --filter @luke-ui/react run check:types
```

Expected: PASS. If it fails on the re-declaration pattern, the most likely cause is `Omit` keys don't include the re-declared names. Read the error, adjust the `Omit` to include `keyof ButtonRedeclaredRACProps`.

- [ ] **Step 5.4: Rename and trim the prose source**

```bash
git mv packages/@luke-ui/react/src/button/button.docs.mdx packages/@luke-ui/react/src/button/button.docs.md
```

Edit `packages/@luke-ui/react/src/button/button.docs.md` to remove the Import block (now generated), the Props table (now generated), and the introductory description sentence (now generated). Keep only authored prose:

````markdown
`Button` expects the Luke UI theme class to be applied at app/root level. See
[Getting Started](/docs/getting-started).

```tsx
<Button>Save</Button>
```
````

```tsx
<Button tone="critical">Delete</Button>
```

```tsx
<Button tone="ghost">Cancel</Button>
```

```tsx
<Button isDisabled>Disabled</Button>
```

The composed `Button` wraps children in a `Text` element, so long labels
truncate with an ellipsis automatically. It also shows a `LoadingSpinner` when
`isPending` is set.

## Primitive Button

A lower-level `Button` primitive is available for cases where you need full
control over the button's children — for example, custom loading states,
render-prop children, or non-standard content.

```ts
import { Button } from '@luke-ui/react/button/primitive';
```

The primitive renders a single `<button>` element with no internal wrapper. Its
children are direct flex items, so you manage layout yourself.

````

- [ ] **Step 5.5: Regenerate and verify the output**

```bash
pnpm --filter @luke-ui/react generate:docs
cat packages/@luke-ui/react/docs/button.md
````

Expected output:

- H1 "Button"
- Description blockquote pulling from the function-level JSDoc
- Import block with `@luke-ui/react/button`
- Usage section containing the authored prose from `button.docs.md`
- Props section with extends pointer to RAC + a table containing `tone`, `size`, `isPending`, `isBlock`, `isDisabled`, `onPress`, `type`

Eyeball the table — it should look like a polished, agent-readable Markdown surface for `Button`. If anything looks off (missing prop, weird formatting, mis-resolved type), iterate on either the JSDoc or the renderer.

- [ ] **Step 5.6: Commit**

```bash
git add packages/@luke-ui/react/src/button/ packages/@luke-ui/react/docs/button.md
git commit -m "feat(react): JSDoc backfill on Button + regenerate docs"
```

---

## Task 6: Generalise to all 17 component-shaped exports

**Goal:** Apply the Task 5 pattern to every component-shaped export. Remove the tracer-bullet `if (entry.path !== './button')` filter from the generator. Verify all 17 pages generate cleanly.

**Files:**

- Modify: `packages/@luke-ui/react/scripts/generate-docs.ts` (remove filter)
- Modify: each `packages/@luke-ui/react/src/{name}/index.tsx` and `*/primitive/index.tsx` for JSDoc backfill
- Rename: each `packages/@luke-ui/react/src/{name}/{name}.docs.mdx` → `.md`, trim Props/Import out
- Generate: `packages/@luke-ui/react/docs/*.md` for every component path

**Component checklist** — apply the pattern from Task 5 to each:

| Slug                       | Tier      | Has prose?     | Notes                              |
| -------------------------- | --------- | -------------- | ---------------------------------- |
| `button`                   | composed  | ✓ (done in T5) | done                               |
| `button-primitive`         | primitive | ✗              | RAC `Button` extends               |
| `close-button`             | composed  | ✓              | wraps `IconButton`                 |
| `combobox-field`           | composed  | ✓              | RAC `Combobox` extends             |
| `combobox-field-primitive` | primitive | ✗              | multi-export — see Step 6.1 below  |
| `emoji`                    | atom      | ✓              | minimal prop surface               |
| `field-primitive`          | primitive | ✗              | multi-export — see Step 6.1        |
| `heading`                  | atom      | ✓              | re-declares some RAC heading props |
| `heading-context`          | atom      | ✗              | React context provider             |
| `icon`                     | atom      | ✓              | uses sprite system                 |
| `icon-button`              | composed  | ✓              | RAC `Button` extends               |
| `icon-size-context`        | atom      | ✗              | React context provider             |
| `link`                     | atom      | ✓              | RAC `Link` extends                 |
| `loading-spinner`          | atom      | ✓              | no RAC extend                      |
| `numeral`                  | atom      | ✓              | wraps `Text`                       |
| `text`                     | atom      | ✓              | rich variant surface               |
| `text-field`               | composed  | ✓              | RAC `TextField` extends            |
| `text-field-primitive`     | primitive | ✗              | exports `TextInput`                |

For each entry, the work is: open `index.tsx`, write function and `Props` JSDoc, add `@tier` tag, add `@default` tags on prop destructures with defaults, re-declare important RAC props (composed/atom only), trim `*.docs.mdx` → `.docs.md`. Same pattern as Button.

- [ ] **Step 6.1: Extend the renderer to handle multi-export primitive paths**

Multi-export primitives (`combobox-field/primitive`, `field/primitive`) export several named values from one barrel. The current `renderComponentPage` assumes a single primary export. Add a multi-export branch.

Edit `packages/@luke-ui/react/scripts/lib/render-page.ts` to add:

````ts
export interface RenderBarrelPageInput {
	slug: string;
	importPath: string;
	tier: ExportTier;
	description?: string;
	exports: Array<{ name: string; description: string; type?: string }>;
}

export function renderBarrelPage(input: RenderBarrelPageInput): string {
	const { slug, importPath, tier, description, exports } = input;
	const lines: Array<string> = [];
	lines.push(`# ${slugToTitle(slug, tier)}`);
	lines.push('');
	if (description) {
		lines.push(`> ${description.replace(/\n/g, ' ')}`);
		lines.push('');
	}
	lines.push('## Import');
	lines.push('');
	lines.push('```ts');
	lines.push(`import { ${exports.map((e) => e.name).join(', ')} } from '${importPath}';`);
	lines.push('```');
	lines.push('');
	lines.push('## Exports');
	lines.push('');
	for (const e of exports) {
		lines.push(`### \`${e.name}\``);
		lines.push('');
		if (e.type) {
			lines.push('```ts');
			lines.push(e.type);
			lines.push('```');
			lines.push('');
		}
		if (e.description) {
			lines.push(e.description);
			lines.push('');
		}
	}
	return lines.join('\n');
}
````

Add a corresponding `parseBarrel(sourcePath: string)` to `parse-types.ts` that returns `{ description?: string; exports: Array<{ name; description; type? }> }` by reading all top-level `export` declarations and their JSDoc. Test it with a small fixture.

- [ ] **Step 6.2: Backfill JSDoc on the remaining 16 components**

Work through the table above. For each row:

1. Open `src/{name}/index.tsx` (and `src/{name}/primitive/index.tsx` if applicable).
2. Apply the Task 5 pattern: function-level JSDoc, `@tier` tag, prop JSDoc, `@default` tags, RAC re-declarations on atom/composed.
3. If the component has `*.docs.mdx`, `git mv` to `.docs.md` and trim the Props/Import sections.
4. Run `pnpm --filter @luke-ui/react run check:types` after each component to catch typing mistakes early.

Commit per component for review-friendly diffs:

```bash
git add packages/@luke-ui/react/src/text/ packages/@luke-ui/react/docs/text.md
git commit -m "feat(react): JSDoc backfill on Text"
```

(One commit per component is recommended, but acceptable to batch atoms together if commits would otherwise be tiny.)

- [ ] **Step 6.3: Remove the tracer-bullet filter**

Edit `packages/@luke-ui/react/scripts/generate-docs.ts`. Delete:

```ts
if (entry.path !== './button') continue; // Tracer bullet: button only.
```

Wire the multi-export branch:

```ts
for (const entry of discovered) {
	if (entry.shape !== 'component') continue;

	const sourcePath = sourceFromExport(packageRoot, entry.target);

	if (isMultiExportPrimitive(sourcePath)) {
		const parsed = parseBarrel(sourcePath);
		const md = renderBarrelPage({
			slug: entry.slug,
			importPath: `${pkg.name}${entry.path.replace(/^\./, '')}`,
			tier: 'primitive',
			description: parsed.description,
			exports: parsed.exports,
		});
		await writeFile(join(docsDir, `${entry.slug}.md`), md, 'utf8');
		continue;
	}

	// single-export branch as before
}
```

`isMultiExportPrimitive(sourcePath)` returns true when the source file has more than one top-level exported value. Add it to `parse-types.ts` or inline.

- [ ] **Step 6.4: Run full generation**

```bash
pnpm --filter @luke-ui/react generate:docs
ls packages/@luke-ui/react/docs/
```

Expected: 17 `.md` files corresponding to the 17 component-shaped exports plus an empty placeholder. Read 2-3 to spot-check formatting.

- [ ] **Step 6.5: Run typecheck and lint on the whole package**

```bash
pnpm --filter @luke-ui/react run check:types
pnpm --filter @luke-ui/react run check:lint
```

Expected: both PASS. If anything fails, fix at the source — don't bypass.

- [ ] **Step 6.6: Commit the generator change**

(Per-component commits already happened in Step 6.2.) Now:

```bash
git add packages/@luke-ui/react/scripts/
git commit -m "feat(react): generate docs for all component-shaped exports"
```

---

## Task 7: Barrel overview pages (recipes, theme, tokens, utils)

**Goal:** Render overview pages for the 4 multi-export barrel paths. Each page lists exports with one-line JSDoc summaries + their type signature.

**Files:**

- Modify: `packages/@luke-ui/react/scripts/generate-docs.ts` (add barrel branch)
- Modify: each `src/{barrel}/index.ts` for one-line JSDoc on each export
- Generate: `packages/@luke-ui/react/docs/{recipes,theme,tokens,utils}.md`

- [ ] **Step 7.1: JSDoc backfill on barrel exports**

For each of `recipes`, `theme`, `tokens`, `utils`, open `src/{barrel}/index.ts` and add a one-line JSDoc above each named `export`. Examples:

```ts
/** Vanilla-extract recipe for the `Button` composed component. Variants: `size`, `tone`, `isPending`, `isBlock`. */
export { button } from '../recipes/button.css.js';

/** Class name applied at the app root to enable Luke UI theme variables. */
export const themeRootClassName = ...;
```

For exports that re-export from another file (`export { x } from './y.js'`), put the JSDoc on the re-export. ts-morph reads JSDoc from the export declaration.

Files to backfill:

- `src/recipes/index.ts` (existing exports)
- `src/theme/index.tsx` (exports `themeClass`, `vars`, `themeRootClassName`)
- `src/tokens/index.ts` (extensive — many named exports)
- `src/utils/index.ts` (varies — list current exports first)

- [ ] **Step 7.2: Wire barrel rendering into the generator**

Edit `packages/@luke-ui/react/scripts/generate-docs.ts`:

```ts
for (const entry of discovered) {
	if (entry.shape === 'asset') continue;

	const sourcePath = sourceFromExport(packageRoot, entry.target);

	if (entry.shape === 'barrel') {
		const parsed = parseBarrel(sourcePath);
		const md = renderBarrelPage({
			slug: entry.slug,
			importPath: `${pkg.name}${entry.path.replace(/^\./, '')}`,
			tier: 'n/a',
			description: parsed.description,
			exports: parsed.exports,
		});
		await writeFile(join(docsDir, `${entry.slug}.md`), md, 'utf8');
		continue;
	}

	// existing component branch ...
}
```

The `tier: 'n/a'` flows into `renderBarrelPage` which doesn't suffix the title with `(primitive)`.

- [ ] **Step 7.3: Run generation, eyeball output**

```bash
pnpm --filter @luke-ui/react generate:docs
cat packages/@luke-ui/react/docs/tokens.md | head -60
cat packages/@luke-ui/react/docs/recipes.md | head -60
```

Expected: each barrel page lists every export with a one-liner. The type signature renders as a code block (e.g. `export const tokens: { backgroundColor: ... }`). If types are too long, the renderer should still emit them (truncate later if it becomes a problem).

- [ ] **Step 7.4: Commit per barrel**

```bash
git add packages/@luke-ui/react/src/recipes/ packages/@luke-ui/react/docs/recipes.md
git commit -m "feat(react): JSDoc backfill on recipes barrel + generate docs"

# repeat for theme, tokens, utils
```

---

## Task 8: README, llms.txt, and shared index builder

**Goal:** Produce the package's `llms.txt` index and hand-author `README.md`. Build the index via a shared module so the `apps/docs` `/llms.txt` route can call the same builder with `includeLibraryAuthors: false`.

**Files:**

- Create: `packages/@luke-ui/react/scripts/lib/render-index.ts`
- Create: `packages/@luke-ui/react/scripts/lib/__tests__/render-index.test.ts`
- Create: `packages/@luke-ui/react/README.md` (hand-authored)
- Create: `packages/@luke-ui/react/LICENSE` (copy from workspace root)
- Modify: `packages/@luke-ui/react/scripts/generate-docs.ts` (write llms.txt)

**llms.txt format** (matches existing `apps/docs/src/routes/llms[.]txt.ts`):

```
# Luke UI

> A React design system built on react-aria-components and vanilla-extract.

- [Button](./button.md): Composed button with size, tone, pending, and block variants.
- [Text](./text.md): Typography atom with rich variant surface.
- ...

## Library authors

- [Button (primitive)](./button-primitive.md): Bare <button> with size/tone variants.
- ...

## Assets

- stylesheet.css — required side-effect import: `import '@luke-ui/react/stylesheet.css'`
- spritesheet.svg — sprite sheet referenced by the `Icon` atom; bundlers handle this automatically.
```

- [ ] **Step 8.1: Write failing tests for render-index**

Create `packages/@luke-ui/react/scripts/lib/__tests__/render-index.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderIndex } from '../render-index.js';
import type { DiscoveredExport } from '../discover-exports.js';

const sampleEntries: Array<DiscoveredExport & { description?: string }> = [
	{
		path: './button',
		target: '',
		slug: 'button',
		shape: 'component',
		tier: 'composed',
		description: 'Composed button.',
	},
	{
		path: './button/primitive',
		target: '',
		slug: 'button-primitive',
		shape: 'component',
		tier: 'primitive',
		description: 'Bare button.',
	},
	{
		path: './tokens',
		target: '',
		slug: 'tokens',
		shape: 'barrel',
		tier: 'n/a',
		description: 'Design tokens.',
	},
	{ path: './stylesheet.css', target: '', slug: 'stylesheet', shape: 'asset', tier: 'n/a' },
];

describe('renderIndex', () => {
	it('lists composed components in the primary section', () => {
		const out = renderIndex({
			packageName: '@luke-ui/react',
			entries: sampleEntries,
			includeLibraryAuthors: false,
		});
		expect(out).toMatch(/- \[Button\]\(\.\/button\.md\)/);
	});

	it('omits primitives when includeLibraryAuthors is false', () => {
		const out = renderIndex({
			packageName: '@luke-ui/react',
			entries: sampleEntries,
			includeLibraryAuthors: false,
		});
		expect(out).not.toMatch(/Button \(primitive\)/);
		expect(out).not.toMatch(/## Library authors/);
	});

	it('includes primitives in a Library authors section when flag is true', () => {
		const out = renderIndex({
			packageName: '@luke-ui/react',
			entries: sampleEntries,
			includeLibraryAuthors: true,
		});
		expect(out).toMatch(/## Library authors/);
		expect(out).toMatch(/- \[Button \(primitive\)\]\(\.\/button-primitive\.md\)/);
	});

	it('lists assets inline (no link) under Assets section', () => {
		const out = renderIndex({
			packageName: '@luke-ui/react',
			entries: sampleEntries,
			includeLibraryAuthors: true,
		});
		expect(out).toMatch(/## Assets/);
		expect(out).toMatch(/stylesheet\.css.*import '@luke-ui\/react\/stylesheet\.css'/);
	});
});
```

- [ ] **Step 8.2: Run tests, verify failure**

```bash
pnpm --filter @luke-ui/react exec vitest run scripts/lib/__tests__/render-index.test.ts
```

Expected: FAIL.

- [ ] **Step 8.3: Implement renderIndex**

Create `packages/@luke-ui/react/scripts/lib/render-index.ts`:

```ts
import type { DiscoveredExport } from './discover-exports.js';

export interface IndexEntry extends DiscoveredExport {
	description?: string;
}

export interface RenderIndexInput {
	packageName: string;
	pitch?: string;
	entries: Array<IndexEntry>;
	includeLibraryAuthors: boolean;
}

const ASSET_NOTES: Record<string, string> = {
	'./stylesheet.css': "required side-effect import: `import '@luke-ui/react/stylesheet.css'`",
	'./spritesheet.svg':
		'sprite sheet referenced by the `Icon` atom; bundlers resolve this automatically.',
	'./package.json': 'package manifest export, used by tooling — no docs.',
};

export function renderIndex(input: RenderIndexInput): string {
	const { packageName, entries, includeLibraryAuthors } = input;
	const lines: Array<string> = [];
	lines.push(`# ${packageName}`);
	lines.push('');
	if (input.pitch) {
		lines.push(`> ${input.pitch}`);
		lines.push('');
	}

	const primary = entries.filter((e) => e.shape === 'component' && e.tier !== 'primitive');
	const primitives = entries.filter((e) => e.shape === 'component' && e.tier === 'primitive');
	const barrels = entries.filter((e) => e.shape === 'barrel');
	const assets = entries.filter((e) => e.shape === 'asset');

	lines.push('## Components');
	lines.push('');
	for (const e of primary) {
		lines.push(formatLink(e));
	}
	lines.push('');

	if (barrels.length > 0) {
		lines.push('## Foundations');
		lines.push('');
		for (const e of barrels) {
			lines.push(formatLink(e));
		}
		lines.push('');
	}

	if (includeLibraryAuthors && primitives.length > 0) {
		lines.push('## Library authors');
		lines.push('');
		for (const e of primitives) {
			lines.push(formatLink(e));
		}
		lines.push('');
	}

	if (assets.length > 0) {
		lines.push('## Assets');
		lines.push('');
		for (const e of assets) {
			const note = ASSET_NOTES[e.path] ?? '';
			lines.push(`- \`${e.path.replace(/^\.\//, '')}\` — ${note}`);
		}
		lines.push('');
	}

	return lines.join('\n');
}

function formatLink(e: IndexEntry): string {
	const desc = e.description ? `: ${e.description}` : '';
	const title = slugToTitle(e.slug, e.tier);
	return `- [${title}](./${e.slug}.md)${desc}`;
}

function slugToTitle(slug: string, tier: string): string {
	const isPrimitive = slug.endsWith('-primitive');
	const base = (isPrimitive ? slug.slice(0, -'-primitive'.length) : slug)
		.split('-')
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join(' ');
	return tier === 'primitive' ? `${base} (primitive)` : base;
}
```

- [ ] **Step 8.4: Run tests, verify pass**

```bash
pnpm --filter @luke-ui/react exec vitest run scripts/lib/__tests__/render-index.test.ts
```

Expected: PASS.

- [ ] **Step 8.5: Wire renderIndex into the generator to write llms.txt**

Add to `scripts/generate-docs.ts` after the per-export rendering loop:

```ts
import { renderIndex } from './lib/render-index.js';

// ... after the per-export rendering loop ...

const entriesWithDescriptions = await Promise.all(
	discovered.map(async (entry) => {
		if (entry.shape !== 'component' && entry.shape !== 'barrel') return entry;
		const sourcePath = sourceFromExport(packageRoot, entry.target);
		try {
			const parsed =
				entry.shape === 'barrel' ? parseBarrel(sourcePath) : parseComponent(sourcePath);
			return { ...entry, description: parsed.description };
		} catch {
			return entry;
		}
	}),
);

const llmsTxt = renderIndex({
	packageName: pkg.name,
	pitch: 'A React design system built on react-aria-components and vanilla-extract.',
	entries: entriesWithDescriptions,
	includeLibraryAuthors: true,
});

await writeFile(join(docsDir, 'llms.txt'), llmsTxt, 'utf8');
```

- [ ] **Step 8.6: Hand-author README.md**

Create `packages/@luke-ui/react/README.md`:

````markdown
# @luke-ui/react

A React design system built on `react-aria-components` and `vanilla-extract`.

## Install

```sh
pnpm add @luke-ui/react
```
````

## Setup

Apply the theme class at your app root and import the stylesheet:

```tsx
import '@luke-ui/react/stylesheet.css';
import { themeRootClassName } from '@luke-ui/react/theme';

export function App() {
	return <div className={themeRootClassName}>{/* your app */}</div>;
}
```

## Components and docs

This package ships per-export documentation under `docs/`. The full index is in [`docs/llms.txt`](./docs/llms.txt) — readable by humans and by AI agents.

Components fall into a [three-tier taxonomy](https://github.com/lukebennett88/luke-ui/blob/main/docs/adr/0001-component-tier-taxonomy.md):

- **Atoms** — single units (`Text`, `Icon`, `Heading`, …)
- **Composed** — opinionated combinations (`Button`, `TextField`, …)
- **Primitives** — building blocks for library authors (`button/primitive`, `field/primitive`, …)

Atoms and composed components are app-developer-facing. Primitives are documented under `docs/` for library authors but excluded from the primary index.

## License

MIT

````

- [ ] **Step 8.7: Copy LICENSE from workspace root**

```bash
cp /Users/luke/Code/lukebennett88/luke-ui/LICENSE packages/@luke-ui/react/LICENSE
````

(Workspace `LICENSE` is the canonical source. Per ADR-0003, we hand-commit a copy at the package root.)

- [ ] **Step 8.8: Run full generation, verify all outputs**

```bash
pnpm --filter @luke-ui/react generate:docs
ls packages/@luke-ui/react/docs/
cat packages/@luke-ui/react/docs/llms.txt
```

Expected: per-export `.md` files + `llms.txt`. The index lists Components, Foundations, Library authors, and Assets in that order.

- [ ] **Step 8.9: Commit**

```bash
git add packages/@luke-ui/react/scripts/lib/render-index.ts \
  packages/@luke-ui/react/scripts/lib/__tests__/render-index.test.ts \
  packages/@luke-ui/react/scripts/generate-docs.ts \
  packages/@luke-ui/react/README.md \
  packages/@luke-ui/react/LICENSE \
  packages/@luke-ui/react/docs/llms.txt
git commit -m "feat(react): llms.txt index, README, LICENSE"
```

---

## Task 9: llms-full.md aggregate (uncommitted, in dist/docs/)

**Goal:** Concatenate all per-export pages into `dist/docs/llms-full.md`, written at build time only and shipped in the npm tarball.

**Files:**

- Create: `packages/@luke-ui/react/scripts/lib/render-llms-full.ts`
- Modify: `packages/@luke-ui/react/scripts/generate-docs.ts`

- [ ] **Step 9.1: Implement render-llms-full**

Create `packages/@luke-ui/react/scripts/lib/render-llms-full.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function renderLlmsFull(docsDir: string, slugs: Array<string>): Promise<string> {
	const sections: Array<string> = [];
	sections.push(
		'# Luke UI — full documentation\n\n> Concatenated per-export documentation for AI consumption.\n',
	);
	for (const slug of slugs) {
		const content = await readFile(join(docsDir, `${slug}.md`), 'utf8');
		sections.push(content);
	}
	return sections.join('\n\n---\n\n');
}
```

- [ ] **Step 9.2: Wire it into the generator, writing to dist/docs/**

Add to `scripts/generate-docs.ts` after `llms.txt` is written:

```ts
import { renderLlmsFull } from './lib/render-llms-full.js';

// ... after llms.txt is written ...

const distDocsDir = join(packageRoot, 'dist', 'docs');
await mkdir(distDocsDir, { recursive: true });
const componentSlugs = discovered
	.filter((e) => e.shape === 'component' || e.shape === 'barrel')
	.map((e) => e.slug);
const llmsFull = await renderLlmsFull(docsDir, componentSlugs);
await writeFile(join(distDocsDir, 'llms-full.md'), llmsFull, 'utf8');
```

- [ ] **Step 9.3: Run generation, verify file exists**

```bash
pnpm --filter @luke-ui/react generate:docs
ls -la packages/@luke-ui/react/dist/docs/
head -40 packages/@luke-ui/react/dist/docs/llms-full.md
```

Expected: `dist/docs/llms-full.md` exists; head shows the title + first per-export page.

- [ ] **Step 9.4: Verify it's gitignored**

```bash
git status --short packages/@luke-ui/react/dist/
```

Expected: no entry for `dist/docs/llms-full.md` (root `.gitignore` already ignores `dist/`).

- [ ] **Step 9.5: Commit**

```bash
git add packages/@luke-ui/react/scripts/
git commit -m "feat(react): render llms-full.md to dist/docs/ for tarball"
```

---

## Task 10: tsdown build:prepare hook + check:docs + Turbo task

**Goal:** Wire docs generation into the package build lifecycle. Make `pnpm --filter @luke-ui/react build` regenerate docs before bundling. Configure Turbo so `apps/docs#build` correctly depends on the new generation step.

**Files:**

- Modify: `packages/@luke-ui/react/tsdown.config.ts`
- Modify: `turbo.json`

- [ ] **Step 10.1: Invoke the generator from build:prepare**

Edit `packages/@luke-ui/react/tsdown.config.ts`. Add an import and chain the generator into the existing `build:prepare`:

```ts
import { spawn } from 'node:child_process';

// ... existing code ...

async function runGenerateDocs(): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const child = spawn('tsx', ['scripts/generate-docs.ts'], {
			cwd: fileURLToPath(new URL('./', import.meta.url)),
			stdio: 'inherit',
		});
		child.on('exit', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`generate-docs exited with code ${code}`));
		});
		child.on('error', reject);
	});
}

export default defineConfig((options) => ({
	// ...
	hooks: {
		'build:prepare': async () => {
			await cleanDistExceptPreservedFiles();
			await runGenerateDocs();
		},
	},
	// ...
}));
```

- [ ] **Step 10.2: Verify build runs the generator**

```bash
rm -rf packages/@luke-ui/react/dist
pnpm --filter @luke-ui/react run build
ls packages/@luke-ui/react/dist/docs/
ls packages/@luke-ui/react/docs/
```

Expected: `dist/docs/llms-full.md` exists; `docs/*.md` files are current.

- [ ] **Step 10.3: Add the generate:docs task to turbo.json**

Edit `turbo.json`. Update the existing `generate` task's `outputs` to include the new docs paths:

```json
"generate": {
  "dependsOn": ["^generate"],
  "outputs": [".generated/**", "dist/spritesheet.svg", "src/routeTree.gen.ts", "docs/**"]
}
```

The existing wiring (`build` depends on `generate`, `generate` chains `^generate`) propagates correctly because we appended `generate:docs` to the package-level `generate` script in Task 1.

`apps/docs#build` already depends on `^build` which transitively runs `@luke-ui/react#build` which now runs `generate:docs` via `build:prepare`. No new Turbo task required.

- [ ] **Step 10.4: Verify the apps/docs build chain regenerates and reads docs**

```bash
rm -rf packages/@luke-ui/react/docs/*.md
rm -rf packages/@luke-ui/react/dist
pnpm --filter docs run build
```

Expected: `@luke-ui/react`'s build runs first (regenerating docs), then `apps/docs` builds. (apps/docs MDX migration is in Task 11; for now this just exercises the build graph.)

- [ ] **Step 10.5: Run the stale check**

```bash
pnpm --filter @luke-ui/react run check:docs
```

Expected: PASS (working tree matches generated output). Now intentionally edit a JSDoc and rerun:

```bash
# pretend edit: change a Button prop description by 1 char
# then:
pnpm --filter @luke-ui/react run check:docs
```

Expected: FAIL with a `git diff` showing the changed line in `docs/button.md`. Revert the JSDoc change. Re-run, expect PASS.

- [ ] **Step 10.6: Commit**

```bash
git add packages/@luke-ui/react/tsdown.config.ts turbo.json
git commit -m "build(react): wire generate:docs into tsdown build:prepare + turbo"
```

---

## Task 11: apps/docs RenderMarkdown + relative-link rewriting

**Goal:** Build the `<RenderMarkdown>` component the hosted Fumadocs pages will use to render generated package Markdown. Includes a remark plugin that rewrites package-relative `./other.md` links to hosted URLs.

**Files:**

- Create: `apps/docs/src/components/render-markdown.tsx`
- Create: `apps/docs/src/lib/rewrite-package-doc-links.ts`
- Create: `apps/docs/src/components/__tests__/render-markdown.test.tsx`

The link rewrite map: `./button.md` → `/docs/components/actions/button` (the hosted URL for that component). The mapping currently lives implicitly in `apps/docs/content/docs/components/<group>/<slug>.mdx` paths. We can derive it by reading the Fumadocs source and matching slugs.

- [ ] **Step 11.1: Write a failing test for the link-rewrite plugin**

Create `apps/docs/src/components/__tests__/render-markdown.test.tsx`:

```tsx
import { describe, expect, it } from 'vitest';
import { rewritePackageDocLinks } from '../../lib/rewrite-package-doc-links.js';

describe('rewritePackageDocLinks', () => {
	it('rewrites ./other.md to the hosted URL using the supplied map', () => {
		const slugMap = new Map([['text', '/docs/components/typography/text']]);
		const md = '[Text](./text.md)';
		const out = rewritePackageDocLinks(md, slugMap);
		expect(out).toBe('[Text](/docs/components/typography/text)');
	});

	it('leaves external URLs untouched', () => {
		const slugMap = new Map([['text', '/docs/components/typography/text']]);
		const md = '[RAC](https://react-spectrum.adobe.com/...)';
		expect(rewritePackageDocLinks(md, slugMap)).toBe(md);
	});

	it('leaves anchor-only links untouched', () => {
		const slugMap = new Map();
		const md = 'See [the Variants section](#variants).';
		expect(rewritePackageDocLinks(md, slugMap)).toBe(md);
	});
});
```

- [ ] **Step 11.2: Run, verify failure**

```bash
pnpm --filter docs exec vitest run src/components/__tests__/render-markdown.test.tsx
```

Expected: FAIL.

- [ ] **Step 11.3: Implement rewritePackageDocLinks (string-based, not remark)**

Create `apps/docs/src/lib/rewrite-package-doc-links.ts`:

```ts
const RELATIVE_MD_LINK = /\]\(\.\/([a-z0-9-]+)\.md\)/gi;

export function rewritePackageDocLinks(markdown: string, slugMap: Map<string, string>): string {
	return markdown.replace(RELATIVE_MD_LINK, (match, slug: string) => {
		const hosted = slugMap.get(slug);
		return hosted ? `](${hosted})` : match;
	});
}
```

(Pre-render rewriting via regex is simpler than a remark plugin and avoids parsing-cost. If Markdown grows complex enough that the regex is wrong, replace with a remark plugin later.)

- [ ] **Step 11.4: Verify tests pass**

```bash
pnpm --filter docs exec vitest run src/components/__tests__/render-markdown.test.tsx
```

Expected: PASS.

- [ ] **Step 11.5: Implement RenderMarkdown component**

Create `apps/docs/src/components/render-markdown.tsx`:

```tsx
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeReact from 'rehype-react';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { rewritePackageDocLinks } from '../lib/rewrite-package-doc-links.js';

interface RenderMarkdownProps {
	source: string;
	slugMap: Map<string, string>;
}

export function RenderMarkdown({ source, slugMap }: RenderMarkdownProps) {
	const rewritten = rewritePackageDocLinks(source, slugMap);
	const result = unified()
		.use(remarkParse)
		.use(remarkRehype)
		.use(rehypeReact, { Fragment, jsx, jsxs, components: defaultMdxComponents })
		.processSync(rewritten);
	return <>{result.result as React.ReactElement}</>;
}
```

Add the necessary deps if not already present:

```bash
pnpm --filter docs add unified remark-parse remark-rehype rehype-react
```

(Verify these aren't already transitively available via Fumadocs.)

- [ ] **Step 11.6: Manual smoke test by mounting it on one component page**

Edit `apps/docs/content/docs/components/actions/button.mdx` temporarily:

```mdx
---
title: Button
description: Composed button.
---

import { storyClient } from '../../../../src/button/button.story.client';
import buttonDocs from '../../../../../../packages/@luke-ui/react/docs/button.md?raw';
import { RenderMarkdown } from '../../../../src/components/render-markdown';

export const slugMap = new Map([
	['text', '/docs/components/typography/text'],
	['link', '/docs/components/actions/link'],
	// … expand later
]);

<storyClient.WithControl />
<RenderMarkdown source={buttonDocs} slugMap={slugMap} />
```

Run dev server:

```bash
pnpm --filter docs dev
```

Open `http://localhost:3000/docs/components/actions/button` and verify the page renders correctly: H1, blockquote, code block, Usage prose, Props table.

- [ ] **Step 11.7: Commit (without the slugMap inline — it'll be centralised in Task 12)**

```bash
git add apps/docs/src/components/render-markdown.tsx \
  apps/docs/src/lib/rewrite-package-doc-links.ts \
  apps/docs/src/components/__tests__/render-markdown.test.tsx \
  apps/docs/content/docs/components/actions/button.mdx \
  apps/docs/package.json
git commit -m "feat(docs): RenderMarkdown component for generated package docs"
```

---

## Task 12: Migrate hosted MDX wrappers to use generated `.md`

**Goal:** Switch every `apps/docs/content/docs/components/**/*.mdx` from importing `*.docs.mdx` to importing the generated `packages/@luke-ui/react/docs/<slug>.md` via `<RenderMarkdown>`. Centralise the slugMap.

**Files:**

- Create: `apps/docs/src/lib/package-doc-slug-map.ts`
- Modify: every `apps/docs/content/docs/components/**/*.mdx` (10 files)

- [ ] **Step 12.1: Build the slug map**

Create `apps/docs/src/lib/package-doc-slug-map.ts`:

```ts
/**
 * Maps a package-doc slug (e.g. 'button') to the hosted-page URL.
 * Used by RenderMarkdown to rewrite intra-doc links from package-relative to hosted URLs.
 */
export const packageDocSlugMap: ReadonlyMap<string, string> = new Map([
	['button', '/docs/components/actions/button'],
	['close-button', '/docs/components/actions/close-button'],
	['icon-button', '/docs/components/actions/icon-button'],
	['link', '/docs/components/actions/link'],
	['loading-spinner', '/docs/components/feedback/loading-spinner'],
	['combobox-field', '/docs/components/forms/combobox-field'],
	['text-field', '/docs/components/forms/text-field'],
	['emoji', '/docs/components/typography/emoji'],
	['heading', '/docs/components/typography/heading'],
	['numeral', '/docs/components/typography/numeral'],
	['text', '/docs/components/typography/text'],
	['icon', '/docs/components/visuals/icon'],
]);
```

(Primitive pages don't have hosted equivalents — links to them are left as-is, which won't resolve on the hosted site. That's acceptable per ADR-0003: hosted docs don't include primitive pages. A linkcheck CI step could later flag broken links to primitive `.md` files in hosted Markdown if it becomes an issue.)

- [ ] **Step 12.2: Update each component MDX wrapper**

For each of the 10 hosted `.mdx` files, replace the body. Example for `apps/docs/content/docs/components/actions/button.mdx`:

```mdx
---
title: Button
description: Composed button with size and tone variants.
---

import { storyClient } from '../../../../src/button/button.story.client';
import buttonDocs from '../../../../../../packages/@luke-ui/react/docs/button.md?raw';
import { RenderMarkdown } from '../../../../src/components/render-markdown';
import { packageDocSlugMap } from '../../../../src/lib/package-doc-slug-map';

<storyClient.WithControl />
<RenderMarkdown source={buttonDocs} slugMap={packageDocSlugMap} />
```

Apply the same pattern to all 10 component pages — only the import paths and the `storyClient` import change.

- [ ] **Step 12.3: Run apps/docs typecheck and dev server**

```bash
pnpm --filter docs run check:types
pnpm --filter docs dev
```

Visit several hosted pages: Button, Text, ComboboxField. Verify each renders correctly.

- [ ] **Step 12.4: Commit**

```bash
git add apps/docs/content/docs/components/ apps/docs/src/lib/package-doc-slug-map.ts
git commit -m "feat(docs): hosted pages render generated package Markdown"
```

---

## Task 13: Refactor /llms.txt route to use the shared builder

**Goal:** The hosted `/llms.txt` route uses the same `renderIndex` builder as the package, with `includeLibraryAuthors: false`. Eliminates duplication; guarantees the two `llms.txt` files diverge only in the controlled flag.

**Files:**

- Modify: `apps/docs/src/routes/llms[.]txt.ts`

- [ ] **Step 13.1: Refactor the route**

Replace `apps/docs/src/routes/llms[.]txt.ts`:

```ts
import { createFileRoute } from '@tanstack/react-router';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { renderIndex, type IndexEntry } from '@luke-ui/react/scripts/lib/render-index';
import { discoverExports } from '@luke-ui/react/scripts/lib/discover-exports';

export const Route = createFileRoute('/llms.txt')({
	server: {
		handlers: {
			GET: async () => {
				const pkgPath = join(
					import.meta.dirname,
					'../../../../packages/@luke-ui/react/package.json',
				);
				const pkg = JSON.parse(await readFile(pkgPath, 'utf8')) as {
					name: string;
					exports: Record<string, string>;
				};
				const entries = discoverExports(pkg.exports, '');
				const txt = renderIndex({
					packageName: pkg.name,
					pitch: 'A React design system built on react-aria-components and vanilla-extract.',
					entries: entries as IndexEntry[],
					includeLibraryAuthors: false,
				});
				return new Response(txt, {
					headers: { 'Content-Type': 'text/plain; charset=utf-8' },
				});
			},
		},
	},
});
```

Note: importing from `@luke-ui/react/scripts/...` requires that the scripts directory be exported. Add to `packages/@luke-ui/react/package.json#exports`:

```json
"./scripts/lib/render-index": "./scripts/lib/render-index.ts",
"./scripts/lib/discover-exports": "./scripts/lib/discover-exports.ts"
```

These are _internal_ exports — TypeScript paths only, not built. They're used by the workspace `apps/docs` for SSR. They won't ship in the npm tarball because `package.json#files` doesn't include `scripts/`.

If this exports approach trips `arethetypeswrong` or `publint`, alternative: a workspace-internal alias via `tsconfig.json#paths` instead of `package.json#exports`.

- [ ] **Step 13.2: Verify the route renders correctly**

```bash
pnpm --filter docs dev
curl http://localhost:3000/llms.txt
```

Expected: index format matches `packages/@luke-ui/react/docs/llms.txt`, but **without** the "Library authors" section.

- [ ] **Step 13.3: Commit**

```bash
git add apps/docs/src/routes/llms\[.\]txt.ts packages/@luke-ui/react/package.json
git commit -m "refactor(docs): hosted /llms.txt uses shared renderIndex builder"
```

---

## Task 14: Simplify /llms.mdx/docs/$ route to stream package docs

**Goal:** Per ADR-0003, the per-page agent route serves package Markdown directly. Bypass Fumadocs `getLLMText` for component pages.

**Files:**

- Modify: `apps/docs/src/routes/llms[.]mdx/docs/$.ts`

- [ ] **Step 14.1: Refactor the route to stream package files for component slugs**

Replace `apps/docs/src/routes/llms[.]mdx/docs/$.ts`:

```ts
import { createFileRoute, notFound } from '@tanstack/react-router';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getLLMText } from '../../../lib/get-llm-text';
import { source } from '../../../lib/source';
import { packageDocSlugMap } from '../../../lib/package-doc-slug-map';

const PACKAGE_DOCS_DIR = join(import.meta.dirname, '../../../../../packages/@luke-ui/react/docs');

export const Route = createFileRoute('/llms.mdx/docs/$')({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const splat = params._splat ?? '';
				if (!splat.endsWith('.md')) throw notFound();
				const path = splat.slice(0, -3);

				// Component slugs map to package docs.
				const segments = path.split('/').filter(Boolean);
				const lastSegment = segments[segments.length - 1] ?? '';
				if (packageDocSlugMap.has(lastSegment)) {
					const md = await readFile(join(PACKAGE_DOCS_DIR, `${lastSegment}.md`), 'utf8').catch(
						() => null,
					);
					if (md) {
						return new Response(md, {
							headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
						});
					}
				}

				// Fall back to Fumadocs-rendered pages (e.g. getting-started).
				const slugs = segments.length === 1 && segments[0] === 'index' ? [] : segments;
				const page = source.getPage(slugs);
				if (!page) throw notFound();
				return new Response(await getLLMText(page), {
					headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
				});
			},
		},
	},
});
```

- [ ] **Step 14.2: Smoke-test both branches**

```bash
pnpm --filter docs dev
curl http://localhost:3000/llms.mdx/docs/components/actions/button.md  # package docs
curl http://localhost:3000/llms.mdx/docs/getting-started.md             # Fumadocs fallback
```

Expected: first returns the contents of `packages/@luke-ui/react/docs/button.md`; second returns the Fumadocs-processed `getting-started` page.

- [ ] **Step 14.3: Commit**

```bash
git add apps/docs/src/routes/llms\[.\]mdx/docs/\$.ts
git commit -m "refactor(docs): /llms.mdx/docs/* streams package docs directly"
```

---

## Task 15: Verify tarball, update AGENTS.md, run full check suite

**Goal:** End-to-end verification. `npm pack --dry-run` ships the right files; AGENTS.md captures the new conventions; CI-equivalent checks all pass.

**Files:**

- Modify: `packages/@luke-ui/react/AGENTS.md`

- [ ] **Step 15.1: Update package AGENTS.md**

Edit `packages/@luke-ui/react/AGENTS.md`. After the existing content, add:

```markdown
## Documentation generation

JSDoc and TypeScript types drive generated docs under `docs/`. When adding or modifying a component:

- Function-level JSDoc on the exported component describes what it is for an app developer.
- The exported `Props` interface carries an `@tier` JSDoc tag (`atom`, `composed`, or `primitive`).
- Each prop has JSDoc and (where defaults exist in the React component's destructure) a `@default` tag.
- For atom and composed components, _re-declare important props inherited from `react-aria-components` on the package's own interface_ with full JSDoc, so they appear in the generated "own props" table. Use the type passthrough pattern: `isDisabled?: RACButtonProps['isDisabled']`. Don't re-declare every RAC prop — only the load-bearing ones an app dev will reach for.
- The long tail of inherited props is covered by a single auto-generated "Extends `react-aria-components` `<Component>`" pointer.

Co-located prose (`*.docs.md`) explains usage judgement; the generator splices it into the rendered page. Don't put Props tables, Import blocks, or descriptions in `*.docs.md` — those are generated.

Run `pnpm --filter @luke-ui/react generate:docs` to regenerate `docs/`. CI fails on stale via `pnpm --filter @luke-ui/react check:docs`.
```

- [ ] **Step 15.2: Run full check suite**

```bash
pnpm --filter @luke-ui/react run check:types
pnpm --filter @luke-ui/react run check:lint
pnpm --filter @luke-ui/react run check:docs
pnpm --filter @luke-ui/react exec vitest run scripts/lib/__tests__
```

Expected: all PASS.

- [ ] **Step 15.3: Verify tarball contents**

```bash
cd packages/@luke-ui/react
npm pack --dry-run --json | jq '.[0].files[].path' | sort
```

Expected file list contains: `package.json`, `README.md`, `LICENSE`, `dist/...`, `docs/...` — and **does not** contain `src/`, `scripts/`, `screenshots/`, `*.config.ts`, `tsconfig*`, `AGENTS.md`, `vitest.shims.d.ts`.

- [ ] **Step 15.4: Apps/docs build runs end-to-end**

```bash
pnpm --filter docs run build
```

Expected: PASS.

- [ ] **Step 15.5: Commit**

```bash
git add packages/@luke-ui/react/AGENTS.md
git commit -m "docs(react): document JSDoc-driven docs convention in AGENTS.md"
```

- [ ] **Step 15.6: Final verification — entire repo build**

```bash
pnpm run build
```

Expected: PASS across all workspaces.

---

## Self-review checklist

Confirmed against the spec (ADR-0003 + grilling outcomes):

- ✅ Package docs surface at `packages/@luke-ui/react/docs/` (Tasks 4, 6, 7, 8)
- ✅ Generated from JSDoc + TS types via ts-morph (Task 3)
- ✅ Per-export pages committed; `llms-full.md` to `dist/docs/` uncommitted (Tasks 5–9)
- ✅ JSDoc-authoritative; \*.docs.md prose-only (Tasks 5, 6)
- ✅ Own props + extends pointer; RAC re-declaration on atom/composed (Tasks 4, 5)
- ✅ b2-with-mitigations: linguist-generated via .gitattributes (Task 1)
- ✅ Stale check via `git diff --exit-code` (Task 1, verified Task 10)
- ✅ Auto-adapt by export shape (single vs barrel) (Task 6, 7)
- ✅ Tiered scope: 17 components + 4 barrels + asset index entries (Tasks 6–8)
- ✅ Path inference for titles (Task 4)
- ✅ Standalone `generate:docs` script invoked from `tsdown` `build:prepare` (Tasks 1, 10)
- ✅ Single shared `renderIndex` builder with `includeLibraryAuthors` flag (Tasks 8, 13)
- ✅ Hosted γ architecture: hosted MDX renders generated `.md` via `<RenderMarkdown>` (Tasks 11, 12)
- ✅ Rename `*.docs.mdx` → `*.docs.md` (Tasks 5, 6)
- ✅ `package.json#files` allowlist (Task 1)
- ✅ Hand-authored README.md (Task 8)
- ✅ Hand-committed LICENSE (Task 8)
- ✅ Version stays at 0.0.0; first publish deferred (no task — explicit non-goal)
- ✅ AGENTS.md updated with JSDoc convention (Task 15)

---

## Plan complete

Plan saved to `docs/superpowers/plans/2026-05-08-ai-native-package-docs.md`. Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
