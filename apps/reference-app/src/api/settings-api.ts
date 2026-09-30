import type { Preferences, ProfileUpdate, Settings } from './schemas.js';
import {
	DEFAULT_SETTINGS,
	preferenceUpdateSchema,
	profileUpdateSchema,
	settingsSchema,
} from './schemas.js';

const STORAGE_KEY = 'reference-app.settings.v3';

export type ApiFailure = 'none' | 'validation' | 'server';

export class SettingsMutationError extends Error {
	fieldErrors?: Record<string, string>;

	constructor(message: string, fieldErrors?: Record<string, string>) {
		super(message);
		this.fieldErrors = fieldErrors;
	}
}

type ApiControls = {
	failure: ApiFailure;
	latencyMs: number;
};

const controls: ApiControls = { failure: 'none', latencyMs: 280 };

export const settingsApi = {
	async clearLocalSettings(): Promise<void> {
		const invocation = consumeControls();
		await wait(invocation.latencyMs);
		checkFailure(invocation.failure, 'Could not clear saved settings. Try again.');
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch {
			throw new Error('Could not clear saved settings. Enable browser storage and try again.');
		}
	},
	async getSettings(): Promise<Settings> {
		await wait(controls.latencyMs);
		return readRaw();
	},
	reset() {
		localStorage.removeItem(STORAGE_KEY);
		controls.failure = 'none';
		controls.latencyMs = 280;
	},
	setLatency(ms: number) {
		controls.latencyMs = Math.max(0, ms);
	},
	/** Applies once, to the next mutation. */
	setNextFailure(failure: ApiFailure) {
		controls.failure = failure;
	},
	async updatePreferences(patch: Partial<Preferences>): Promise<Settings> {
		const invocation = consumeControls();
		await wait(invocation.latencyMs);
		checkFailure(invocation.failure, 'Could not save preferences. Try again.');
		const parsed = preferenceUpdateSchema.safeParse(patch);
		if (!parsed.success) {
			throw validationError(
				parsed.error.issues[0]?.message ?? 'Check the preference and try again.',
			);
		}
		const current = readRaw();
		const next = { ...current, preferences: { ...current.preferences, ...parsed.data } };
		writeRaw(next);
		return next;
	},
	async updateProfile(patch: ProfileUpdate): Promise<Settings> {
		const invocation = consumeControls();
		await wait(invocation.latencyMs);
		checkFailure(invocation.failure, 'Could not save profile. Try again.');
		const parsed = profileUpdateSchema.safeParse(patch);
		if (!parsed.success) {
			throw profileValidationError(parsed.error.issues);
		}
		if (parsed.data.username === 'taken') {
			throw new SettingsMutationError('Check the highlighted fields.', {
				username: 'Username is taken',
			});
		}
		const current = readRaw();
		const next = { ...current, profile: { ...current.profile, ...parsed.data } };
		writeRaw(next);
		return next;
	},
};

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

function readRaw(): Settings {
	const raw = (() => {
		try {
			return localStorage.getItem(STORAGE_KEY);
		} catch {
			throw new Error('Could not read saved settings. Enable browser storage and try again.');
		}
	})();
	if (!raw) return structuredClone(DEFAULT_SETTINGS);
	try {
		const parsed = settingsSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : structuredClone(DEFAULT_SETTINGS);
	} catch {
		return structuredClone(DEFAULT_SETTINGS);
	}
}

function writeRaw(settings: Settings) {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch {
		throw new Error('Could not save settings. Check browser storage space and try again.');
	}
}

async function wait(latencyMs: number) {
	if (latencyMs <= 0) return;
	await new Promise((resolve) => setTimeout(resolve, latencyMs));
}

function consumeControls(): ApiControls {
	const invocation = { ...controls };
	controls.failure = 'none';
	return invocation;
}

function checkFailure(failure: ApiFailure, message: string) {
	if (failure === 'server') throw new Error(message);
	if (failure === 'validation') throw validationError(message);
}

function validationError(formError: string) {
	return new SettingsMutationError(formError);
}

function profileValidationError(issues: Array<{ message: string; path: Array<PropertyKey> }>) {
	const fieldErrors: Record<string, string> = {};
	for (const issue of issues) {
		const field = issue.path[0];
		if (typeof field === 'string') fieldErrors[field] ??= issue.message;
	}
	if (Object.keys(fieldErrors).length === 0) {
		return new SettingsMutationError(issues[0]?.message ?? 'Check the highlighted fields.');
	}
	return new SettingsMutationError('Check the highlighted fields.', fieldErrors);
}
