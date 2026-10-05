import { visuallyHiddenRecipe } from '@luke-ui/react/visually-hidden';

export default function Example() {
	return (
		<button type="button">
			<span aria-hidden>★</span>
			<span className={visuallyHiddenRecipe()}>Add to favourites</span>
		</button>
	);
}
