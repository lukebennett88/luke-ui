import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

const sources = import.meta.glob<string>('../samples/*/*.tsx', {
	eager: true,
	import: 'default',
	query: '?raw',
});

export interface SourceCodeBlockProps {
	src: string;
}

export function SourceCodeBlock({ src }: SourceCodeBlockProps) {
	const source = sources[`../samples/${src}.tsx`];
	if (source === undefined) throw new Error(`Source example not found: ${src}`);

	return <DynamicCodeBlock code={source.trim()} lang="tsx" />;
}
