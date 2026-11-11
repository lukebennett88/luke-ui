/**
 * The pointer hit target for the panel separator, in pixels. The separator
 * itself is 1px wide, so react-resizable-panels pads this out around it.
 * The library owns hit-testing at the document level, which makes this the
 * only place the grab band is set — a CSS hit area here would not agree with
 * it. The library's 10px fine-pointer default is too narrow to hit comfortably
 * with a mouse; `coarse` matches its default and is only spelled out because
 * the prop takes both.
 */
export const RESIZE_TARGET_MINIMUM_SIZE = { coarse: 20, fine: 16 };
