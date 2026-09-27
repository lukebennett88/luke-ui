import { createPlaygroundCompiler } from '@luke-ui/playground-core/compiler';
import { decodeCodeHash } from '@luke-ui/playground-core/hash';
import { isPlaygroundCodeMessage, isTrustedMessageSource } from '@luke-ui/playground-core/protocol';
import type { PlaygroundPreviewMessage } from '@luke-ui/playground-core/protocol';
import { useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { playgroundScope } from '../../generated/playground-scope.generated';
import { isPlaygroundAppearanceMessage } from '../../lib/playground-appearance-message.js';
import { StoryWrapper } from '../../lib/story-wrapper';
import { previewThemePrefs } from '../../lib/theme-prefs.js';

type PreviewRun = { UserComponent: ComponentType; runId: number };

const { compileComponent } = createPlaygroundCompiler(playgroundScope);

export default function PreviewRunner() {
	const [run, setRun] = useState<PreviewRun | null>(null);

	useEffect(() => {
		let runId = 0;

		const runCode = (code: string) => {
			try {
				// The compiler only rejects a missing default export; the ErrorBoundary
				// below reports an invalid component type as a render-time error.
				const UserComponent = compileComponent(code) as ComponentType;
				runId += 1;
				setRun({ runId, UserComponent });
				postToParent({ type: 'playground:success' });
			} catch (error) {
				reportError(error);
			}
		};

		const onMessage = (event: MessageEvent) => {
			if (!isTrustedMessageSource(event, window.location.origin, window.parent)) return;
			if (isPlaygroundCodeMessage(event.data)) {
				runCode(event.data.code);
				return;
			}
			if (!isPlaygroundAppearanceMessage(event.data)) return;
			// The parent page has already stored these prefs, so only mirror them here.
			previewThemePrefs({
				colorModePreference: event.data.colorMode,
				themeIdentity: event.data.themeIdentity,
			});
		};

		window.addEventListener('message', onMessage);
		const initialCode = decodeCodeHash(window.location.hash);
		if (initialCode) runCode(initialCode);
		postToParent({ type: 'playground:ready' });
		return () => window.removeEventListener('message', onMessage);
	}, []);

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

function postToParent(message: PlaygroundPreviewMessage): void {
	window.parent.postMessage(message, window.location.origin);
}

function reportError(error: unknown): void {
	const message = error instanceof Error ? error.message : String(error);
	postToParent({ message, type: 'playground:error' });
}
