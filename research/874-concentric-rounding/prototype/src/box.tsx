import type { CSSProperties, JSX, ReactNode } from 'react';

type Sprinkles = (props: Record<string, unknown>) => {
	className: string;
	style: Record<string, string>;
} & Record<string, unknown>;

export type BoxProps = {
	children?: ReactNode;
	className?: string;
	style?: CSSProperties;
} & Record<string, unknown>;

export type BoxComponent = (props: BoxProps) => JSX.Element;

/** Production Box without `useRender`: utility props in, one class per prop and condition out. */
export function createBox(createSprinkles: Sprinkles): BoxComponent {
	return function Box({ children, className, style, ...props }) {
		const resolved = createSprinkles(props);
		return (
			<div
				{...resolved}
				className={[resolved.className, className].filter(Boolean).join(' ')}
				style={{ ...resolved.style, ...style }}
			>
				{children}
			</div>
		);
	};
}
