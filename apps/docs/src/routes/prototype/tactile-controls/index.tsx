import './tactile-controls.css';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';

const variants = ['A', 'B', 'C'] as const;
type Variant = (typeof variants)[number];
const primaryColours = ['teal', 'orange', 'pink'] as const;
type PrimaryColour = (typeof primaryColours)[number];

const searchSchema = z.object({
	variant: z.enum(variants).catch('A').default('A'),
});

const variantNames: Record<Variant, string> = {
	A: 'Layered lift',
	B: 'Machined edge',
	C: 'Inset membrane',
};

export const Route = createFileRoute('/prototype/tactile-controls/')({
	component: TactileControlsPrototype,
	head: () => ({ meta: [{ title: 'Tactile controls prototype — Luke UI' }] }),
	validateSearch: searchSchema,
});

// THROWAWAY PROTOTYPE: three tactile control languages, switched with ?variant=A|B|C.
function TactileControlsPrototype() {
	const { variant } = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const [mode, setMode] = useState<'light' | 'dark'>('light');
	const [isReducedMotion, setIsReducedMotion] = useState(false);
	const [primaryColour, setPrimaryColour] = useState<PrimaryColour>('teal');

	const selectVariant = useCallback(
		(nextVariant: Variant) => {
			void navigate({ replace: true, search: { variant: nextVariant } });
		},
		[navigate],
	);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
			const target = event.target;
			if (
				target instanceof Element &&
				target.closest('input, textarea, select, [contenteditable="true"]')
			) {
				return;
			}

			event.preventDefault();
			const offset = event.key === 'ArrowRight' ? 1 : -1;
			const currentIndex = variants.indexOf(variant);
			selectVariant(variants[(currentIndex + offset + variants.length) % variants.length]!);
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => window.removeEventListener('keydown', handleKeyDown);
	}, [selectVariant, variant]);

	const VariantComponent = { A: VariantA, B: VariantB, C: VariantC }[variant];

	return (
		<main
			className="tactile-prototype"
			data-mode={mode}
			data-primary-colour={primaryColour}
			data-reduced-motion={isReducedMotion || undefined}
			data-variant={variant}
		>
			<header className="tactile-header">
				<div>
					<p className="tactile-kicker">Throwaway control study</p>
					<h1>{variantNames[variant]}</h1>
					<p>Compare elevation, edges and response across the same practical control states.</p>
				</div>
				<div className="view-toggles">
					{variant === 'B' ? (
						<div aria-label="Primary colour" className="colour-toggle" role="group">
							{primaryColours.map((colour) => (
								<button
									aria-pressed={primaryColour === colour}
									key={colour}
									onClick={() => setPrimaryColour(colour)}
									type="button"
								>
									<span aria-hidden="true" className={`colour-swatch colour-swatch-${colour}`} />
									{colour[0]?.toUpperCase() + colour.slice(1)}
								</button>
							))}
						</div>
					) : null}
					<button
						aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
						className="mode-toggle"
						onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
						type="button"
					>
						<span aria-hidden="true">{mode === 'light' ? '☀' : '◐'}</span>
						{mode === 'light' ? 'Light' : 'Dark'} mode
					</button>
					<button
						aria-pressed={isReducedMotion}
						className="mode-toggle"
						onClick={() => setIsReducedMotion(!isReducedMotion)}
						type="button"
					>
						<span aria-hidden="true">↝</span>
						{isReducedMotion ? 'Reduced motion' : 'Full motion'}
					</button>
				</div>
			</header>

			<VariantComponent />

			{import.meta.env.DEV ? (
				<PrototypeSwitcher current={variant} onChange={selectVariant} />
			) : null}
		</main>
	);
}

