export const isDark = false;
export const cssClass = "ace-kuroir";
import cssText from "./kuroir-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
