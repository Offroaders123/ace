export const isDark = true;
  export const cssClass = "ace-cloud9-night";
  import cssText from "./cloud9_night-css.js";

  export { cssText };

  import { importCssString } from "../lib/dom.js";
  importCssString(cssText, cssClass);
