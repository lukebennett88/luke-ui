import { vars } from '@luke-ui/react/theme';
import type { CSSProperties } from 'react';
import { useState } from 'react';

type TokenGroupId =
	| 'content'
	| 'depth'
	| 'intent'
	| 'radius'
	| 'spacing'
	| 'surfaces'
	| 'typography';

interface TokenValue {
	path: string;
	value: string;
}

interface TokenRow {
	label: string;
	values: Array<TokenValue>;
}

interface TokenGroup {
	description: string;
	id: TokenGroupId;
	label: string;
	rows: Array<TokenRow>;
}

const groups: Array<TokenGroup> = [
	{
		description: 'Choose the layer an element occupies.',
		id: 'surfaces',
		label: 'Surfaces',
		rows: [
			token('Canvas', 'color.surface.canvas', vars.color.surface.canvas),
			token('Recessed', 'color.surface.recessed', vars.color.surface.recessed),
			token('Resting', 'color.surface.resting', vars.color.surface.resting),
			token('Floating', 'color.surface.floating', vars.color.surface.floating),
			token('Overlay', 'color.surface.overlay', vars.color.surface.overlay),
			token('Disabled', 'color.surfaceDisabled', vars.color.surfaceDisabled),
			token('Loading skeleton', 'color.loadingSkeleton', vars.color.loadingSkeleton),
		],
	},
	{
		description: 'Choose readable text and borders that describe control state.',
		id: 'content',
		label: 'Content',
		rows: [
			token('Primary text', 'color.text.primary', vars.color.text.primary),
			token('Secondary text', 'color.text.secondary', vars.color.text.secondary),
			token('Disabled text', 'color.textDisabled', vars.color.textDisabled),
			token('Decorative border', 'color.border.decorative', vars.color.border.decorative),
			token('Control border', 'color.border.control', vars.color.border.control),
			token('Focus border', 'color.border.focus', vars.color.border.focus),
			token('Disabled border', 'color.borderDisabled', vars.color.borderDisabled),
		],
	},
	{
		description: 'Choose the meaning of status and action feedback, not a palette colour.',
		id: 'intent',
		label: 'Intent',
		rows: [
			intent('Neutral', vars.color.intent.neutral, false),
			intent('Accent', vars.color.intent.accent, true),
			intent('Info', vars.color.intent.info, true),
			intent('Success', vars.color.intent.success, true),
			intent('Warning', vars.color.intent.warning, true),
			intent('Danger', vars.color.intent.danger, true),
		],
	},
	{
		description: 'Choose coordinated type steps and weight roles.',
		id: 'typography',
		label: 'Typography',
		rows: [
			token('Font family', 'font.family', vars.font.family),
			...([100, 200, 300, 400, 500, 600, 700, 800, 900] as const).map((size) => ({
				label: `${size} type step`,
				values: [
					{ path: `font.${size}.fontSize`, value: vars.font[size].fontSize },
					{ path: `font.${size}.lineHeight`, value: vars.font[size].lineHeight },
					{ path: `font.${size}.letterSpacing`, value: vars.font[size].letterSpacing },
				],
			})),
			token('Body weight', 'font.weight.body', vars.font.weight.body),
			token('Label weight', 'font.weight.label', vars.font.weight.label),
			token('Heading weight', 'font.weight.heading', vars.font.weight.heading),
			token('Emphasis weight', 'font.weight.emphasis', vars.font.weight.emphasis),
		],
	},
	{
		description: 'Choose the spacing step that matches the separation between elements.',
		id: 'spacing',
		label: 'Spacing',
		rows: ([100, 200, 300, 400, 600, 800, 1000, 1200, 1600] as const).map((size) =>
			token(`${size}`, `space.${size}`, vars.space[size]),
		),
	},
	{
		description:
			'Choose a radius for a detail, control, surface, overlay, or fully rounded element.',
		id: 'radius',
		label: 'Radius',
		rows: [
			token('Detail', 'radius.detail', vars.radius.detail),
			token('Control', 'radius.control', vars.radius.control),
			token('Surface', 'radius.surface', vars.radius.surface),
			token('Overlay', 'radius.overlay', vars.radius.overlay),
			token('Full', 'radius.full', vars.radius.full),
		],
	},
	{
		description: 'Choose the elevation of a surface instead of assembling a shadow.',
		id: 'depth',
		label: 'Depth',
		rows: [
			token('Recessed', 'depth.recessed', vars.depth.recessed),
			token('Resting', 'depth.resting', vars.depth.resting),
			token('Raised', 'depth.raised', vars.depth.raised),
			token('Floating', 'depth.floating', vars.depth.floating),
			token('Overlay', 'depth.overlay', vars.depth.overlay),
		],
	},
];

