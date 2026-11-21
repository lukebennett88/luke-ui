import { useSyncExternalStore } from 'react';
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
/** The record last read, kept while storage holds the same entries so each read is stable. */
let cache: SeenRecord = EMPTY;
/** Entries storage refused to keep, which then last until the page reloads. */
const unsaved = new Map<string, string | undefined>();

/**
 * The reviewer's viewed captures in this browser. Each is stored with its fingerprint, so a capture
 * whose images change in a later commit reads as `changed` rather than `seen`.
 */
export function useSeen(): {
	restoreSeen: (entries: SeenEntries) => void;
	setSeen: (captures: ReadonlyArray<Capture>, isSeen: boolean) => void;
	stateOf: (capture: Capture) => SeenState;
	storedFor: (captures: ReadonlyArray<Capture>) => SeenEntries;
} {
	const record = useSyncExternalStore(subscribe, readSeen);
	return {
		restoreSeen: writeEntries,
		setSeen,
		stateOf: (capture) => seenState(record, capture),
		storedFor: (captures) =>
			Object.fromEntries(captures.map((capture) => [capture.id, record[capture.id]])),
	};
}

/** What a capture's stored fingerprint says about it. */
export function seenState(record: SeenRecord, capture: Capture): SeenState {
	const stored = record[capture.id];
	if (stored === undefined) return 'unseen';
	return stored === captureFingerprint(capture) ? 'seen' : 'changed';
}

/**
 * The published fingerprint of a capture's images. A report without one, such as a local
 * comparison or one published before fingerprints, falls back to the capture's size and differing
 * pixel count, which change with most edits.
 */
export function captureFingerprint(capture: Capture): string {
	if (capture.fingerprint) return capture.fingerprint;
	const { height, id, mismatchedPixels, width } = capture;
	return `${id}:${width ?? ''}x${height ?? ''}:${mismatchedPixels ?? ''}`;
}

function setSeen(captures: ReadonlyArray<Capture>, isSeen: boolean) {
	writeEntries(
		Object.fromEntries(
			captures.map((capture) => [capture.id, isSeen ? captureFingerprint(capture) : undefined]),
		),
	);
}

/** Stores each fingerprint, and removes the entry of each capture without one. */
function writeEntries(entries: SeenEntries) {
	for (const [id, fingerprint] of Object.entries(entries)) {
		try {
			if (fingerprint === undefined) localStorage.removeItem(KEY_PREFIX + id);
			else localStorage.setItem(KEY_PREFIX + id, fingerprint);
			unsaved.delete(id);
		} catch {
			// Storage can be unavailable or full.
			unsaved.set(id, fingerprint);
		}
	}
	notify();
}

function readSeen(): SeenRecord {
	const record = readStorage();
	if (!isSameRecord(record, cache)) cache = record;
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
		// Storage can be unavailable. What this page could not store still counts.
	}
	for (const [id, fingerprint] of unsaved) {
		if (fingerprint === undefined) delete record[id];
		else record[id] = fingerprint;
	}
	return Object.keys(record).length === 0 ? EMPTY : record;
}

function notify() {
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
		if (listeners.size === 0) window.removeEventListener('storage', onStorage);
	};
}
