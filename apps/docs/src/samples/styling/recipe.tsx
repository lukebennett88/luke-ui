import { button } from '@luke-ui/react/recipes';

export function SaveButton() {
	return (
		<button
			className={button({ appearance: 'solid', size: 'medium', tone: 'accent' })}
			type="button"
		>
			Save changes
		</button>
	);
}
