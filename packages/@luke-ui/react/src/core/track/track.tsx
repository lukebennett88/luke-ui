import type { HTMLAttributes, JSX, ReactNode, Ref } from 'react';
import { Box } from '../box/box.js';
import type { RequiredInitialResponsive } from '../styles/responsive.js';
import type { SprinklesProps } from '../styles/utilities.css.js';
import type { Prettify } from '../types/prettify.js';
import type { TrackRecipeVariants } from './recipe.css.js';
import { trackRecipe } from './recipe.css.js';

type TrackElementType = 'div' | 'li' | 'span';

type TrackWrapperElementType = 'div' | 'span';

interface _TrackProps extends HTMLAttributes<HTMLElement> {
	/** Content that uses the remaining inline space. */
	children?: ReactNode;
	/**
	 * Root element.
	 *
	 * Use `li` as a direct child of `ul` or `ol`. Use `span` when Track needs to remain inside phrasing
	 * content.
	 * @default div
	 */
	elementType?: TrackElementType;
	/** Space between each rendered rail and `children`. */
	gap?: RequiredInitialResponsive<SprinklesProps['gap']>;
	/**
	 * Cross-axis alignment of the rails.
	 *
	 * `firstLine` centres each rail on the cap height of the first line of `children`, so a rail
	 * taller than the line makes the row taller. The cap height comes from Track's inherited font, so
	 * to align with a different type style, put that style on an element around Track, such as a
	 * `Heading` around a `span` Track.
	 * @default start
	 */
	railAlignment?: NonNullable<TrackRecipeVariants>['railAlignment'];
	/** Content shown after `children` that keeps its intrinsic inline size. */
	railEnd?: ReactNode;
	/** Content shown before `children` that keeps its intrinsic inline size. */
	railStart?: ReactNode;
	/** Ref to the rendered element. */
	ref?: Ref<HTMLElement>;
}

/** Props for `Track`. */
export type TrackProps = Prettify<_TrackProps>;

/**
 * Aligns optional rails with flexible content on the inline axis.
 *
 * With `railAlignment="firstLine"`, the typography element goes around Track, not inside it, for
 * example `<Heading level={2}><Track elementType="span" …>Title</Track></Heading>`.
 */
export function Track(props: TrackProps): JSX.Element {
	const {
		children,
		className,
		elementType: Element = 'div',
		gap,
		railAlignment = 'start',
		railEnd,
		railStart,
		ref,
		...elementProps
	} = props;

	const WrapperElement: TrackWrapperElementType = Element === 'span' ? 'span' : 'div';
	const { centre, rail, railContent, root } = trackRecipe({
		isInline: Element === 'span',
		railAlignment,
	});

	const isFirstLine = railAlignment === 'firstLine';
	const renderRail = (content: ReactNode) => (
		<WrapperElement className={rail()}>
			{isFirstLine ? <WrapperElement className={railContent()}>{content}</WrapperElement> : content}
		</WrapperElement>
	);

	return (
		<Box
			{...elementProps}
			className={root({ className })}
			elementType={Element}
			gap={gap}
			ref={ref}
		>
			{railStart != null && renderRail(railStart)}
			<WrapperElement className={centre()}>{children}</WrapperElement>
			{railEnd != null && renderRail(railEnd)}
		</Box>
	);
}
