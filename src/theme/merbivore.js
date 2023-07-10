export const isDark = true;
export const cssClass = "ace-merbivore";
import cssText from "./merbivore-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
