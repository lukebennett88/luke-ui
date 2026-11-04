import { createPlaygroundPageSession } from '@luke-ui/playground-core/protocol';
import type { PlaygroundPageSession } from '@luke-ui/playground-core/protocol';
import { useEffect, useRef, useState } from 'react';
import { withBasePath } from '../lib/base-path.js';
import type { PlaygroundAppearance } from '../lib/playground-appearance-message.js';
import { postPlaygroundAppearance } from '../lib/playground-appearance-message.js';
import { useDocsTheme } from './theme-controls.js';
import * as styles from './inline-example-preview.css.js';

const CODE_DEBOUNCE_MS = 300;

/** Reuses the full Playground's isolated compiler and preview route. */
export default function InlineExamplePreview({ code, title }: { code: string; title: string }) {
	const iframeRef = useRef<HTMLIFrameElement>(null);
	const sessionRef = useRef<PlaygroundPageSession | null>(null);
	const codeRef = useRef(code);
	const { colorModePreference, themeIdentity } = useDocsTheme();
	const appearanceRef = useRef<PlaygroundAppearance>({
		colorMode: colorModePreference,
		themeIdentity,
	});
	const [error, setError] = useState<string | null>(null);
	codeRef.current = code;

	useEffect(() => {
		const session = createPlaygroundPageSession({
			getCode: () => codeRef.current,
			getPorts: () => ({
				origin: window.location.origin,
				previewWindow: iframeRef.current?.contentWindow ?? null,
			}),
			onPreviewReady: (ports) => {
				postPlaygroundAppearance(appearanceRef.current, ports);
			},
			onResult: (result) => {
				setError(result.type === 'error' ? result.message : null);
			},
		});
		sessionRef.current = session;
		const onMessage = (event: MessageEvent) => session.handleMessage(event);
		window.addEventListener('message', onMessage);
		session.resync();
		return () => {
			window.removeEventListener('message', onMessage);
			sessionRef.current = null;
		};
	}, []);

	useEffect(() => {
		const appearance = { colorMode: colorModePreference, themeIdentity };
		appearanceRef.current = appearance;
		postPlaygroundAppearance(appearance, {
			origin: window.location.origin,
			previewWindow: iframeRef.current?.contentWindow ?? null,
		});
	}, [colorModePreference, themeIdentity]);

	useEffect(() => {
		const timeout = window.setTimeout(() => sessionRef.current?.postCode(code), CODE_DEBOUNCE_MS);
		return () => window.clearTimeout(timeout);
	}, [code]);

	return (
		<div className={styles.frame}>
			{/* The Playground compiler requires same-origin messaging with this iframe. */}
			{/* oxlint-disable-next-line react/iframe-missing-sandbox */}
			<iframe
				className={styles.iframe}
				ref={iframeRef}
				src={withBasePath('/playground/preview', import.meta.env.BASE_URL)}
				title={title + ' editable preview'}
			/>
			{error == null ? null : (
				<div className={styles.error} role="alert">
					{error}
				</div>
			)}
		</div>
	);
}
