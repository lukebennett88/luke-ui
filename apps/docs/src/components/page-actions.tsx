import { Icon } from '@luke-ui/react/icon';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
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
				<a
					className={buttonVariants({ size: 'sm', variant: 'secondary' })}
					href={storybookUrl}
					rel="noreferrer"
					target="_blank"
				>
					<Icon aria-hidden className="size-4" name="bookOpen" />
					View in Storybook
				</a>
			) : null}
			<a
				className={buttonVariants({ size: 'sm', variant: 'secondary' })}
				href={markdownUrl}
				rel="noreferrer"
				target="_blank"
			>
				<Icon aria-hidden className="size-4" name="externalLink" />
				View as Markdown
			</a>
			<a
				className={buttonVariants({ size: 'sm', variant: 'secondary' })}
				href={githubUrl}
				rel="noreferrer"
				target="_blank"
			>
				<Icon aria-hidden className="size-4" name="edit" />
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
			{copied ? (
				<Icon aria-hidden className="size-4" name="check" />
			) : (
				<Icon aria-hidden className="size-4" name="copy" />
			)}
			{copied ? 'Copied' : 'Copy Markdown'}
		</button>
	);
}
