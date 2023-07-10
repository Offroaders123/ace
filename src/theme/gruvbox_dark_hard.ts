export const isDark = true;
export const cssClass = "ace-gruvbox-dark-hard";
import cssText from "./gruvbox_dark_hard-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass);
