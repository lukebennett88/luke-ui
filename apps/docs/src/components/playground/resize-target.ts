/**
 * The pointer hit target for the panel separator, in pixels. The separator
 * itself is 1px wide, so react-resizable-panels pads this out around it.
 * The library owns hit-testing at the document level, which makes this the
 * only place the grab band is set — a CSS hit area here would not agree with
 * it. The library's own defaults (10 fine, 20 coarse) are too narrow to hit
 * comfortably with a mouse.
 */
export const RESIZE_TARGET_MINIMUM_SIZE = { coarse: 20, fine: 16 };
