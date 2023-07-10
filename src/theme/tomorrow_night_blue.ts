export const isDark = true;
export const cssClass = "ace-tomorrow-night-blue";
import cssText from "./tomorrow_night_blue-css.js";

export { cssText };

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
