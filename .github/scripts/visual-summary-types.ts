// `summary.json` is written by the react package's visual-regression script, so
// its shape is owned there. These are re-exported rather than redeclared so the
// two sides cannot drift: adding a `VisualStatus` there is a type error here.
//
// The import is deliberately relative and type-only. `.github/scripts` is not a
// workspace package and cannot depend on `@luke-ui/react`, and the source module
// pulls in pixelmatch/pngjs at runtime. `import type` erases entirely, so nothing
// from the react package is loaded when these scripts run on the runner.
import type {
	VisualCounts,
	VisualResult,
	VisualStatus,
} from '../../packages/@luke-ui/react/scripts/visual-regression-lib.js';

export type { VisualCounts, VisualStatus };

/** The on-disk shape of `.artifacts/visual-regression/summary.json`. */
export type VisualSummary = {
	counts: VisualCounts;
	results: Array<VisualResult>;
};
