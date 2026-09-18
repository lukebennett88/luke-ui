import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<p>
			This sentence includes an inline{' '}
			<Track elementType="span" gap="sp4" railStart={<Icon name="checkCircle" />}>
				status
			</Track>.
		</p>
	);
};
