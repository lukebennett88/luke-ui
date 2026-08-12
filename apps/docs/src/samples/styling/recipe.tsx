import { buttonRecipe } from '@luke-ui/react/button';

export function SaveButton() {
	return (
		<button
			className={buttonRecipe({ appearance: 'solid', size: 'medium', tone: 'accent' })}
			type="button"
		>
			Save changes
		</button>
	);
}
