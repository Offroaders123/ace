export const isDark = true;
export const cssClass = "ace-tomorrow-night-eighties";
import cssText from "./tomorrow_night_eighties-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
