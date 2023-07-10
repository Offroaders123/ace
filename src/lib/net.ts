/*
 * based on code from:
 *
 * @license RequireJS text 0.25.0 Copyright (c) 2010-2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */

import { getDocumentHead } from "./dom.js";

export function get(url: string | URL, callback: (text: string) => void): void {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function () {
        //Do not explicitly handle errors, those should be
        //visible via console output in the browser.
        if (xhr.readyState === 4) {
            callback(xhr.responseText);
        }
    };
    xhr.send(null);
};

export function loadScript(path: string, callback: () => void): void {
    var head = getDocumentHead();
    var s = document.createElement('script');

    s.src = path;
    head.appendChild(s);

    // @ts-expect-error - non-descript type usage
    s.onload = s.onreadystatechange = function(_: any, isAbort: boolean) {
        // @ts-expect-error
        if (isAbort || !s.readyState || s.readyState == "loaded" || s.readyState == "complete") {
            // @ts-expect-error
            s = s.onload = s.onreadystatechange = null;
            if (!isAbort)
                callback();
        }
    } as unknown as any;
};

/*
 * Convert a url into a fully qualified absolute URL
 * This function does not work in IE6
 */
export function qualifyURL(url: string): string {
    var a = document.createElement('a');
    a.href = url;
    return a.href;
};
