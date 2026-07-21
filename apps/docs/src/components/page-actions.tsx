import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Link } from '@luke-ui/react/link';
import { cx } from '@luke-ui/react/utils';
import { useState } from 'react';
import { css } from '../../styled-system/css';

interface PageActionsProps {
	githubUrl: string;
	markdownUrl: string;
	storybookUrl: string | null;
}

export function PageActions({ markdownUrl, githubUrl, storybookUrl }: PageActionsProps) {
	return (
		<div className={cx('not-prose', pageActionStyles.root)}>
			<CopyMarkdownButton markdownUrl={markdownUrl} />
			{storybookUrl ? (
				<Link href={storybookUrl} isStandalone rel="noreferrer" target="_blank">
					<Icon aria-hidden name="bookOpen" />
					View in Storybook
				</Link>
			) : null}
			<Link href={markdownUrl} isStandalone rel="noreferrer" target="_blank">
				<Icon aria-hidden name="externalLink" />
				View as Markdown
			</Link>
			<Link href={githubUrl} isStandalone rel="noreferrer" target="_blank">
				<Icon aria-hidden name="edit" />
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
		<Button onClick={onCopy} size="small" type="button">
			<Icon aria-hidden name={copied ? 'check' : 'copy'} />
			{copied ? 'Copied' : 'Copy Markdown'}
		</Button>
	);
}

const pageActionStyles = {
	root: css({
		alignItems: 'center',
		borderBlockEndColor: 'var(--luke-color-border-decorative)',
		borderBlockEndStyle: 'solid',
		borderBlockEndWidth: '1px',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 'var(--luke-space-200)',
		paddingBlockEnd: 'var(--luke-space-600)',
		paddingBlockStart: 'var(--luke-space-200)',
	}),
};
