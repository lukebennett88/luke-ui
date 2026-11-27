import { useMemo, useSyncExternalStore } from 'react';
import { repository } from '../config.js';
import type { Capture } from '../report/schema.js';

/** `changed` means the reviewer viewed the capture, and its images have changed since. */
export type SeenState = 'changed' | 'seen' | 'unseen';

/** Capture id to the fingerprint the reviewer viewed. */
type SeenRecord = Readonly<Record<string, string>>;

/** Capture id to a stored fingerprint, or `undefined` for a capture with none. */
export type SeenEntries = Readonly<Record<string, string | undefined>>;

/**
 * One storage entry per capture, keyed by repository, so a capture viewed in one commit of a pull
 * request stays viewed in the next, and in any other pull request that shows the same images. Tabs
 * that mark different captures write different entries, so neither overwrites the other.
 */
const KEY_PREFIX = `visual-review:seen:${repository}:`;
const EMPTY: SeenRecord = {};
const listeners = new Set<() => void>();
/** The record last read from storage. Every read returns it until storage changes. */
let cache: SeenRecord = EMPTY;
/**
 * Whether storage may have changed since `cache` was read. A write or another tab's change sets it,
 * and so does the last subscriber leaving, since nothing then hears another tab's changes.
 */
let isStale = true;

/**
 * The reviewer's viewed captures in this browser. Each is stored with its fingerprint, so a capture
 * whose images change in a later commit reads as `changed` rather than `seen`.
 */
export function useSeen(): {
	restoreSeen: (entries: SeenEntries) => boolean;
	setSeen: (capture: Capture, isSeen: boolean) => boolean;
	stateOf: (capture: Capture) => SeenState;
	storedFor: (captures: ReadonlyArray<Capture>) => SeenEntries;
} {
	const record = useSyncExternalStore(subscribe, readSeen);
	return useMemo(
		() => ({
			restoreSeen: writeEntries,
			setSeen,
			stateOf: (capture: Capture) => seenState(record, capture),
			storedFor: (captures: ReadonlyArray<Capture>) =>
				Object.fromEntries(captures.map((capture) => [capture.id, record[capture.id]])),
		}),
		[record],
	);
}

/** What a capture's stored fingerprint says about it. */
function seenState(record: SeenRecord, capture: Capture): SeenState {
	const stored = record[capture.id];
	if (stored === undefined || !capture.fingerprint) return 'unseen';
	return stored === capture.fingerprint ? 'seen' : 'changed';
}

function setSeen(capture: Capture, isSeen: boolean): boolean {
	if (!capture.fingerprint) return false;
	return writeEntries({ [capture.id]: isSeen ? capture.fingerprint : undefined });
}

/** Stores each fingerprint, and removes the entry of each capture without one. */
function writeEntries(entries: SeenEntries): boolean {
	let didSave = true;
	for (const [id, fingerprint] of Object.entries(entries)) {
		try {
			if (fingerprint === undefined) localStorage.removeItem(KEY_PREFIX + id);
			else localStorage.setItem(KEY_PREFIX + id, fingerprint);
		} catch {
			didSave = false;
		}
	}
	notify();
	return didSave;
}

/** The snapshot `useSyncExternalStore` reads. Storage is read again only after it may have changed. */
function readSeen(): SeenRecord {
	if (!isStale) return cache;
	const record = readStorage();
	// Rewriting entries with the values they had keeps the same snapshot, so nothing re-renders.
	if (!isSameRecord(record, cache)) cache = record;
	isStale = false;
	return cache;
}

function isSameRecord(a: SeenRecord, b: SeenRecord): boolean {
	const keys = Object.keys(a);
	return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key]);
}

function readStorage(): SeenRecord {
	const record: Record<string, string> = {};
	try {
		for (let index = 0; index < localStorage.length; index++) {
			const key = localStorage.key(index);
			if (!key?.startsWith(KEY_PREFIX)) continue;
			const fingerprint = localStorage.getItem(key);
			if (fingerprint !== null) record[key.slice(KEY_PREFIX.length)] = fingerprint;
		}
	} catch {
		// Storage can be unavailable.
	}
	return Object.keys(record).length === 0 ? EMPTY : record;
}

function notify() {
	isStale = true;
	for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
	// Another tab marked captures viewed, or cleared storage.
	if (event.key !== null && !event.key.startsWith(KEY_PREFIX)) return;
	notify();
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	if (listeners.size === 1) window.addEventListener('storage', onStorage);
	return () => {
		listeners.delete(listener);
		if (listeners.size > 0) return;
		window.removeEventListener('storage', onStorage);
		isStale = true;
	};
}
