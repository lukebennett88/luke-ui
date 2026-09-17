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

/** Track a rail, the flexible centre, and a rail with a required gap. */
export const Default = meta.story({
	args: {
		children: 'Example item marked complete',
		gap: 'sp8',
		railEnd: <Button size="small">Undo</Button>,
		railStart: <Icon name="checkCircle" />,
	} satisfies Partial<TrackProps>,
});

export const NoRails = meta.story({
	args: {
		children: 'Example item',
		gap: 'sp8',
	} satisfies Partial<TrackProps>,
});

export const FirstLineAlignment = meta.story({
	args: {
		children:
			'Example item with a second line of wrapped content, so the rail sits against the first line only.',
		gap: 'sp8',
		railAlignment: 'firstLine',
		railEnd: <Button size="small">Undo</Button>,
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
			<Track {...props}>First example item</Track>
			<Track {...props}>Second example item</Track>
		</ul>
	),
});
