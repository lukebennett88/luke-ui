import { Button } from '@luke-ui/react/button';
import { Icon } from '@luke-ui/react/icon';
import { Track } from '@luke-ui/react/track';

export default () => {
	return (
		<Track
			gap="sp8"
			railStart={<Icon name="checkCircle" />}
			railEnd={<Button size="small">Undo</Button>}
		>
			Submit expense report
		</Track>
	);
};
