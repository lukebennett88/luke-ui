import { createIcon } from '@luke-ui/react/icon';

const HeartIcon = createIcon({
	path: (
		<path d="M12 21a1 1 0 0 1-.7-.3L5 14.5a5 5 0 1 1 7-6 5 5 0 1 1 7 6l-6.3 6.2a1 1 0 0 1-.7.3Z" />
	),
});

export default function Custom() {
	return <HeartIcon size="small" title="Add to favourites" />;
}
