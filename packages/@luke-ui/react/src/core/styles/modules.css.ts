// Modules that produce the shipped stylesheet. Named layers set cross-layer priority. Within a
// layer, later equal-specificity rules win. Put overridden modules first — for example
// `text/recipe.css` before `code/recipe.css` and `kbd/recipe.css`, so their concrete fonts beat
// `shouldInheritFont`'s `inherit`. Inherited custom properties (for example `fieldMessageIcon`)
// ignore source order. Generators append imports; they do not sort this list.
import '../primitives/button/recipe.css.js';
import '../primitives/field/recipe.css.js';
import '../primitives/checkbox/recipe.css.js';
import '../primitives/combobox/styles.css.js';
import '../primitives/input-group/recipe.css.js';
import '../text/recipe.css.js';
import '../blockquote/recipe.css.js';
import '../button/styles.css.js';
import '../code/recipe.css.js';
import '../icon-button/recipe.css.js';
import '../icon-button/styles.css.js';
import '../icon/recipe.css.js';
import '../kbd/recipe.css.js';
import '../link/styles.css.js';
import '../loading-skeleton/styles.css.js';
import '../loading-spinner/recipe.css.js';
import '../overlays/mobile-overlay.css.js';
import '../prose/recipe.css.js';
import '../styles/pending-spinner-overlay.css.js';
import '../visually-hidden/recipe.css.js';
