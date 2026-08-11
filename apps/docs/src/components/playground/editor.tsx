import { Button } from '@luke-ui/react/button';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { loadPlaygroundTypes, monacoThemes } from '../../lib/monaco-setup';
import { registerPlaygroundFormatter, runFormatDocument } from '../../lib/playground-format';
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
	const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
	const [isFormatting, setIsFormatting] = useState(false);

	useEffect(() => {
		void loadPlaygroundTypes();
	}, []);

	const handleMount: OnMount = (editor, monaco) => {
		editorRef.current = editor;
		registerPlaygroundFormatter(monaco);
	};

	const handleFormat = async () => {
		if (isFormatting) return;
		setIsFormatting(true);
		try {
			await runFormatDocument(editorRef.current);
		} finally {
			setIsFormatting(false);
		}
	};

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex shrink-0 items-center border-fd-border border-b bg-fd-background px-2 py-1.5 sm:px-3">
				<Button
					appearance="ghost"
					isPending={isFormatting}
					onPress={() => void handleFormat()}
					size="small"
				>
					Format
				</Button>
			</div>
			<div className="min-h-0 flex-1">
				<Editor
					height="100%"
					defaultLanguage="typescript"
					defaultValue={defaultValue}
					loading={<EditorSkeleton code={defaultValue} showPill={showLoadingPill} />}
					onChange={(value) => onChange(value ?? '')}
					onMount={handleMount}
					options={{
						automaticLayout: true,
						fixedOverflowWidgets: true,
						folding: false,
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
			</div>
		</div>
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
