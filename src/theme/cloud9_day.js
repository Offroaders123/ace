"use strict";

export const isDark = false;
export const cssClass = "ace-cloud9-day";
import cssText from "./cloud9_day-css.js";

export { cssText };

  import { importCssString } from "../lib/dom.js";
  importCssString(cssText, cssClass);
