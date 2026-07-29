import * as styles from '../recipes/code.css.js';
import type { DistributiveOmit } from '../types/distributive-omit.js';
import type { Prettify } from '../types/prettify.js';
import { cx } from '../utils/index.js';

type _CodeOmit = DistributiveOmit<React.ComponentProps<'code'>, never>;

interface _CodeProps extends _CodeOmit {}

/**
 * Props for the `Code` component.
 *
 * @tier atom
 */
export type CodeProps = Prettify<_CodeProps>;

/**
 * Marks a short fragment of computer code, rendered as `<code>`.
 */
export function Code(props: CodeProps) {
	const { className, ...elementProps } = props;
	return <code {...elementProps} className={cx(styles.code(), className)} />;
}
