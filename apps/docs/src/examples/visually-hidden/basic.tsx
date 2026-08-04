import { VisuallyHidden } from '@luke-ui/react/visually-hidden';

export default () => {
	return (
		<p>
			<span aria-hidden="true">★★★★☆</span>
			<VisuallyHidden> Rated 4 out of 5 stars</VisuallyHidden>
		</p>
	);
};
