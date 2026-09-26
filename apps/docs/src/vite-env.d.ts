interface ImportMetaEnv {
	/**
	 * `'true'` when the docs app was built with `DOCS_STATIC=true` (prerendered
	 * static host). `'false'` for the default Netlify SSR build.
	 */
	readonly DOCS_STATIC: 'true' | 'false';
	/** Set from the `SITE_URL` build-time variable in `vite.config.ts`. */
	readonly SITE_URL: string;
}
