import { useSyncExternalStore } from 'react';
import { repository } from '../config.js';
import type { Capture } from '../report/schema.js';

/** `changed` means the reviewer viewed the capture, and its images have changed since. */
export type SeenState = 'changed' | 'seen' | 'unseen';

/** Capture id to the fingerprint the reviewer viewed. */
type SeenRecord = Readonly<Record<string, string>>;

/**
 * One record per repository, so a capture viewed in one commit of a pull request stays viewed in
 * the next, and in any other pull request that shows the same images.
 */
const STORAGE_KEY = `visual-review:seen:${repository}`;
const EMPTY: SeenRecord = {};
const listeners = new Set<() => void>();
/** The last stored text and what it parsed to, so an unchanged store keeps one snapshot. */
let cache: { raw: string | null; record: SeenRecord } = { raw: null, record: EMPTY };
/** What storage refused to keep. It then lasts until the page reloads. */
let unsaved: SeenRecord | undefined;

/**
 * The reviewer's viewed captures in this browser. Each is stored with its fingerprint, so a capture
 * whose images change in a later commit reads as `changed` rather than `seen`.
 */
export function useSeen(): {
	setSeen: (captures: ReadonlyArray<Capture>, isSeen: boolean) => void;
	stateOf: (capture: Capture) => SeenState;
} {
	const record = useSyncExternalStore(subscribe, readSeen);
	return {
		setSeen,
		stateOf: (capture) => seenState(record, capture),
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
	const next: Record<string, string> = { ...readSeen() };
	for (const capture of captures) {
		if (isSeen) next[capture.id] = captureFingerprint(capture);
		else delete next[capture.id];
	}
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		unsaved = undefined;
	} catch {
		// Storage can be unavailable or full.
		unsaved = next;
	}
	notify();
}

function readSeen(): SeenRecord {
	if (unsaved) return unsaved;
	let raw: string | null;
	try {
		raw = localStorage.getItem(STORAGE_KEY);
	} catch {
		return EMPTY;
	}
	if (raw === cache.raw) return cache.record;
	cache = { raw, record: parseRecord(raw) };
	return cache.record;
}

function parseRecord(raw: string | null): SeenRecord {
	if (raw === null) return EMPTY;
	try {
		const value: unknown = JSON.parse(raw);
		if (typeof value !== 'object' || value === null || Array.isArray(value)) return EMPTY;
		const record: Record<string, string> = {};
		for (const [id, fingerprint] of Object.entries(value)) {
			if (typeof fingerprint === 'string') record[id] = fingerprint;
		}
		return record;
	} catch {
		return EMPTY;
	}
}

function notify() {
	for (const listener of listeners) listener();
}

function onStorage(event: StorageEvent) {
	// Another tab marked captures viewed.
	if (event.key === STORAGE_KEY || event.key === null) notify();
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	if (listeners.size === 1) window.addEventListener('storage', onStorage);
	return () => {
		listeners.delete(listener);
		if (listeners.size === 0) window.removeEventListener('storage', onStorage);
	};
}
