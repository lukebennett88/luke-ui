import type { ComponentPropsWithoutRef, FC } from 'react';
import { reorderProps } from './story-utils.js';
import { defineStory } from './story.js';

export function defineComponentStory<C extends FC<any>>(
	url: string,
	options: {
		initial?: Partial<ComponentPropsWithoutRef<C>>;
		priorities: Array<string>;
	},
) {
	return defineStory<C>(url, {
		args: {
			initial: options.initial as ComponentPropsWithoutRef<C>,
			controls: { transform: reorderProps(options.priorities) },
		},
	});
}
