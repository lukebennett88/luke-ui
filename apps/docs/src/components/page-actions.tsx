import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { useState } from 'react';

interface PageActionsProps {
	githubUrl: string;
	markdownUrl: string;
	storybookUrl: string | null;
}

export function PageActions({ markdownUrl, githubUrl, storybookUrl }: PageActionsProps) {
	return (
		<div className="not-prose flex flex-row items-center gap-2 border-fd-border border-b pt-2 pb-6">
			<CopyMarkdownButton markdownUrl={markdownUrl} />
			{storybookUrl ? (
				<Link
					className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm"
					href={storybookUrl}
					target="_blank"
				>
					<Icon aria-hidden className="size-4" name="bookOpen" />
					View in Storybook
				</Link>
			) : null}
			<Link
				className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm"
				href={markdownUrl}
				target="_blank"
			>
				<Icon aria-hidden className="size-4" name="externalLink" />
				View as Markdown
			</Link>
			<Link
				className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm"
				href={githubUrl}
				target="_blank"
			>
				<Icon aria-hidden className="size-4" name="edit" />
				Edit on GitHub
			</Link>
		</div>
	);
}

function CopyMarkdownButton({ markdownUrl }: { markdownUrl: string }) {
	const [copied, setCopied] = useState(false);

	const onCopy = async () => {
		try {
			const res = await fetch(markdownUrl);
			const text = await res.text();
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			// swallow — clipboard or fetch can fail in restrictive contexts
		}
	};

	return (
		<Button appearance="subtle" onPress={onCopy} size="small">
			<Icon aria-hidden className="size-4" name={copied ? 'check' : 'copy'} />
			{copied ? 'Copied' : 'Copy Markdown'}
		</Button>
	);
}
