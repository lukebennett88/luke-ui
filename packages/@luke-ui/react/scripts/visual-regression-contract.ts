export const VISUAL_LOCKFILE = 'pnpm-lock.yaml';

/** Files that shape how a capture renders. Hashed into the cache key and copied into the base worktree. */
export const VISUAL_HARNESS_FILES = [
	'packages/@luke-ui/react/vitest.config.ts',
	'packages/@luke-ui/react/src/test-utils/render-setup.ts',
	'packages/@luke-ui/react/src/test-utils/render.tsx',
	'packages/@luke-ui/react/src/test-utils/visual-setup.ts',
] as const;

export const VISUAL_CACHE_HASH_FILES = [VISUAL_LOCKFILE, ...VISUAL_HARNESS_FILES];
