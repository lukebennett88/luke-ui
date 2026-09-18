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

/** Pair completed work with an action. */
export const Default = meta.story({
	args: {
		children: 'Submit expense report',
		gap: 'sp8',
		railEnd: <Button size="small">Undo</Button>,
		railStart: <Icon name="checkCircle" />,
	} satisfies Partial<TrackProps>,
});

export const NoRails = meta.story({
	args: {
		children: 'Invite a teammate to the project',
		gap: 'sp8',
	} satisfies Partial<TrackProps>,
});

export const FirstLineAlignment = meta.story({
	args: {
		children: 'Review the quarterly performance report and share the summary with the team.',
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
			<Track {...props}>Prepare the project brief</Track>
			<Track {...props}>Schedule the stakeholder review</Track>
		</ul>
	),
});
