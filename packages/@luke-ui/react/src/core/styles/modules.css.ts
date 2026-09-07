// Style-producing modules in the shipped stylesheet. Named layers set cross-layer priority, but
// same-layer, same-specificity CSS still resolves by source order: later wins. List a module
// that sets concrete values another one must override before that other module, so the later
// module's own styles win the tie — e.g. `text/recipe.css` before `kbd/recipe.css` and
// `code/recipe.css`: `textRecipe`'s `shouldInheritFont` variant sets `fontFamily`/`fontSize`/
// `fontWeight` to `inherit`, while `kbdRecipe`'s and `codeRecipe`'s base styles set those same
// properties to concrete values, all in the `recipes` layer at equal specificity, so `text` must
// come first for `kbd`/`code` to win the tie. (`primitives/field` before `primitives/checkbox`
// is NOT such a pair: the `fieldMessageIcon` custom property they share resolves through CSS
// inheritance at computed-value time, which does not depend on stylesheet source order.) The
// component and primitive generators preserve this order. They append new imports to the end
// and do not sort it.
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
import '../icon/recipe.css.js';
import '../kbd/recipe.css.js';
import '../link/recipe.css.js';
import '../loading-skeleton/styles.css.js';
import '../loading-spinner/recipe.css.js';
import '../overlays/mobile-overlay.css.js';
import '../prose/recipe.css.js';
import '../visually-hidden/recipe.css.js';
