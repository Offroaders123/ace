export const isDark = true;
export const cssClass = "ace-twilight";
import cssText from "./twilight-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
