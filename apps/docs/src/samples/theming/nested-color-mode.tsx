import type { PropsWithChildren } from 'react';

export function DarkPageWithLightPreview({ children }: PropsWithChildren) {
	return (
		<div data-color-mode="dark">
			Dark application
			<section data-color-mode="light">{children}</section>
		</div>
	);
}