export function TokenExplorer() {
	const [groupId, setGroupId] = useState<TokenGroupId>('surfaces');
	const group = groups.find((item) => item.id === groupId) ?? groups[0];

	if (!group) return null;

	return (
		<section className="not-prose grid gap-4 rounded-lg border border-fd-border bg-fd-card p-4">
			<div className="flex flex-wrap justify-end gap-3">
				<label className="grid gap-1 text-fd-foreground text-sm">
					<span>Purpose</span>
					<select
						className="h-9 rounded-md border border-fd-border bg-fd-background px-2"
						onChange={(event) => setGroupId(event.target.value as TokenGroupId)}
						value={group.id}
					>
						{groups.map((item) => (
							<option key={item.id} value={item.id}>
								{item.label}
							</option>
						))}
					</select>
				</label>
			</div>
			<div>
				<h3 className="m-0 font-semibold text-fd-foreground">{group.label}</h3>
				<p className="mb-0 mt-1 text-fd-muted-foreground text-sm">{group.description}</p>
			</div>
			<div className="overflow-x-auto rounded-md border border-fd-border">
				<table className="w-full min-w-[40rem] border-collapse text-sm">
					<thead className="bg-fd-muted">
						<tr>
							<th className="p-3 text-left font-medium">Effect</th>
							<th className="p-3 text-left font-medium">Purpose</th>
							<th className="p-3 text-left font-medium">Public variable</th>
						</tr>
					</thead>
					<tbody>
						{group.rows.map((row) => (
							<tr className="border-fd-border border-t" key={row.label}>
								<td className="p-3">
									<TokenPreview groupId={group.id} row={row} />
								</td>
								<td className="p-3 text-fd-foreground">{row.label}</td>
								<td className="p-3 font-mono text-xs text-fd-muted-foreground">
									{row.values.map((value) => (
										<div key={value.path}>{customPropertyName(value.value)}</div>
									))}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</section>
	);
}

function TokenPreview({ groupId, row }: { groupId: TokenGroupId; row: TokenRow }) {
	const value = row.values[0]?.value;
	if (!value) return null;

	const style = previewStyle(groupId, row, value);
	return (
		<div
			aria-label={`${row.label} token preview`}
			className="flex h-10 w-24 items-center justify-center border border-fd-border text-xs"
			role="img"
			style={style}
		>
			{groupId === 'typography' ? 'Aa' : null}
		</div>
	);
}

function previewStyle(groupId: TokenGroupId, row: TokenRow, value: string): CSSProperties {
	if (groupId === 'content') {
		return row.label.includes('border')
			? { backgroundColor: vars.color.surface.resting, borderColor: value, borderWidth: 3 }
			: { backgroundColor: value };
	}
	if (groupId === 'typography') {
		if (row.label.endsWith('type step')) {
			return {
				fontFamily: vars.font.family,
				fontSize: value,
				letterSpacing: row.values[2]?.value,
				lineHeight: row.values[1]?.value,
			};
		}
		return row.label.endsWith('weight') ? { fontWeight: value } : { fontFamily: value };
	}
	if (groupId === 'spacing') {
		return { backgroundColor: vars.color.intent.accent.surface.solid, inlineSize: value };
	}
	if (groupId === 'radius')
		return { backgroundColor: vars.color.surface.recessed, borderRadius: value };
	if (groupId === 'depth') return { backgroundColor: vars.color.surface.resting, boxShadow: value };
	if (groupId === 'intent') return { backgroundColor: value };
	return { backgroundColor: value };
}

function intent(
	label: string,
	value: {
		onSolid: string;
		surface: {
			solid: string;
			solidHover: string;
			solidPressed: string;
			subtle: string;
			subtleHover: string;
			subtlePressed: string;
		};
	},
	hasContentRoles: boolean,
): TokenRow {
	const path = label.toLowerCase();
	const values = [
		{ path: `color.intent.${path}.surface.subtle`, value: value.surface.subtle },
		{ path: `color.intent.${path}.surface.subtleHover`, value: value.surface.subtleHover },
		{ path: `color.intent.${path}.surface.subtlePressed`, value: value.surface.subtlePressed },
		{ path: `color.intent.${path}.surface.solid`, value: value.surface.solid },
		{ path: `color.intent.${path}.surface.solidHover`, value: value.surface.solidHover },
		{ path: `color.intent.${path}.surface.solidPressed`, value: value.surface.solidPressed },
		{ path: `color.intent.${path}.onSolid`, value: value.onSolid },
	];
	if (!hasContentRoles) return { label, values };

	const roles = value as typeof value & { border: string; text: string; textHover?: string };
	values.push(
		{ path: `color.intent.${path}.border`, value: roles.border },
		{ path: `color.intent.${path}.text`, value: roles.text },
	);
	if (roles.textHover)
		values.push({ path: `color.intent.${path}.textHover`, value: roles.textHover });
	return { label, values };
}

function token(label: string, path: string, value: string): TokenRow {
	return { label, values: [{ path, value }] };
}

function customPropertyName(value: string): string {
	const match = /^var\((--[^,)]+)/.exec(value);
	return match?.[1] ?? value;
}
