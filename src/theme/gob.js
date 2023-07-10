export const isDark = true;
export const cssClass = "ace-gob";
import cssText from "./gob-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
