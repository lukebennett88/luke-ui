import { createIcon } from '@luke-ui/react/icon';
import type { JSX } from 'react';

const HeartIcon = createIcon({
	path: (
		<path d="M12 21a1 1 0 0 1-.7-.3L5 14.5a5 5 0 1 1 7-6 5 5 0 1 1 7 6l-6.3 6.2a1 1 0 0 1-.7.3Z" />
	),
});

export const meta = {
	title: 'Icon — Custom',
	description: 'Create a one-off icon that is not in the generated spritesheet.',
};

export default function Custom(): JSX.Element {
	return <HeartIcon title="Favorite" size="small" />;
}
