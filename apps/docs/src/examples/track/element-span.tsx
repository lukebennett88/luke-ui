import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<p>
			Example text with{' '}
			<Track elementType="span" gap="sp4" railStart={<Icon name="checkCircle" />}>
				inline content
			</Track>{' '}
			in the middle.
		</p>
	);
};
