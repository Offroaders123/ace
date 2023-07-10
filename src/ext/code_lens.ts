import { LineWidgets } from "../line_widgets.js";
import { addListener } from "../lib/event.js";
import { delayedCall } from "../lib/lang.js";
import { buildDom, createTextNode, importCssString } from "../lib/dom.js";

function clearLensElements(renderer) {
    var textLayer = renderer.$textLayer;
    var lensElements = textLayer.$lenses;
    if (lensElements)
        lensElements.forEach(function(el) {el.remove(); });
    textLayer.$lenses = null;
}

function renderWidgets(changes, renderer) {
    var changed = changes & renderer.CHANGE_LINES
        || changes & renderer.CHANGE_FULL
        || changes & renderer.CHANGE_SCROLL
        || changes & renderer.CHANGE_TEXT;
    if (!changed)
        return;

    var session = renderer.session;
    var lineWidgets = renderer.session.lineWidgets;
    var textLayer = renderer.$textLayer;
    var lensElements = textLayer.$lenses;
    if (!lineWidgets) {
        if (lensElements)
            clearLensElements(renderer);
        return;
    }

    var textCells = renderer.$textLayer.$lines.cells;
    var config = renderer.layerConfig;
    var padding = renderer.$padding;

    if (!lensElements)
        lensElements = textLayer.$lenses = [];


    var index = 0;
    for (var i = 0; i < textCells.length; i++) {
        var row = textCells[i].row;
        var widget = lineWidgets[row];
        var lenses = widget && widget.lenses;

        if (!lenses || !lenses.length) continue;

        var lensContainer = lensElements[index];
        if (!lensContainer) {
            lensContainer = lensElements[index]
                = buildDom(["div", {class: "ace_codeLens"}], renderer.container);
        }
        lensContainer.style.height = config.lineHeight + "px";
        index++;

        for (var j = 0; j < lenses.length; j++) {
            var el = lensContainer.childNodes[2 * j];
            if (!el) {
                if (j != 0) lensContainer.appendChild(createTextNode("\xa0|\xa0"));
                el = buildDom(["a"], lensContainer);
            }
            el.textContent = lenses[j].title;
            el.lensCommand = lenses[j];
        }
        while (lensContainer.childNodes.length > 2 * j - 1)
            lensContainer.lastChild.remove();

        var top = renderer.$cursorLayer.getPixelPosition({
            row: row,
            column: 0
        }, true).top - config.lineHeight * widget.rowsAbove - config.offset;
        lensContainer.style.top = top + "px";

        var left = renderer.gutterWidth;
        var indent = session.getLine(row).search(/\S|$/);
        if (indent == -1)
            indent = 0;
        left += indent * config.characterWidth;
        lensContainer.style.paddingLeft = padding + left + "px";
    }
    while (index < lensElements.length)
        lensElements.pop().remove();
}

function clearCodeLensWidgets(session) {
    if (!session.lineWidgets) return;
    var widgetManager = session.widgetManager;
    session.lineWidgets.forEach(function(widget) {
        if (widget && widget.lenses)
            widgetManager.removeLineWidget(widget);
    });
}

export function setLenses(session, lenses) {
    var firstRow = Number.MAX_VALUE;

    clearCodeLensWidgets(session);
    lenses && lenses.forEach(function(lens) {
        var row = lens.start.row;
        var column = lens.start.column;
        var widget = session.lineWidgets && session.lineWidgets[row];
        if (!widget || !widget.lenses) {
            widget = session.widgetManager.$registerLineWidget({
                rowCount: 1,
                rowsAbove: 1,
                row: row,
                column: column,
                lenses: []
            });
        }
        widget.lenses.push(lens.command);
        if (row < firstRow)
            firstRow = row;
    });
    session._emit("changeFold", {data: {start: {row: firstRow}}});
    return firstRow;
};

function attachToEditor(editor) {
    editor.codeLensProviders = [];
    editor.renderer.on("afterRender", renderWidgets);
    if (!editor.$codeLensClickHandler) {
        editor.$codeLensClickHandler = function(e) {
            var command = e.target.lensCommand;
            if (!command) return;
            editor.execCommand(command.id, command.arguments);
            editor._emit("codeLensClick", e);
        };
        addListener(editor.container,"click",editor.$codeLensClickHandler,editor);
    }
    editor.$updateLenses = function() {
        var session = editor.session;
        if (!session) return;

        if (!session.widgetManager) {
            session.widgetManager = new LineWidgets(session);
            session.widgetManager.attach(editor);
        }

        var providersToWaitNum = editor.codeLensProviders.length;
        var lenses = [];
        editor.codeLensProviders.forEach(function(provider) {
            provider.provideCodeLenses(session, function(err, payload) {
                if (err) return;
                payload.forEach(function(lens) {
                    lenses.push(lens);
                });
                providersToWaitNum--;
                if (providersToWaitNum == 0) {
                    applyLenses();
                }
            });
        });

        function applyLenses() {
            var cursor = session.selection.cursor;
            var oldRow = session.documentToScreenRow(cursor);
            var scrollTop = session.getScrollTop();
            var firstRow = setLenses(session, lenses);

            var lastDelta = session.$undoManager && session.$undoManager.$lastDelta;
            if (lastDelta && lastDelta.action == "remove" && lastDelta.lines.length > 1)
                return;
            var row = session.documentToScreenRow(cursor);
            var lineHeight = editor.renderer.layerConfig.lineHeight;
            var top = session.getScrollTop() + (row - oldRow) * lineHeight;
            // special case for the lens on line 0, because it can't be scrolled into view with keyboard 
            if (firstRow == 0 && scrollTop < lineHeight /4 && scrollTop > -lineHeight/4) {
                top = -lineHeight;
            }
            session.setScrollTop(top);
        }
    };
    var updateLenses = delayedCall(editor.$updateLenses);
    editor.$updateLensesOnInput = function() {
        updateLenses.delay(250);
    };
    editor.on("input", editor.$updateLensesOnInput);
}

function detachFromEditor(editor) {
    editor.off("input", editor.$updateLensesOnInput);
    editor.renderer.off("afterRender", renderWidgets);
    if (editor.$codeLensClickHandler)
        editor.container.removeEventListener("click", editor.$codeLensClickHandler);
}

export function registerCodeLensProvider(editor, codeLensProvider) {
    editor.setOption("enableCodeLens", true);
    editor.codeLensProviders.push(codeLensProvider);
    editor.$updateLensesOnInput();
};

export function clear(session) {
    setLenses(session, null);
};

import { Editor } from "../editor.js";
require("../config").defineOptions(Editor.prototype, "editor", {
    enableCodeLens: {
        set: function(val) {
            if (val) {
                attachToEditor(this);
            } else {
                detachFromEditor(this);
            }
        }
    }
});

importCssString(`
.ace_codeLens {
    position: absolute;
    color: #aaa;
    font-size: 88%;
    background: inherit;
    width: 100%;
    display: flex;
    align-items: flex-end;
    pointer-events: none;
}
.ace_codeLens > a {
    cursor: pointer;
    pointer-events: auto;
}
.ace_codeLens > a:hover {
    color: #0000ff;
    text-decoration: underline;
}
.ace_dark > .ace_codeLens > a:hover {
    color: #4e94ce;
}
`, "codelense.css", false);
