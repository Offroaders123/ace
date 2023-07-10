export const isDark = true;
export const cssClass = "ace-clouds-midnight";
import cssText from "./clouds_midnight-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
