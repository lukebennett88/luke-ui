import { buttonRecipe } from '@luke-ui/react/button';

export default () => {
	return (
		<a {...buttonRecipe({ appearance: 'subtle' })} href="#settings">
			Settings
		</a>
	);
};
