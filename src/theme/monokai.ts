export const isDark = true;
export const cssClass = "ace-monokai";
import cssText from "./monokai-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
