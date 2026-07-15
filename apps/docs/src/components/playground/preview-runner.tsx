import { useTheme } from 'next-themes';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { transform } from 'sucrase';
import { playgroundScope } from '../../generated/playground-scope.generated';
import { decodeCodeHash } from '../../lib/playground-hash';
import type { PlaygroundPreviewMessage } from '../../lib/playground-protocol';
import { isPlaygroundParentMessage } from '../../lib/playground-protocol';
import { StoryWrapper } from '../../lib/story-wrapper';
import { useDocsThemeIdentity } from '../theme-controls';

// Interop wrappers are cached so repeated requires return stable module objects.
const moduleCache = new Map<string, Record<string, unknown>>();

type PreviewRun = { UserComponent: ComponentType; runId: number };

export default function PreviewRunner() {
	const [run, setRun] = useState<PreviewRun | null>(null);
	const { setTheme: setColorMode } = useTheme();
	const { setThemeIdentity } = useDocsThemeIdentity();

	useEffect(() => {
		let runId = 0;

		const runCode = (code: string) => {
			try {
				const UserComponent = compileComponent(code);
				runId += 1;
				setRun({ runId, UserComponent });
				postToParent({ type: 'playground:success' });
			} catch (error) {
				reportError(error);
			}
		};

		const onMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin) return;
			if (!isPlaygroundParentMessage(event.data)) return;
			if (event.data.type === 'playground:code') {
				runCode(event.data.code);
				return;
			}
			setThemeIdentity(event.data.themeIdentity);
			setColorMode(event.data.colorMode);
		};

		window.addEventListener('message', onMessage);
		const initialCode = decodeCodeHash(window.location.hash);
		if (initialCode) runCode(initialCode);
		postToParent({ type: 'playground:ready' });
		return () => window.removeEventListener('message', onMessage);
	}, [setColorMode, setThemeIdentity]);

	if (!run) return null;

	return (
		<div className="flex min-h-dvh flex-col *:flex-1">
			<StoryWrapper>
				<ErrorBoundary fallback={null} key={run.runId} onError={reportError}>
					<run.UserComponent />
				</ErrorBoundary>
			</StoryWrapper>
		</div>
	);
}

function requireModule(specifier: string): Record<string, unknown> {
	const cached = moduleCache.get(specifier);
	if (cached) return cached;

	const namespace = playgroundScope[specifier];
	if (namespace === undefined) {
		throw new Error(
			`Cannot import '${specifier}' — only react and @luke-ui/react/* modules are available in the playground.`,
		);
	}

	// Mark as an ES module so sucrase's interop resolves default imports correctly.
	const module = { ...(namespace as Record<string, unknown>), __esModule: true };
	moduleCache.set(specifier, module);
	return module;
}

function compileComponent(code: string): ComponentType {
	const compiled = transform(code, {
		jsxRuntime: 'automatic',
		production: true,
		transforms: ['typescript', 'jsx', 'imports'],
	}).code;

	const module: { exports: { default?: unknown } } = { exports: {} };
	// Evaluating user code is the point of the playground; it only ever comes
	// from the user's own editor or URL hash (same trust model as the
	// TypeScript playground).
	// oxlint-disable-next-line typescript/no-implied-eval
	new Function('require', 'module', 'exports', compiled)(requireModule, module, module.exports);

	const component = module.exports.default;
	if (typeof component !== 'function') {
		throw new Error('Playground code must default-export a React component.');
	}
	return component as ComponentType;
}

function postToParent(message: PlaygroundPreviewMessage): void {
	window.parent.postMessage(message, window.location.origin);
}

function reportError(error: unknown): void {
	const message = error instanceof Error ? error.message : String(error);
	postToParent({ message, type: 'playground:error' });
}
