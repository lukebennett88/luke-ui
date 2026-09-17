import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<p>
			Example paragraph with an inline
			<Track elementType="span" gap="sp4" railStart={<Icon name="checkCircle" />}>
				status
			</Track>
			marker in the middle of the sentence.
		</p>
	);
};
