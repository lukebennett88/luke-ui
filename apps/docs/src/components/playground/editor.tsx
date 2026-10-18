import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Stack } from '@luke-ui/react/stack';
import type { OnMount } from '@monaco-editor/react';
import Editor from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { use, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { ensurePlaygroundMonaco, loadPlaygroundTypes, monacoThemes } from '../../lib/monaco-setup';
import { EditorSkeleton } from './editor-skeleton';
import {
	registerFormatDocumentKeybinding,
	registerPlaygroundFormatter,
	runFormatDocument,
} from './monaco-format.js';
import { PlaygroundPaneToolbar } from './pane-toolbar.js';

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
	// Suspends (showing the skeleton) until Monaco's themes and tokenizer exist.
	use(ensurePlaygroundMonaco());
	const theme = useSiteTheme();
	const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
	const [isFormatting, setIsFormatting] = useState(false);

	useEffect(() => {
		void loadPlaygroundTypes();
	}, []);

	const handleMount: OnMount = (editor, monaco) => {
		editorRef.current = editor;
		registerPlaygroundFormatter(monaco);
		registerFormatDocumentKeybinding(editor, monaco);
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
		<Stack blockSize="100%" minBlockSize={0}>
			<PlaygroundPaneToolbar>
				<Button isPending={isFormatting} onPress={() => void handleFormat()} size="small">
					Format
				</Button>
			</PlaygroundPaneToolbar>
			<Box flexBasis="auto" flexGrow="1" flexShrink="1" minBlockSize={0}>
				<Editor
					defaultLanguage="typescript"
					defaultValue={defaultValue}
					height="100%"
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
			</Box>
		</Stack>
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
