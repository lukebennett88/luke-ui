import { repository } from '../../package.json';

/** npm records a repository as `git+<url>.git`, which is not browsable. */
const GIT_URL_DECORATION_PATTERN = /^git\+|\.git$/g;

/** Root URL of the repository this site documents, taken from the app manifest. */
export const GITHUB_REPO_URL = repository.url.replace(GIT_URL_DECORATION_PATTERN, '');
