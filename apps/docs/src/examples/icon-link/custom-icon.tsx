import { IconLink } from '@luke-ui/react/icon-link';
import { GithubMark } from '#docs/github-mark';

export default () => {
	return (
		<IconLink
			aria-label="Luke UI on GitHub"
			href="https://github.com/lukebennett88/luke-ui"
			icon={<GithubMark />}
			target="_blank"
		/>
	);
};
