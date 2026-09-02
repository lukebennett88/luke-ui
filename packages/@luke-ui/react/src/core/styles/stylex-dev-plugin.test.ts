import { join } from 'node:path';
import { rm, writeFile } from 'node:fs/promises';
import { expect, test } from 'vite-plus/test';
import { createStylexDevPlugin, workspaceRoot } from '../../../stylex-vite-plugin.js';

type DevPlugin = ReturnType<typeof createStylexDevPlugin>;
type LoadHandler = Extract<NonNullable<DevPlugin['load']>, (...args: never) => unknown>;
type HotUpdateHandler = Extract<NonNullable<DevPlugin['hotUpdate']>, (...args: never) => unknown>;
type HotUpdateThis = ThisParameterType<HotUpdateHandler>;
type HotUpdateServer = Parameters<HotUpdateHandler>[0]['server'];

const RESOLVED_STYLEX_VIRTUAL_CSS_ID = '\0virtual:luke-stylex.css';

/**
 * A uniquely named temp module under the scanned source root, so `loadSourceRules` picks it up
 * during this test without affecting any other test's source scan. Deleted in `finally`.
 */
const probeFile = join(workspaceRoot, 'packages/@luke-ui/react/src/core/styles/__hmr-probe.tmp.ts');

function probeSource(distinctiveValue: string): string {
	return `import * as stylex from '@stylexjs/stylex';
export const hmrProbeStyles = stylex.create({
	probe: {
		color: '${distinctiveValue}',
	},
});
`;
}

/**
 * Neither `load` nor `hotUpdate` on this plugin reads anything off `this`, so an empty object
 * stands in for the `PluginContext` both hooks are typed to receive.
 */
const pluginContext = {} as ThisParameterType<LoadHandler> & HotUpdateThis;

test('invalidates cached StyleX CSS when an eligible source module changes', async () => {
	await writeFile(probeFile, probeSource('rgb(11,22,33)'), 'utf8');

	try {
		const plugin = createStylexDevPlugin();
		const load = plugin.load;
		const hotUpdate = plugin.hotUpdate;
		if (typeof load !== 'function' || typeof hotUpdate !== 'function') {
			throw new Error('Expected `load` and `hotUpdate` to be plain functions on the dev plugin.');
		}

		const firstCss = await load.call(pluginContext, RESOLVED_STYLEX_VIRTUAL_CSS_ID);
		expect(typeof firstCss).toBe('string');
		expect(firstCss as string).toContain('rgb(11,22,33)');
		expect(firstCss as string).not.toContain('rgb(44,55,66)');

		// Change the probe module's StyleX rule to a new distinctive value, then simulate Vite's
		// hot-update hook firing for that file. Without invalidation, the next `load` would keep
		// serving the CSS captured above — still `rgb(11,22,33)`, never the new value.
		await writeFile(probeFile, probeSource('rgb(44,55,66)'), 'utf8');

		let invalidatedModule: unknown;
		const fakeServer = {
			moduleGraph: {
				getModuleById: (id: string) => (id === RESOLVED_STYLEX_VIRTUAL_CSS_ID ? { id } : undefined),
				invalidateModule: (mod: unknown) => {
					invalidatedModule = mod;
				},
			},
		} as unknown as HotUpdateServer;

		await hotUpdate.call(pluginContext, {
			type: 'update',
			file: probeFile,
			timestamp: Date.now(),
			modules: [],
			read: async () => probeSource('rgb(44,55,66)'),
			server: fakeServer,
		});

		expect(invalidatedModule).toEqual({ id: RESOLVED_STYLEX_VIRTUAL_CSS_ID });

		const secondCss = await load.call(pluginContext, RESOLVED_STYLEX_VIRTUAL_CSS_ID);
		expect(secondCss as string).toContain('rgb(44,55,66)');
		expect(secondCss as string).not.toContain('rgb(11,22,33)');
	} finally {
		await rm(probeFile, { force: true });
	}
});

test('does not invalidate for a file the StyleX transform never touches', async () => {
	const plugin = createStylexDevPlugin();
	const load = plugin.load;
	const hotUpdate = plugin.hotUpdate;
	if (typeof load !== 'function' || typeof hotUpdate !== 'function') {
		throw new Error('Expected `load` and `hotUpdate` to be plain functions on the dev plugin.');
	}

	await load.call(pluginContext, RESOLVED_STYLEX_VIRTUAL_CSS_ID);

	let invalidateCalled = false;
	const fakeServer = {
		moduleGraph: {
			getModuleById: () => {
				invalidateCalled = true;
				return undefined;
			},
			invalidateModule: () => {
				invalidateCalled = true;
			},
		},
	} as unknown as HotUpdateServer;

	await hotUpdate.call(pluginContext, {
		type: 'update',
		file: join(workspaceRoot, 'packages/@luke-ui/react/README.md'),
		timestamp: Date.now(),
		modules: [],
		read: async () => '',
		server: fakeServer,
	});

	expect(invalidateCalled).toBe(false);
});
