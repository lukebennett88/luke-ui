import type { Story } from '@fumadocs/story';
import { createStoryClient } from '@fumadocs/story/client';
import { IconSpritesheetProvider } from '@luke-ui/react/icon';
import spriteSheetHref from '@luke-ui/react/spritesheet.svg?url&no-inline';
import { vars } from '@luke-ui/react/theme';
import type { ComponentPropsWithoutRef, FC, ReactNode } from 'react';
import { createElement } from 'react';

type StoryWrapperProps = { children: ReactNode };

function StoryWrapper({ children }: StoryWrapperProps) {
	return (
		<div
			style={{
				alignItems: 'center',
				backgroundColor: vars.backgroundColor.default,
				color: vars.foregroundColor.primary,
				display: 'flex',
				justifyContent: 'center',
				minBlockSize: '6rem',
				padding: '2rem',
			}}
		>
			<IconSpritesheetProvider href={spriteSheetHref}>{children}</IconSpritesheetProvider>
		</div>
	);
}

type StoryComponent<StoryType extends Story> =
	StoryType extends Story<infer Component extends FC<any>> ? Component : never;

export function createWrappedStoryClient<StoryType extends Story>(
	Component: StoryComponent<StoryType>,
) {
	type Component = StoryComponent<StoryType>;
	type Props = ComponentPropsWithoutRef<Component>;

	return createStoryClient<StoryType>({
		Component: ((props: Props) => (
			<StoryWrapper>{createElement(Component as FC<Props>, props)}</StoryWrapper>
		)) as Component,
	});
}
