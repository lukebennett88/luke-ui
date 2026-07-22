import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { button } from '@luke-ui/react/recipes';
import { useState } from 'react';
import { Link } from 'react-aria-components/Link';

interface PageActionsProps {
	githubUrl: string;
	markdownUrl: string;
	storybookUrl: string | null;
}

/**
 * These external actions render as button-shaped pills, not inline text
 * links, so they use the react-aria-components `Link` primitive (the same
 * primitive Luke UI's own components build on) styled with Luke UI's
 * `button()` recipe — not Luke UI's own `<Link>`, which always layers on
 * its `link()` recipe for underlined inline-text styling. The primitive
 * still carries real `data-hovered`/`data-pressed`/`data-focus-visible`
 * states, so hover/press feedback matches the adjacent `<Button>` exactly.
 */
export function PageActions({ markdownUrl, githubUrl, storybookUrl }: PageActionsProps) {
	return (
		<div className="not-prose flex flex-row items-center gap-2 border-fd-border border-b pt-2 pb-6">
			<CopyMarkdownButton markdownUrl={markdownUrl} />
			{storybookUrl ? (
				<Link
					className={button({ appearance: 'subtle', size: 'small' })}
					href={storybookUrl}
					target="_blank"
				>
					<Icon aria-hidden className="size-4" name="bookOpen" />
					View in Storybook
				</Link>
			) : null}
			<Link
				className={button({ appearance: 'subtle', size: 'small' })}
				href={markdownUrl}
				target="_blank"
			>
				<Icon aria-hidden className="size-4" name="externalLink" />
				View as Markdown
			</Link>
			<Link
				className={button({ appearance: 'subtle', size: 'small' })}
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
