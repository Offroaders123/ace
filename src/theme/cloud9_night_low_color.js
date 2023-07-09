export const isDark = true;
export const cssClass = "ace-cloud9-night-low-color";
import cssText from "./cloud9_night_low_color-css.js";

export { cssText };

  import { importCssString } from "../lib/dom.js";
  importCssString(cssText, cssClass);
