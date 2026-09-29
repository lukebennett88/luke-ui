import {
	DEFAULT_SETTINGS,
	settingsSchema,
	profileUpdateSchema,
	preferencesSchema,
	interfaceSchema,
} from './schemas.js';
import type { InterfaceSettings, Preferences, ProfileUpdate, Settings } from './schemas.js';

const STORAGE_KEY = 'reference-app.settings.v1';

export type ApiFailure = 'none' | 'validation' | 'server';

type ApiControls = {
	failure: ApiFailure;
	latencyMs: number;
};

const controls: ApiControls = {
	failure: 'none',
	latencyMs: 280,
};

function readRaw(): Settings {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return structuredClone(DEFAULT_SETTINGS);
		const parsed = settingsSchema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : structuredClone(DEFAULT_SETTINGS);
	} catch {
		return structuredClone(DEFAULT_SETTINGS);
	}
}

function writeRaw(settings: Settings) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

async function wait() {
	if (controls.latencyMs <= 0) return;
	await new Promise((resolve) => setTimeout(resolve, controls.latencyMs));
}

function consumeFailure(): ApiFailure {
	const next = controls.failure;
	controls.failure = 'none';
	return next;
}

export const settingsApi = {
	/** Deterministic failure for the next mutating call. Auto-resets after use. */
	setNextFailure(failure: ApiFailure) {
		controls.failure = failure;
	},
	setLatency(ms: number) {
		controls.latencyMs = ms;
	},
	reset() {
		localStorage.removeItem(STORAGE_KEY);
		controls.failure = 'none';
		controls.latencyMs = 280;
	},
	async getSettings(): Promise<Settings> {
		await wait();
		return readRaw();
	},
	async updateProfile(update: ProfileUpdate): Promise<Settings> {
		await wait();
		const failure = consumeFailure();
		if (failure === 'server') {
			throw new Error('Could not save profile. Try again.');
		}
		const parsed = profileUpdateSchema.safeParse(update);
		if (!parsed.success || failure === 'validation') {
			throw new Response(JSON.stringify({ formError: 'Check the highlighted fields.' }), {
				status: 400,
				statusText: 'Validation failed',
			});
		}
		if (parsed.data.username === 'taken') {
			throw new Response(JSON.stringify({ fieldErrors: { username: 'Username is taken' } }), {
				status: 400,
				statusText: 'Validation failed',
			});
		}
		const current = readRaw();
		const next = {
			...current,
			profile: { ...current.profile, ...parsed.data },
		};
		writeRaw(next);
		return next;
	},
	async updatePreferences(patch: Partial<Preferences>): Promise<Settings> {
		await wait();
		const failure = consumeFailure();
		if (failure === 'server') {
			throw new Error('Could not save preferences.');
		}
		const current = readRaw();
		const merged = { ...current.preferences, ...patch };
		const parsed = preferencesSchema.safeParse(merged);
		if (!parsed.success || failure === 'validation') {
			throw new Response(JSON.stringify({ formError: 'Invalid preference.' }), {
				status: 400,
			});
		}
		const next = { ...current, preferences: parsed.data };
		writeRaw(next);
		return next;
	},
	async updateInterface(patch: Partial<InterfaceSettings>): Promise<Settings> {
		await wait();
		const failure = consumeFailure();
		if (failure === 'server') {
			throw new Error('Could not save interface settings.');
		}
		const current = readRaw();
		const merged = { ...current.interface, ...patch };
		const parsed = interfaceSchema.safeParse(merged);
		if (!parsed.success || failure === 'validation') {
			throw new Response(JSON.stringify({ formError: 'Invalid interface setting.' }), {
				status: 400,
			});
		}
		const next = { ...current, interface: parsed.data };
		writeRaw(next);
		return next;
	},
	async deleteAccount(): Promise<void> {
		await wait();
		const failure = consumeFailure();
		if (failure === 'server') {
			throw new Error('Account deletion failed. Try again.');
		}
		localStorage.removeItem(STORAGE_KEY);
	},
};

/** Apply interface tokens that affect the live document. */
export function applyInterfaceSettings(settings: InterfaceSettings) {
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
