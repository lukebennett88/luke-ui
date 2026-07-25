import type { IconName } from '@luke-ui/react/icon';
import { Icon } from '@luke-ui/react/icon';
import { cx } from '@luke-ui/react/utils';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from 'fumadocs-ui/components/ui/popover';
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button';
import { Link } from 'react-aria-components/Link';

interface PageActionsProps {
	githubUrl: string;
	markdownUrl: string;
	storybookUrl: string | null;
}

const rowClassName = cx(
	'flex w-full items-center gap-2 rounded-lg p-2 text-start text-sm text-fd-popover-foreground',
	'hover:bg-fd-accent hover:text-fd-accent-foreground',
	'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-ring',
);

/**
 * Copy Markdown, View as Markdown, and Edit on GitHub are utilities most
 * visits never touch, so they collapse into a single compact "view options"
 * control instead of sitting on the page as a row of filled pill buttons
 * above the first paragraph. This reuses Fumadocs' own popover primitives
 * (`fumadocs-ui/components/ui/popover`) — the same "house pattern" behind
 * its `ViewOptionsPopover` — rather than adopting that export directly,
 * because `ViewOptionsPopover` bakes in third-party AI-assistant deep links
 * (ChatGPT, Claude, Cursor, Scira) this repo does not want to surface, and
 * has no notion of a Storybook destination.
 */
export function PageActions({ markdownUrl, githubUrl, storybookUrl }: PageActionsProps) {
	return (
		<Popover>
			<PopoverTrigger
				className={cx(
					buttonVariants({ color: 'secondary', size: 'sm' }),
					'not-prose ms-auto shrink-0 gap-1.5',
					'data-[state=open]:bg-fd-accent data-[state=open]:text-fd-accent-foreground',
				)}
			>
				View options
				<Icon aria-hidden className="size-3.5" name="chevronDown" />
			</PopoverTrigger>
			<PopoverContent align="end" className="flex flex-col gap-1">
				<CopyMarkdownRow markdownUrl={markdownUrl} />
				<PageActionLink href={markdownUrl} iconName="codeBlock" label="View as Markdown" />
				{storybookUrl ? (
					<PageActionLink href={storybookUrl} iconName="bookOpen" label="View in Storybook" />
				) : null}
				<PageActionLink href={githubUrl} iconName="edit" label="Edit on GitHub" />
			</PopoverContent>
		</Popover>
	);
}

function PageActionLink({
	href,
	iconName,
	label,
}: {
	href: string;
	iconName: IconName;
	label: string;
}) {
	return (
		<Link className={rowClassName} href={href} rel="noreferrer noopener" target="_blank">
			<Icon aria-hidden className="size-4 shrink-0" name={iconName} />
			{label}
			<Icon
				aria-hidden
				className="ms-auto size-3.5 shrink-0 text-fd-muted-foreground"
				name="externalLink"
			/>
		</Link>
	);
}

function CopyMarkdownRow({ markdownUrl }: { markdownUrl: string }) {
	// Deliberately no try/catch here. `useCopyButton` only flips to its
	// "Copied" state once this callback's promise resolves — it has no
	// `onRejected` handler — so a fetch failure or a denied clipboard
	// permission already leaves `copied` at `false` instead of lying about
	// success. Swallowing the error here would remove that protection.
	const [copied, onCopy] = useCopyButton(async () => {
		const res = await fetch(markdownUrl);
		const text = await res.text();
		await navigator.clipboard.writeText(text);
	});

	return (
		<button className={rowClassName} onClick={onCopy} type="button">
			<Icon aria-hidden className="size-4 shrink-0" name={copied ? 'check' : 'copy'} />
			{copied ? 'Copied' : 'Copy Markdown'}
		</button>
	);
}
