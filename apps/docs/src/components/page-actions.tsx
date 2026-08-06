import type { IconName } from '@luke-ui/react/icon';
import { Icon } from '@luke-ui/react/icon';
import { cx } from '@luke-ui/react/utils';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import type { ReactNode } from 'react';
import { Link } from 'react-aria-components/Link';
import { GithubMark } from './github-mark.js';
import { ReactAriaMark } from './react-aria-mark.js';
import { StorybookMark } from './storybook-mark.js';

interface PageActionsProps {
	githubUrl: string;
	markdownUrl: string;
	reactAriaUrl: string | null;
	sourceUrl: string | null;
	storybookUrl: string | null;
}

const pillClassName = cx(buttonVariants({ color: 'secondary', size: 'sm' }), 'gap-1.5');

/**
 * Every destination a page can offer sits inline, directly under the page
 * title, as a row of pill links — each a brand mark plus a visible text
 * label. This mirrors HeroUI's component page chrome
 * (heroui.com/docs/components/button), rather than collapsing the actions
 * behind a "View options" trigger: a six-item row reads fine unwrapped, and
 * `flex-wrap` keeps it usable once there is no room for all six on one
 * line.
 *
 * This deliberately does not adopt Fumadocs' own `ViewOptionsPopover`
 * export, because it bakes in third-party AI-assistant deep links (ChatGPT,
 * Claude, Cursor, Scira) this repo does not want to surface, and has no
 * notion of a Storybook, React Aria, or component-source destination.
 */
export function PageActions({
	githubUrl,
	markdownUrl,
	reactAriaUrl,
	sourceUrl,
	storybookUrl,
}: PageActionsProps) {
	return (
		<div className="not-prose flex w-full flex-wrap items-center gap-2">
			{storybookUrl ? (
				<PageActionLink
					href={storybookUrl}
					icon={<StorybookMark className="size-4 shrink-0" />}
					label="Storybook"
				/>
			) : null}
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
			<CopyMarkdownButton markdownUrl={markdownUrl} />
			<PageActionLink href={markdownUrl} iconName="codeBlock" label="View as Markdown" />
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
		<Link className={pillClassName} href={href} rel="noreferrer noopener" target="_blank">
			{icon ?? (iconName ? <Icon aria-hidden className="size-4 shrink-0" name={iconName} /> : null)}
			{label}
		</Link>
	);
}

function CopyMarkdownButton({ markdownUrl }: { markdownUrl: string }) {
	// `useCopyButton` only flips to its "Copied" state once this callback's
	// promise resolves — it has no `onRejected` handler — so a rejection
	// leaves `copied` at `false` instead of lying about success. `fetch`
	// itself does not reject on an HTTP error response (a 404 resolves
	// normally with `res.ok === false`), so a non-ok response is thrown here
	// to convert it into a rejection. Without that throw, a stale route or a
	// missing generated `.md` file would copy an error page's HTML to the
	// clipboard while the button still claimed success.
	const [copied, onCopy] = useCopyButton(async () => {
		const res = await fetch(markdownUrl);
		if (!res.ok) throw new Error(`Failed to fetch ${markdownUrl}: ${res.status}`);
		const text = await res.text();
		await navigator.clipboard.writeText(text);
	});

	return (
		<button className={pillClassName} onClick={onCopy} type="button">
			<Icon aria-hidden className="size-4 shrink-0" name={copied ? 'check' : 'copy'} />
			{copied ? 'Copied' : 'Copy Markdown'}
		</button>
	);
}
