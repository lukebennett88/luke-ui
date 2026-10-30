import { Blockquote } from '@luke-ui/react/blockquote';
import { Code, codeRecipe } from '@luke-ui/react/code';
import { Kbd, kbdRecipe } from '@luke-ui/react/kbd';
import { Link, linkRecipe } from '@luke-ui/react/link';
import { Prose } from '@luke-ui/react/prose';
import { Text } from '@luke-ui/react/text';
import { Stack } from '../test-utils/visual.js';

export const swatch =
	"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='64'%3E%3Crect width='320' height='64' fill='%23888'/%3E%3C/svg%3E";

export function KitchenSinkDocument() {
	return (
		<Prose>
			<h1>Choosing a spacing scale</h1>
			<p>
				A spacing scale trades range for consistency. Nine steps cover a component library without
				offering two values a designer cannot tell apart.
			</p>
			<p>Every step below is a token. Reach for the nearest one rather than a raw pixel value.</p>

			<h2>Picking a step</h2>
			<p>Work outwards from the tightest gap the layout needs.</p>
			<ol>
				<li>Measure the smallest gap in the design.</li>
				<li>
					Round it to the nearest step.
					<ul>
						<li>Round down inside a control.</li>
						<li>Round up between sections.</li>
					</ul>
				</li>
				<li>Use that step everywhere the same relationship appears.</li>
			</ol>

			<h3>Rounding in practice</h3>
			<ul>
				<li>
					<p>A loose item holds more than one paragraph.</p>
					<p>The second takes a tighter gap than a document paragraph.</p>
				</li>
				<li>
					<p>Each item keeps the list rhythm.</p>
				</li>
			</ul>
			<ol type="1">
				<li>Decimal markers.</li>
			</ol>
			<ol type="a">
				<li>Lower-alpha markers.</li>
			</ol>
			<ol type="A">
				<li>Upper-alpha markers.</li>
			</ol>
			<ol type="i">
				<li>Lower-roman markers.</li>
			</ol>
			<ol type="I">
				<li>Upper-roman markers.</li>
			</ol>

			<Blockquote>
				Perfect typography is certainly the most elusive of all arts. Sculpture in stone alone comes
				near it in obstinacy.
			</Blockquote>

			<h4>Reading a token</h4>
			{/* Scrollable content needs keyboard focus. */}
			{/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
			<pre tabIndex={0}>
				<code>{'padding-inline: var(--luke-space-16);\nmargin-block: 0;'}</code>
			</pre>
			<img alt="" height={64} src={swatch} width={320} />
			<picture>
				<img alt="" height={64} src={swatch} width={320} />
			</picture>
			<video aria-label="Spacing scale animation" height={64} muted poster={swatch} width={320} />

			<table>
				<thead>
					<tr>
						<th scope="col">
							<p>
								Step
								<br />
								name
							</p>
						</th>
						<th scope="col">Value</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>
							<p>
								<Code>space.8</Code>
								<br />
								Small gap
							</p>
						</td>
						<td>
							<p>8px</p>
						</td>
					</tr>
					<tr>
						<td>
							<Code>space.24</Code>
						</td>
						<td>24px</td>
					</tr>
				</tbody>
				<tfoot>
					<tr>
						<td>Total steps</td>
						<td>2</td>
					</tr>
				</tfoot>
			</table>

			<hr />

			<h5>Terms</h5>
			<dl>
				<dt>
					<Text elementType="span" fontWeight="emphasis">
						Step
					</Text>
				</dt>
				<dd>
					<Text elementType="span">One named value on the scale.</Text>
				</dd>
				<dt>
					<Text elementType="span" fontWeight="emphasis">
						Gap
					</Text>
				</dt>
				<dd>
					<Text elementType="span">The measured distance between two boxes.</Text>
				</dd>
			</dl>

			<h6>Scale specimen</h6>
			<figure>
				<img alt="" height={64} src={swatch} width={320} />
				<figcaption>
					<Text color="secondary" elementType="span" typography="caption">
						Grouping changes with distance alone.
					</Text>
				</figcaption>
			</figure>
		</Prose>
	);
}

export function NativeElementsScene() {
	return (
		<Stack width="20rem">
			<Prose>
				<p>
					Native: <a href="#native">Read the guide</a>, <code>npm run build</code>, <kbd>⌘</kbd>{' '}
					<kbd>K</kbd>.
				</p>
				<p>
					Components: <Link href="#component">Read the guide</Link>, <Code>npm run build</Code>,{' '}
					<Kbd>⌘</Kbd> <Kbd>K</Kbd>.
				</p>
				<blockquote>
					<p>Keep the next step clear.</p>
				</blockquote>
				<Blockquote>Keep the next step clear.</Blockquote>
				<p>
					Wrapping: <code>{'unbrokenModuleName'.repeat(5)}</code>.
				</p>
				<pre>
					<code>{'const moduleName = "unbrokenModuleName";'.repeat(3)}</code>
				</pre>
				<p>
					Overrides:{' '}
					<Link href="#override" prominence="low">
						Read more
					</Link>
					,{' '}
					<a className={linkRecipe({ prominence: 'standard' })} href="#recipe">
						Recipe link
					</a>
					, <code className={codeRecipe()}>one line</code>, <kbd className={kbdRecipe()}>Esc</kbd>.
				</p>
				<p>
					<Link appearance="button" href="#button" prominence="high">
						Open project
					</Link>
				</p>
				<Blockquote typography="lead">A larger quotation.</Blockquote>
				<p>
					Text overrides:{' '}
					<Text elementType="code" typography="lead" color="secondary">
						plain code
					</Text>
					,{' '}
					<Text elementType="kbd" typography="body">
						Esc
					</Text>
					.
				</p>
				<Text elementType="blockquote" typography="lead">
					An unaccented Text quotation.
				</Text>
				<div className="not-prose">
					<p>
						Boundary: <a href="#plain">Plain link</a>, <code>plain code</code>, <kbd>Esc</kbd>.
					</p>
					<blockquote>Plain quotation.</blockquote>
					<Prose>
						<p>
							Nested: <a href="#nested">Read the guide</a>, <code>npm run build</code>,{' '}
							<kbd>Esc</kbd>.
						</p>
						<blockquote>
							<p>Prose applies again.</p>
						</blockquote>
					</Prose>
				</div>
			</Prose>
		</Stack>
	);
}
