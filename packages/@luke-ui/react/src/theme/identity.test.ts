import { describe, expect, it } from 'vite-plus/test';
import { paperFoundation, tactileFoundation } from '../test-utils/compiled-theme.js';
import { paperThemeClassName, tactileThemeClassName } from '../themes/index.js';
import { buildTheme } from './build-theme.js';
import { themeClassName } from './identity.js';

describe('bundled theme identity', () => {
	it('exports class-name constants that match the emitted identity classes', () => {
		expect(tactileThemeClassName).toBe('luke-ui-theme-tactile');
		expect(paperThemeClassName).toBe('luke-ui-theme-paper');
		expect(buildTheme(tactileFoundation)).toContain(`.${tactileThemeClassName} {`);
		expect(buildTheme(paperFoundation)).toContain(`.${paperThemeClassName} {`);
	});

	it('keeps the bundled themes isolated from each other', () => {
		expect(buildTheme(paperFoundation)).not.toContain(tactileThemeClassName);
		expect(buildTheme(tactileFoundation)).not.toContain(paperThemeClassName);
	});

	it('rejects theme names that are not kebab-case', () => {
		expect(() => themeClassName('Tactile')).toThrow(/kebab-case/);
		expect(() => themeClassName('-leading')).toThrow(/kebab-case/);
		expect(() => themeClassName('double--hyphen')).toThrow(/kebab-case/);
		expect(() => themeClassName('9lives')).toThrow(/kebab-case/);
		expect(themeClassName('tactile')).toBe('luke-ui-theme-tactile');
	});
});
