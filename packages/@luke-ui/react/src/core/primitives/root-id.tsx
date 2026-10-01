import type { JSX, ReactElement } from 'react';

/** A React Aria `render` function for a root that renders a `<div>`. */
type RootRenderFunction = (domProps: JSX.IntrinsicElements['div']) => ReactElement;

/** The `id` and `render` props a Luke UI root passes to its React Aria root. */
interface RootIdProps {
	id: string | undefined;
	render: RootRenderFunction | undefined;
}

/**
 * Translates a Luke UI root's ids for its React Aria field root.
 *
 * React Aria field roots (`TextField`, `ComboBox`, `Select`, `CheckboxField`, `SwitchField`) treat
 * `id` as the control's id and remove it from their root `<div>`. A Luke UI root keeps `id` on its
 * own element, so it passes the descendant id (`inputId` or `triggerId`) to React Aria's `id` and
 * restores the root id through React Aria's `render` seam. `render` returns the same `<div>` with
 * React Aria's props and ref, so the seam adds no wrapper element.
 *
 * Luke UI roots omit `render` from their public props, so this is the only `render` they pass.
 */
export function rootIdProps(
	rootId: string | undefined,
	descendantId: string | undefined,
): RootIdProps {
	return {
		id: descendantId,
		render: rootId === undefined ? undefined : (domProps) => <div {...domProps} id={rootId} />,
	};
}
