export const isDark = false;
export const cssClass = "ace-katzenmilch";
import cssText from "./katzenmilch-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
