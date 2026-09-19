import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import type { TrackProps } from '@luke-ui/react/track';
import { Track } from '@luke-ui/react/track';
import preview from '../../../.storybook/preview.js';

const meta = preview.meta({
	component: Track,
	tags: ['layout'],
	title: 'Layout/Track',
});

/** Pair a status with an action. */
export const Default = meta.story({
	args: {
		children: 'Changes saved',
		gap: 'sp8',
		railAlignment: 'center',
		railEnd: <Button size="small">Undo</Button>,
		railStart: <Icon name="checkCircle" />,
	} satisfies Partial<TrackProps>,
});

export const NoRails = meta.story({
	args: {
		children: 'Content without rails',
	} satisfies Partial<TrackProps>,
});

export const Inline = meta.story({
	args: {
		children: 'Payment complete',
		elementType: 'span',
		gap: 'sp4',
		railStart: <Icon name="checkCircle" />,
	} satisfies Partial<TrackProps>,
});

export const FirstLineAlignment = meta.story({
	args: {
		children: 'Your password must contain at least 12 characters, one number, and one symbol.',
		gap: 'sp8',
		railAlignment: 'firstLine',
		railStart: <Icon name="checkCircle" />,
	} satisfies Partial<TrackProps>,
});

export const ListItem = meta.story({
	args: {
		elementType: 'li',
		gap: 'sp8',
		railStart: <Icon name="checkCircle" />,
	} satisfies Partial<TrackProps>,
	render: (props) => (
		<ul>
			<Track {...props}>First item</Track>
			<Track {...props}>Second item</Track>
		</ul>
	),
});
