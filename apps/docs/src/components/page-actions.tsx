import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { CheckIcon, CopyIcon, ExternalLinkIcon, PencilIcon } from 'lucide-react';
import { useState } from 'react';

interface PageActionsProps {
	markdownUrl: string;
	githubUrl: string;
}

export function PageActions({ markdownUrl, githubUrl }: PageActionsProps) {
	return (
		<div className="not-prose flex flex-row items-center gap-2 border-fd-border border-b pt-2 pb-6">
			<CopyMarkdownButton markdownUrl={markdownUrl} />
			<a
				className={buttonVariants({ size: 'sm', variant: 'secondary' })}
				href={markdownUrl}
				rel="noreferrer"
				target="_blank"
			>
				<ExternalLinkIcon className="size-4" />
				View as Markdown
			</a>
			<a
				className={buttonVariants({ size: 'sm', variant: 'secondary' })}
				href={githubUrl}
				rel="noreferrer"
				target="_blank"
			>
				<PencilIcon className="size-4" />
				Edit on GitHub
			</a>
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
		<button
			className={buttonVariants({ size: 'sm', variant: 'secondary' })}
			onClick={onCopy}
			type="button"
		>
			{copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
			{copied ? 'Copied' : 'Copy Markdown'}
		</button>
	);
}
