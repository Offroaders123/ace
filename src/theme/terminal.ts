export const isDark = true;
export const cssClass = "ace-terminal-theme";
import cssText from "./terminal-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
