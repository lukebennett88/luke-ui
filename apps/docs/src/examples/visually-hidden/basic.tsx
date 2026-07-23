import { VisuallyHidden } from '@luke-ui/react/visually-hidden';

export default function Basic() {
	return (
		<p>
			<span aria-hidden="true">★★★★☆</span>
			<VisuallyHidden> Rated 4 out of 5 stars</VisuallyHidden>
		</p>
	);
}
