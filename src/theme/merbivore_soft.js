export const isDark = true;
export const cssClass = "ace-merbivore-soft";
import cssText from "./merbivore_soft-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
