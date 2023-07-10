export const isDark = false;
export const cssClass = "ace-chrome";
import cssText from "./chrome-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
