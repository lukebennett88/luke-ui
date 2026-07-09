import Editor from '@monaco-editor/react';
import { useEffect, useSyncExternalStore } from 'react';
import { loadPlaygroundTypes, monacoThemes } from '../../lib/monaco-setup';
import { EditorSkeleton } from './editor-skeleton';

type PlaygroundEditorProps = {
	defaultValue: string;
	onChange: (code: string) => void;
	showLoadingPill: boolean;
};

export default function PlaygroundEditor({
	defaultValue,
	onChange,
	showLoadingPill,
}: PlaygroundEditorProps) {
	const theme = useSiteTheme();

	useEffect(() => {
		void loadPlaygroundTypes();
	}, []);

	return (
		<Editor
			defaultLanguage="typescript"
			defaultValue={defaultValue}
			// Covers Monaco's own init after the lazy chunk resolves, which would
			// otherwise flash the library's default centered "Loading..." text.
			loading={<EditorSkeleton code={defaultValue} showPill={showLoadingPill} />}
			onChange={(value) => onChange(value ?? '')}
			options={{
				automaticLayout: true,
				fixedOverflowWidgets: true,
				folding: false,
				// Font and layout metrics are mirrored by EditorSkeleton; keep them in sync.
				fontFamily:
					'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
				fontSize: 13,
				lineHeight: 20,
				lineNumbersMinChars: 3,
				minimap: { enabled: false },
				padding: { top: 12 },
				scrollBeyondLastLine: false,
				tabSize: 2,
			}}
			path="file:///playground/index.tsx"
			theme={theme}
		/>
	);
}

function useSiteTheme(): (typeof monacoThemes)[keyof typeof monacoThemes] {
	const isDark = useSyncExternalStore(subscribeToRootClass, isRootDark, () => false);
	return isDark ? monacoThemes.dark : monacoThemes.light;
}

function isRootDark() {
	return document.documentElement.classList.contains('dark');
}

function subscribeToRootClass(onStoreChange: () => void) {
	const observer = new MutationObserver(onStoreChange);
	observer.observe(document.documentElement, { attributeFilter: ['class'] });
	return () => observer.disconnect();
}
