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
	mismatchClusterArea?: number;
	height?: number;
	width?: number;
	baseViewport?: string;
	currentViewport?: string;
};

type CaptureFile = { file: string; viewport?: string };

// pixelmatch's default `diffColor`/`diffColorAlt` (unset here, so both fall
// back to this value). Background pixels are always a shade of grey (equal
// R/G/B) and anti-aliasing-excluded pixels are yellow, so this exact colour
// unambiguously marks a real mismatch.
const DIFF_MARKER_COLOR: readonly [number, number, number] = [255, 0, 0];

// Minimum bounding-box area (px²) a single local cluster of mismatched pixels
// must span to count as a real change rather than noise. Measured (#249) by
// running the full visual suite against an unchanged tree: with motion frozen
// and the caret hidden, the worst noise was 33 pixels of text anti-aliasing
// jitter in an 8x11px (88px²) cluster, while the real #312 icon in
// `__fixtures__/pr-312` clusters to 324px². 120 sits between the two. A
// capture-wide ratio isn't used because it dilutes a small change on a large
// canvas, which is how #312 went unnoticed.
const MISMATCH_CLUSTER_AREA_THRESHOLD = 120;

/** The bounding-box area (px²) of the largest 8-connected cluster of mismatched pixels in `diff`. */
function largestMismatchClusterArea(diff: PNG, width: number, height: number) {
	const isMismatch = (x: number, y: number) => {
		const index = (y * width + x) * 4;
		return (
			diff.data[index] === DIFF_MARKER_COLOR[0] &&
			diff.data[index + 1] === DIFF_MARKER_COLOR[1] &&
			diff.data[index + 2] === DIFF_MARKER_COLOR[2]
		);
	};
	const visited = new Uint8Array(width * height);
	let largest = 0;
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			if (visited[y * width + x] || !isMismatch(x, y)) continue;
			let minX = x;
			let maxX = x;
			let minY = y;
			let maxY = y;
			const queue: Array<[number, number]> = [[x, y]];
			visited[y * width + x] = 1;
			while (queue.length > 0) {
				const [cx, cy] = queue.pop() as [number, number];
				const top = Math.max(0, cy - 1);
				const bottom = Math.min(height - 1, cy + 1);
				const left = Math.max(0, cx - 1);
				const right = Math.min(width - 1, cx + 1);
				for (let ny = top; ny <= bottom; ny++) {
					for (let nx = left; nx <= right; nx++) {
						const index = ny * width + nx;
						if (!visited[index] && isMismatch(nx, ny)) {
							visited[index] = 1;
							queue.push([nx, ny]);
							if (nx < minX) minX = nx;
							if (nx > maxX) maxX = nx;
							if (ny < minY) minY = ny;
							if (ny > maxY) maxY = ny;
						}
					}
				}
			}
			largest = Math.max(largest, (maxX - minX + 1) * (maxY - minY + 1));
		}
	}
	return largest;
}

async function listPngs(root: string) {
	const result = new Map<string, CaptureFile>();
	await walkPngs(root, (file, captureName) => {
		const metadata = captureName.match(/^(.*)__viewport-(\d+x\d+)$/);
		const id = metadata?.[1] ?? captureName;
		if (result.has(id)) throw new Error(`Duplicate visual capture ID: ${id}`);
		result.set(id, { file, viewport: metadata?.[2] });
	});
	return result;
}

/** Walks `root` for `.png` files, calling `visitor` with each file's path and its capture name (the path relative to `root`, without the extension). */
async function walkPngs(root: string, visitor: (file: string, captureName: string) => void) {
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
					visitor(file, captureName);
				}
			}),
		);
	}
	await visit(root);
}

/**
 * Fails captures taller than their recorded viewport whose bottom decile is a
 * single uniform colour, meaning the scene grew but that region never
 * painted. See #310 for why `captureVisual` has to grow both the page and the
 * test iframe for a tall scene to paint in full.
 */
export async function assertCapturesPainted(directory: string) {
	const viewportCaptures: Array<{ file: string; id: string; viewportHeight: number }> = [];
	await walkPngs(directory, (file, captureName) => {
		const metadata = captureName.match(/^(.*)__viewport-\d+x(\d+)$/);
		const id = metadata?.[1];
		const viewportHeight = metadata?.[2];
		if (id === undefined || viewportHeight === undefined) return;
		viewportCaptures.push({ file, id, viewportHeight: Number(viewportHeight) });
	});

	const offenders: Array<string> = [];
	await Promise.all(
		viewportCaptures.map(async ({ file, id, viewportHeight }) => {
			const png = PNG.sync.read(await readFile(file));
			if (png.height <= viewportHeight) return;
			if (isBottomBandUniform(png)) {
				offenders.push(`${id} (${png.width}x${png.height})`);
			}
		}),
	);

	if (offenders.length > 0) {
		offenders.sort();
		throw new Error(
			`Visual captures painted only part of their height (see #310): ${offenders.join(', ')}`,
		);
	}
}

function isBottomBandUniform(png: PNG) {
	const bandHeight = Math.max(1, Math.round(png.height / 10));
	const firstRowStart = (png.height - bandHeight) * png.width * 4;
	const [r, g, b, a] = png.data.subarray(firstRowStart, firstRowStart + 4);
	for (let index = firstRowStart; index < png.data.length; index += 4) {
		if (
			png.data[index] !== r ||
			png.data[index + 1] !== g ||
			png.data[index + 2] !== b ||
			png.data[index + 3] !== a
		) {
			return false;
		}
	}
	return true;
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
					includeAA: true,
					threshold: 0.1,
				});
			}
			const mismatchRatio = mismatchedPixels / (width * height);
			const clusterArea =
				mismatchedPixels === 0 ? 0 : largestMismatchClusterArea(diffPng, width, height);
			const hasViewportChange = baseCapture.viewport !== currentCapture.viewport;
			const status =
				clusterArea >= MISMATCH_CLUSTER_AREA_THRESHOLD || hasViewportChange
					? 'changed'
					: 'unchanged';
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
				mismatchClusterArea: clusterArea,
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
	const clusterArea =
		result.mismatchClusterArea == null ? '' : `${result.mismatchClusterArea}px² diff area`;
	const viewports = `main viewport ${result.baseViewport ?? 'unknown'} · current viewport ${result.currentViewport ?? 'unknown'}`;
	const namespace = getNamespace(result.id);
	const overlay =
		base && current
			? `<figure class="overlay"><figcaption>overlay</figcaption><div><img src="${base}" alt="main"><img class="current" src="${current}" alt="current"></div><label>Reveal current <input type="range" min="0" max="100" value="50" oninput="this.closest('figure').style.setProperty('--reveal',this.value+'%')"></label></figure>`
			: '';
	const images = `${overlay}${renderImage('main', base)}${renderImage('current', current)}${renderImage('diff', diff)}`;

	return `<article data-status="${result.status}" data-namespace="${namespace}"><h2>${escapeHtml(result.id)}</h2><p><strong>${result.status}</strong> ${ratio} · ${dimensions} · ${pixels} · ${clusterArea}<br>${viewports}</p><div class="images">${images}</div></article>`;
}

function renderDocument(
	results: Array<VisualResult>,
	counts: Record<string, number>,
	cards: Array<string>,
	metadata: { base: string; current: string; platform: string },
) {
	const statusButtons = Object.entries(counts)
		.map(([status, count]) => {
			return `<button onclick="document.body.dataset.filter='${status}'">${status} (${count})</button>`;
		})
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
