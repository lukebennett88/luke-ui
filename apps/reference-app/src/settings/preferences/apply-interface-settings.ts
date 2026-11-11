import type { Preferences } from './schema.js';

export function applyInterfaceSettings(settings: Preferences) {
	const root = document.documentElement;
	if (settings.colorMode === 'system') {
		delete root.dataset.colorMode;
	} else {
		root.dataset.colorMode = settings.colorMode;
	}
	root.dataset.fontSize = settings.fontSize;
	root.dataset.pointerCursor = settings.pointerCursor ? 'true' : 'false';
	root.dataset.underlineLinks = settings.underlineLinks ? 'true' : 'false';
}