function ControlStates() {
	return (
		<div className="state-grid">
			<State label="Resting" description="Raised and ready">
				<button className="tactile-button" type="button">
					Save changes
				</button>
			</State>
			<State label="Hover target" description="Pointer acknowledgement">
				<button className="tactile-button demo-hover" type="button">
					Add member
				</button>
			</State>
			<State label="Pressed" description="Travel at full depth">
				<button aria-pressed="true" className="tactile-button demo-pressed" type="button">
					Following
				</button>
			</State>
			<State label="Focus visible" description="Keyboard location">
				<button className="tactile-button demo-focus" type="button">
					Continue
				</button>
			</State>
			<State label="Pending" description="Action retained in place">
				<button aria-busy="true" className="tactile-button" type="button">
					<span className="pending-mark" aria-hidden="true" /> Saving
				</button>
			</State>
			<State label="Disabled" description="Unavailable, still legible">
				<button className="tactile-button" disabled type="button">
					Archive
				</button>
			</State>
		</div>
	);
}

function AdjacentControls() {
	return (
		<div className="adjacent-controls">
			<label className="field-control">
				<span>Workspace name</span>
				<input defaultValue="Field notes" />
			</label>
			<label className="field-control">
				<span>Review cadence</span>
				<select defaultValue="weekly">
					<option value="daily">Daily</option>
					<option value="weekly">Weekly</option>
					<option value="monthly">Monthly</option>
				</select>
			</label>
			<fieldset className="choice-control">
				<legend>Notifications</legend>
				<label>
					<input defaultChecked type="checkbox" /> Mentions
				</label>
				<label>
					<input type="checkbox" /> Weekly digest
				</label>
			</fieldset>
			<fieldset className="choice-control segment-control">
				<legend>Density</legend>
				<label>
					<input defaultChecked name="density" type="radio" /> Calm
				</label>
				<label>
					<input name="density" type="radio" /> Compact
				</label>
			</fieldset>
		</div>
	);
}

function VariantA() {
	return (
		<section className="variant-shell variant-a" aria-labelledby="variant-a-title">
			<div className="variant-intro">
				<div>
					<h2 id="variant-a-title">Layered lift</h2>
					<p>A clear base edge makes travel readable before the pointer arrives.</p>
				</div>
				<span className="material-note">3 px travel · broad highlight</span>
			</div>
			<ControlStates />
			<div className="control-tray">
				<h2>Adjacent controls</h2>
				<AdjacentControls />
			</div>
		</section>
	);
}

function VariantB() {
	return (
		<section className="variant-shell variant-b" aria-labelledby="variant-b-title">
			<aside className="variant-rail">
				<h2 id="variant-b-title">Machined edge</h2>
				<p>Fine highlights and compact travel suit a denser working surface.</p>
				<dl>
					<div>
						<dt>Travel</dt>
						<dd>1 px</dd>
					</div>
					<div>
						<dt>Edge</dt>
						<dd>Double line</dd>
					</div>
					<div>
						<dt>Focus</dt>
						<dd>Offset ring</dd>
					</div>
				</dl>
			</aside>
			<div className="variant-workbench">
				<ControlStates />
				<AdjacentControls />
			</div>
		</section>
	);
}

function VariantC() {
	return (
		<section className="variant-shell variant-c" aria-labelledby="variant-c-title">
			<div className="membrane-heading">
				<h2 id="variant-c-title">Inset membrane</h2>
				<p>Controls sit within a continuous plane; pressure is shown by compressed light.</p>
			</div>
			<div className="membrane-bank">
				<ControlStates />
			</div>
			<div className="membrane-settings">
				<AdjacentControls />
			</div>
		</section>
	);
}

function State({
	children,
	description,
	label,
}: {
	children: React.ReactNode;
	description: string;
	label: string;
}) {
	return (
		<div className="state-sample">
			<div className="state-copy">
				<strong>{label}</strong>
				<span>{description}</span>
			</div>
			{children}
		</div>
	);
}

function PrototypeSwitcher({
	current,
	onChange,
}: {
	current: Variant;
	onChange: (variant: Variant) => void;
}) {
	const cycle = (offset: number) => {
		const index = variants.indexOf(current);
		onChange(variants[(index + offset + variants.length) % variants.length]!);
	};

	return (
		<nav aria-label="Prototype variants" className="prototype-switcher">
			<button aria-label="Previous prototype variant" onClick={() => cycle(-1)} type="button">
				←
			</button>
			<span>
				<b>{current}</b> — {variantNames[current]}
			</span>
			<button aria-label="Next prototype variant" onClick={() => cycle(1)} type="button">
				→
			</button>
		</nav>
	);
}
