export const isDark = true;
export const cssClass = "ace-tomorrow-night-bright";
import cssText from "./tomorrow_night_bright-css.js";

import { importCssString } from "../lib/dom.js";
importCssString(cssText, cssClass, false);
