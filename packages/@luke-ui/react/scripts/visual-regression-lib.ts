import path from 'node:path';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

export type VisualResult = {
	id: string;
	status: 'added' | 'changed' | 'removed' | 'unchanged';
	base?: string;
	current?: string;
	diff?: string;
	mismatchedPixels?: number;
	mismatchRatio?: number;
	height?: number;
	width?: number;
	baseViewport?: string;
	currentViewport?: string;
};

const appearanceSuffixes = [
	'machined-edge-light',
	'machined-edge-dark',
	'elmo-light',
	'elmo-dark',
] as const;

type CaptureFile = { file: string; viewport?: string };

export async function validateCaptureIds(sourceRoot: string) {
	const owners = new Map<string, string>();
	async function visit(directory: string) {
		await Promise.all(
			(await readdir(directory, { withFileTypes: true })).map(async (entry) => {
				const file = path.join(directory, entry.name);
				if (entry.isDirectory()) await visit(file);
				else if (entry.name.endsWith('.visual.test.tsx')) {
					const source = await readFile(file, 'utf8');
					const calls = [...source.matchAll(/captureVisual\(/g)];
					const matches = [...source.matchAll(/captureVisual\([\s\S]*?,\s*'([^']+)'\s*,?\s*\)/g)];
					if (calls.length !== matches.length) {
						throw new Error(`Visual capture IDs must be string literals: ${file}`);
					}
					for (const match of matches) registerCaptureId(match[1], file, owners);

					const appearanceCalls = [...source.matchAll(/captureVisualAppearance\(/g)];
					const appearanceMatches = [
						...source.matchAll(/captureVisualAppearance\([\s\S]*?,\s*'([^']+)'\s*,/g),
					];
					if (appearanceCalls.length !== appearanceMatches.length) {
						throw new Error(`Visual appearance capture IDs must be string literals: ${file}`);
					}
					for (const match of appearanceMatches) {
						for (const suffix of appearanceSuffixes) {
							registerCaptureId(`${match[1]}-${suffix}`, file, owners);
						}
					}
				}
			}),
		);
	}
	await visit(sourceRoot);
	return owners;
}

function registerCaptureId(id: string | undefined, file: string, owners: Map<string, string>) {
	if (!id || !/^[a-z0-9-]+\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
		throw new Error(`Visual capture ID must be namespaced: ${id}`);
	}
	const owner = owners.get(id);
	if (owner) throw new Error(`Duplicate visual capture ID ${id}: ${owner} and ${file}`);
	owners.set(id, file);
}

async function listPngs(root: string) {
	const result = new Map<string, CaptureFile>();
	async function visit(directory: string) {
		await Promise.all(
			(await readdir(directory, { withFileTypes: true }).catch(() => [])).map(async (entry) => {
				const file = path.join(directory, entry.name);
				if (entry.isDirectory()) await visit(file);
				else if (entry.name.endsWith('.png')) {
					const captureName = path
						.relative(root, file)
						.replace(/\.png$/, '')
						.split(path.sep)
						.join('/');
					const metadata = captureName.match(/^(.*)__viewport-(\d+x\d+)$/);
					const id = metadata?.[1] ?? captureName;
					if (result.has(id)) throw new Error(`Duplicate visual capture ID: ${id}`);
					result.set(id, { file, viewport: metadata?.[2] });
				}
			}),
		);
	}
	await visit(root);
	return result;
}

export async function compareCaptures(baseDir: string, currentDir: string, diffDir: string) {
	const [base, current] = await Promise.all([listPngs(baseDir), listPngs(currentDir)]);
	const ids = [...new Set([...base.keys(), ...current.keys()])].sort();
	await mkdir(diffDir, { recursive: true });
	const results = await Promise.all(
		ids.map(async (id): Promise<VisualResult> => {
			const baseCapture = base.get(id);
			const currentCapture = current.get(id);
			if (!baseCapture) {
				return {
					current: currentCapture?.file,
					currentViewport: currentCapture?.viewport,
					id,
					status: 'added',
				};
			}
			if (!currentCapture) {
				return {
					base: baseCapture.file,
					baseViewport: baseCapture.viewport,
					id,
					status: 'removed',
				};
			}

			const [basePng, currentPng] = await Promise.all([
				readFile(baseCapture.file).then((data) => PNG.sync.read(data)),
				readFile(currentCapture.file).then((data) => PNG.sync.read(data)),
			]);
			const width = Math.max(basePng.width, currentPng.width);
			const height = Math.max(basePng.height, currentPng.height);
			const diffPng = new PNG({ height, width });
			let mismatchedPixels: number;
			if (basePng.width !== currentPng.width || basePng.height !== currentPng.height) {
				mismatchedPixels = width * height;
				for (let index = 0; index < diffPng.data.length; index += 4) {
					diffPng.data.set([255, 0, 0, 255], index);
				}
			} else {
				mismatchedPixels = pixelmatch(basePng.data, currentPng.data, diffPng.data, width, height, {
					threshold: 0.2,
				});
			}
			const mismatchRatio = mismatchedPixels / (width * height);
			const hasViewportChange = baseCapture.viewport !== currentCapture.viewport;
			const status = mismatchRatio > 0.001 || hasViewportChange ? 'changed' : 'unchanged';
			let diff: string | undefined;
			if (status === 'changed') {
				diff = path.join(diffDir, `${id}.png`);
				await mkdir(path.dirname(diff), { recursive: true });
				await writeFile(diff, PNG.sync.write(diffPng));
			}
			return {
				base: baseCapture.file,
				baseViewport: baseCapture.viewport,
				current: currentCapture.file,
				currentViewport: currentCapture.viewport,
				diff,
				height,
				id,
				mismatchedPixels,
				mismatchRatio,
				status,
				width,
			};
		}),
	);
	return results;
}

export async function renderReport(
	results: Array<VisualResult>,
	metadata: { base: string; current: string; platform: string },
	outputFile: string,
) {
	const counts = countResults(results);
	const cards = await Promise.all(results.map(renderCard));
	const html = renderDocument(results, counts, cards, metadata);
	await mkdir(path.dirname(outputFile), { recursive: true });
	await writeFile(outputFile, html);
	return counts;
}

function countResults(results: Array<VisualResult>) {
	return Object.fromEntries(
		(['unchanged', 'changed', 'added', 'removed'] as const).map((status) => [
			status,
			results.filter((result) => result.status === status).length,
		]),
	);
}

async function renderCard(result: VisualResult) {
	const [base, current, diff] = await Promise.all([
		loadImage(result.base),
		loadImage(result.current),
		loadImage(result.diff),
	]);
	const ratio = result.mismatchRatio == null ? '' : `${(result.mismatchRatio * 100).toFixed(3)}%`;
	const dimensions = result.width && result.height ? `${result.width} × ${result.height}` : '';
	const pixels =
		result.mismatchedPixels == null ? '' : `${result.mismatchedPixels} mismatched pixels`;
	const viewports = `main viewport ${result.baseViewport ?? 'unknown'} · current viewport ${result.currentViewport ?? 'unknown'}`;
	const namespace = getNamespace(result.id);
	const overlay =
		base && current
			? `<figure class="overlay"><figcaption>overlay</figcaption><div><img src="${base}" alt="main"><img class="current" src="${current}" alt="current"></div><label>Reveal current <input type="range" min="0" max="100" value="50" oninput="this.closest('figure').style.setProperty('--reveal',this.value+'%')"></label></figure>`
			: '';
	const images = `${overlay}${renderImage('main', base)}${renderImage('current', current)}${renderImage('diff', diff)}`;

	return `<article data-status="${result.status}" data-namespace="${namespace}"><h2>${escapeHtml(result.id)}</h2><p><strong>${result.status}</strong> ${ratio} · ${dimensions} · ${pixels}<br>${viewports}</p><div class="images">${images}</div></article>`;
}

function renderDocument(
	results: Array<VisualResult>,
	counts: Record<string, number>,
	cards: Array<string>,
	metadata: { base: string; current: string; platform: string },
) {
	const statusButtons = Object.entries(counts)
		.map(
			([status, count]) =>
				`<button onclick="document.body.dataset.filter='${status}'">${status} (${count})</button>`,
		)
		.join('');
	const namespaces = [...new Set(results.map((result) => getNamespace(result.id)))].sort();
	const namespaceOptions = namespaces
		.map((namespace) => `<option value="${namespace}">${namespace}</option>`)
		.join('');
	const filterScript =
		"for(const card of document.querySelectorAll('article'))card.hidden=this.value!==''&&card.dataset.namespace!==this.value";

	return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Visual regression report</title><style>body{font:14px system-ui;margin:2rem;color:#161616}header{position:sticky;top:0;z-index:1;background:white;padding:.5rem 0;border-bottom:1px solid #ddd}button,select{margin:.25rem;padding:.5rem}article{padding:1rem 0;border-bottom:1px solid #ddd}.images{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}img{display:block;max-width:100%;border:1px solid #ccc}figure{margin:0}.overlay{--reveal:50%}.overlay div{display:grid}.overlay div img{grid-area:1/1}.overlay .current{clip-path:inset(0 calc(100% - var(--reveal)) 0 0)}.overlay input{width:100%}body[data-filter=changed] article:not([data-status=changed]),body[data-filter=added] article:not([data-status=added]),body[data-filter=removed] article:not([data-status=removed]),body[data-filter=unchanged] article:not([data-status=unchanged]){display:none}</style><body><header><h1>Visual regression report</h1><p>base ${escapeHtml(metadata.base)} · current ${escapeHtml(metadata.current)} · ${escapeHtml(metadata.platform)}</p><nav><button onclick="document.body.dataset.filter=''">all (${results.length})</button>${statusButtons}<label>component <select onchange="${filterScript}"><option value="">all</option>${namespaceOptions}</select></label></nav></header><main>${cards.join('')}</main></body></html>`;
}

async function loadImage(file?: string) {
	return file ? `data:image/png;base64,${(await readFile(file)).toString('base64')}` : '';
}

function renderImage(label: string, image: string) {
	return image
		? `<figure><figcaption>${label}</figcaption><img src="${image}" alt="${label}"></figure>`
		: '';
}

function escapeHtml(value: string) {
	return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
}

function getNamespace(id: string) {
	return id.includes('/') ? (id.split('/')[0] ?? 'legacy') : 'legacy';
}
