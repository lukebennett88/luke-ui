import type { AnchorHTMLAttributes, MouseEvent } from 'react';
import { navigate } from './location.js';

type StateLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & { href: string };

/**
 * A link to another state of the same view, such as the next capture. A plain click replaces the
 * history entry, so Back leaves the review rather than replaying every capture. Modified clicks
 * keep the browser's behaviour, so a capture still opens in a new tab.
 */
export function StateLink({ children, href, onClick, ...anchorProps }: StateLinkProps) {
	function handleClick(event: MouseEvent<HTMLAnchorElement>) {
		onClick?.(event);
		if (event.defaultPrevented || event.button !== 0) return;
		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		event.preventDefault();
		navigate(href, { replace: true });
	}

	return (
		<a {...anchorProps} href={href} onClick={handleClick}>
			{children}
		</a>
	);
}
