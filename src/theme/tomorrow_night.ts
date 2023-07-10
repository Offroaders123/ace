export const isDark = true;
export const cssClass = "ace-tomorrow-night";
import cssText from "./tomorrow_night-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
