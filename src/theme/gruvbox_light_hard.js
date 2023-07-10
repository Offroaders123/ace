export const isDark = false;
export const cssClass = "ace-gruvbox-light-hard";
import cssText from "./gruvbox_light_hard-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass);
