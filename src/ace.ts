/**
 * The main class required to set up an Ace instance in the browser.
 *
 * @class Ace
 **/

"include loader_build";

import { createElement } from "./lib/dom.js";

import { Range } from "./range.js";
import { Editor } from "./editor.js";
import { EditSession } from "./edit_session.js";
import { UndoManager } from "./undomanager.js";
import { VirtualRenderer } from "./virtual_renderer.js";

export { Range, Editor, EditSession, UndoManager, VirtualRenderer };

// The following require()s are for inclusion in the built ace file
import "./worker/worker_client.js";
import "./keyboard/hash_handler.js";
import "./placeholder.js";
import "./multi_select.js";
import "./mode/folding/fold_mode.js";
import "./theme/textmate.js";
import "./ext/error_marker.js";

import config from "./config.js";


/**
 * Embeds the Ace editor into the DOM, at the element provided by `el`.
 * @param {String | Element} el Either the id of an element, or the element itself
 * @param {Object } options Options for the editor
 *
 **/
export function edit(el, options) {
    if (typeof el == "string") {
        var _id = el;
        el = document.getElementById(_id);
        if (!el)
            throw new Error("ace.edit can't find div #" + _id);
    }

    if (el && el.env && el.env.editor instanceof Editor)
        return el.env.editor;

    var value = "";
    if (el && /input|textarea/i.test(el.tagName)) {
        var oldNode = el;
        value = oldNode.value;
        el = createElement("pre");
        oldNode.parentNode.replaceChild(el, oldNode);
    } else if (el) {
        value = el.textContent;
        el.innerHTML = "";
    }

    var doc = createEditSession(value);

    var editor = new Editor(new VirtualRenderer(el), doc, options);

    var env = {
        document: doc,
        editor: editor,
        onResize: editor.resize.bind(editor, null)
    };
    if (oldNode) env.textarea = oldNode;
    editor.on("destroy", function() {
        env.editor.container.env = null; // prevent memory leak on old ie
    });
    editor.container.env = editor.env = env;
    return editor;
};

/**
 * Creates a new [[EditSession]], and returns the associated [[Document]].
 * @param {Document | String} text {:textParam}
 * @param {TextMode} mode {:modeParam}
 *
 **/
export function createEditSession(text, mode) {
    var doc = new EditSession(text, mode);
    doc.setUndoManager(new UndoManager());
    return doc;
}
export const version = config.version;
