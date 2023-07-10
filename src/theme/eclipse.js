
export const isDark = false;
import cssText from "./eclipse-css.js";

export const cssClass = "ace-eclipse";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
