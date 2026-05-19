import type { ComponentPropsWithoutRef, FC } from 'react';
import { reorderProps } from './story-utils.js';
import { defineStory } from './story.js';

export function defineComponentStory<C extends FC<any>>(
	url: string,
	options: {
		initial?: ComponentPropsWithoutRef<C>;
		priorities: Array<string>;
	},
) {
	return defineStory<C>(url, {
		args: {
			initial: options.initial,
			controls: { transform: reorderProps(options.priorities) },
		},
	});
}
