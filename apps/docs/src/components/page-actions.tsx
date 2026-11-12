import { Box } from '@luke-ui/react/box';
import { Button } from '@luke-ui/react/button';
import { Cluster } from '@luke-ui/react/cluster';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { vars } from '@luke-ui/react/theme';
import { VisuallyHidden } from '@luke-ui/react/visually-hidden';
import type { ReactNode } from 'react';
import { useCopyButton } from '../lib/use-copy-button.js';
import { CodeBlockIcon } from './docs-icons.js';
import { GithubMark } from './github-mark.js';
import { ReactAriaMark } from './react-aria-mark.js';

export type PageActionsMode = 'all' | 'edit';

interface PageActionsProps {
	githubUrl: string;
	markdownUrl: string;
	mode?: PageActionsMode;
	reactAriaUrl: string | null;
	sourceUrl: string | null;
}

// ViewOptionsPopover adds unwanted AI links and cannot show React Aria or source links.
export function PageActions({
	githubUrl,
	markdownUrl,
	mode = 'all',
	reactAriaUrl,
	sourceUrl,
}: PageActionsProps) {
	const showAllActions = mode === 'all';

	return (
		<Cluster gap="space.8" inlineSize="100%">
			{showAllActions && reactAriaUrl ? (
				<PageActionLink
					href={reactAriaUrl}
					icon={
						<Box
							flexShrink="0"
							renderRoot={({ className, style }) => (
								<ReactAriaMark className={className} style={style} />
							)}
							style={{ blockSize: vars.space['16'], inlineSize: vars.space['16'] }}
						/>
					}
					label="React Aria"
				/>
			) : null}
			{showAllActions && sourceUrl ? (
				<PageActionLink href={sourceUrl} icon={<GithubMark />} label="Source" />
			) : null}
			{showAllActions ? <CopyMarkdownButton markdownUrl={markdownUrl} /> : null}
			{showAllActions ? (
				<PageActionLink href={markdownUrl} icon={<CodeBlockIcon />} label="View as Markdown" />
			) : null}
			<PageActionLink href={githubUrl} icon={<GithubMark />} label="Edit on GitHub" />
		</Cluster>
	);
}

function PageActionLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
	return (
		<Link
			appearance="button"
			href={href}
			rel="noreferrer noopener"
			size="small"
			startContent={icon}
			target="_blank"
		>
			{label}
		</Link>
	);
}

function CopyMarkdownButton({ markdownUrl }: { markdownUrl: string }) {
	const [status, onCopy] = useCopyButton(async () => {
		const res = await fetch(markdownUrl);
		if (!res.ok) throw new Error(`Failed to fetch ${markdownUrl}: ${res.status}`);
		const text = await res.text();
		await navigator.clipboard.writeText(text);
	});

	const label = { idle: 'Copy Markdown', copied: 'Copied', error: 'Could not copy Markdown' }[
		status
	];

	return (
		<>
			<Button
				onPress={onCopy}
				size="small"
				startContent={<Icon name={status === 'copied' ? 'check' : 'copy'} />}
				tone="neutral"
			>
				{label}
			</Button>
			<VisuallyHidden aria-live="polite" role="status">
				{status === 'idle' ? '' : label}
			</VisuallyHidden>
		</>
	);
}
