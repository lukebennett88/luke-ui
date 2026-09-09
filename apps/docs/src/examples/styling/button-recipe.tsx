import { buttonRecipe } from '@luke-ui/react/button';

export default () => {
	return (
		<a className={buttonRecipe({ appearance: 'button', prominence: 'standard' })} href="#settings">
			Settings
		</a>
	);
};
