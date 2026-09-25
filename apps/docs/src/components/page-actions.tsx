import { Button } from '@luke-ui/react/button';
import type { IconName } from '@luke-ui/react/icon';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import type { ReactNode } from 'react';
import { useCopyButton } from '../lib/use-copy-button.js';
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
	const showMarkdownActions = mode === 'all';

	return (
		<div className="not-prose flex w-full flex-wrap items-center gap-2">
			{reactAriaUrl ? (
				<PageActionLink
					href={reactAriaUrl}
					icon={<ReactAriaMark className="size-4 shrink-0" />}
					label="React Aria"
				/>
			) : null}
			{sourceUrl ? (
				<PageActionLink
					href={sourceUrl}
					icon={<GithubMark className="size-4 shrink-0" />}
					label="Source"
				/>
			) : null}
			{showMarkdownActions ? <CopyMarkdownButton markdownUrl={markdownUrl} /> : null}
			{showMarkdownActions ? (
				<PageActionLink href={markdownUrl} iconName="codeBlock" label="View as Markdown" />
			) : null}
			<PageActionLink
				href={githubUrl}
				icon={<GithubMark className="size-4 shrink-0" />}
				label="Edit on GitHub"
			/>
		</div>
	);
}

function PageActionLink({
	href,
	icon,
	iconName,
	label,
}: {
	href: string;
	icon?: ReactNode;
	iconName?: IconName;
	label: string;
}) {
	return (
		<Link
			appearance="button"
			prominence="low"
			href={href}
			rel="noreferrer noopener"
			size="small"
			startContent={icon ?? (iconName ? <Icon name={iconName} /> : null)}
			target="_blank"
		>
			{label}
		</Link>
	);
}

function CopyMarkdownButton({ markdownUrl }: { markdownUrl: string }) {
	// `useCopyButton` only flips to its "Copied" state once this callback's
	// promise resolves, and it has no `onRejected` handler, so a rejection
	// leaves `copied` at `false` instead of claiming success. `fetch` does not
	// reject on an HTTP error (a 404 resolves with `res.ok === false`), so a
	// non-ok response is thrown here to turn it into one. Without the throw, a
	// stale route or a missing generated `.md` file would copy an error page's
	// HTML to the clipboard while the button reported success.
	const [copied, onCopy] = useCopyButton(async () => {
		const res = await fetch(markdownUrl);
		if (!res.ok) throw new Error(`Failed to fetch ${markdownUrl}: ${res.status}`);
		const text = await res.text();
		await navigator.clipboard.writeText(text);
	});

	return (
		<Button
			onPress={onCopy}
			tone="neutral"
			prominence="low"
			size="small"
			startContent={<Icon name={copied ? 'check' : 'copy'} />}
		>
			{copied ? 'Copied' : 'Copy Markdown'}
		</Button>
	);
}
