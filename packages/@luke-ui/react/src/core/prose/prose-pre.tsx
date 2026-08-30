import type { ComponentProps, JSX, ReactNode } from 'react';
import { cx } from '../../shared/utils/utils.js';
import type { Prettify } from '../types/prettify.js';
import { prosePreScrollClassName } from './prose-pre.css.js';

interface _ProsePreProps {
	/** Accessible name for the scroll region. */
	'aria-label': string;
	children: ReactNode;
	className?: string;
	preClassName?: ComponentProps<'pre'>['className'];
}

/** Props for `ProsePre`. */
export type ProsePreProps = Prettify<_ProsePreProps>;

/**
 * Block code sample for use inside `Prose`. Wraps a `<pre>` in a keyboard-focusable scroll region
 * with a valid accessible name. Map Markdown and CMS `<pre><code>` output to this component when
 * lines may overflow horizontally.
 */
export function ProsePre(props: ProsePreProps): JSX.Element {
	const { 'aria-label': ariaLabel, children, className, preClassName } = props;

	return (
		<div
			aria-label={ariaLabel}
			className={cx(prosePreScrollClassName, className)}
			role="region"
			// oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- scroll regions must be keyboard-reachable
			tabIndex={0}
		>
			<pre className={preClassName}>{children}</pre>
		</div>
	);
}
