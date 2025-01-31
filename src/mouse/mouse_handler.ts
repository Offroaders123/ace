import { addListener, addMultiMouseDownListener, addMouseWheelListener, capture, stopEvent } from "../lib/event.js";
import { isIE, isWebKit, isOldIE, isMac } from "../lib/useragent.js";
import { DefaultHandlers } from "./default_handlers.js";
import { GutterHandler as DefaultGutterHandler } from "./default_gutter_handler.js";
import { MouseEvent } from "./mouse_event.js";
import { DragdropHandler } from "./dragdrop_handler.js";
import { addTouchListeners } from "./touch_handler.js";
import { defineOptions } from "../config.js";

export class MouseHandler {
    releaseMouse = null;

    constructor(editor) {
        var _self = this;
        this.editor = editor;

        new DefaultHandlers(this);
        new DefaultGutterHandler(this);
        new DragdropHandler(this);

        var focusEditor = function(e) {
            // because we have to call event.preventDefault() any window on ie and iframes
            // on other browsers do not get focus, so we have to call window.focus() here
            var windowBlurred = !document.hasFocus || !document.hasFocus()
                || !editor.isFocused() && document.activeElement == (editor.textInput && editor.textInput.getElement());
            if (windowBlurred)
                window.focus();
            editor.focus();
            // Without this editor is blurred after double click
            setTimeout(function () {
                if (!editor.isFocused()) editor.focus();
            });
        };

        var mouseTarget = editor.renderer.getMouseEventTarget();
        addListener(mouseTarget, "click", this.onMouseEvent.bind(this, "click"), editor);
        addListener(mouseTarget, "mousemove", this.onMouseMove.bind(this, "mousemove"), editor);
        addMultiMouseDownListener([
            mouseTarget,
            editor.renderer.scrollBarV && editor.renderer.scrollBarV.inner,
            editor.renderer.scrollBarH && editor.renderer.scrollBarH.inner,
            editor.textInput && editor.textInput.getElement()
        ].filter(Boolean), [400, 300, 250], this, "onMouseEvent", editor);
        addMouseWheelListener(editor.container, this.onMouseWheel.bind(this, "mousewheel"), editor);
        addTouchListeners(editor.container, editor);

        var gutterEl = editor.renderer.$gutter;
        addListener(gutterEl, "mousedown", this.onMouseEvent.bind(this, "guttermousedown"), editor);
        addListener(gutterEl, "click", this.onMouseEvent.bind(this, "gutterclick"), editor);
        addListener(gutterEl, "dblclick", this.onMouseEvent.bind(this, "gutterdblclick"), editor);
        addListener(gutterEl, "mousemove", this.onMouseEvent.bind(this, "guttermousemove"), editor);

        addListener(mouseTarget, "mousedown", focusEditor, editor);
        addListener(gutterEl, "mousedown", focusEditor, editor);
        if (isIE && editor.renderer.scrollBarV) {
            addListener(editor.renderer.scrollBarV.element, "mousedown", focusEditor, editor);
            addListener(editor.renderer.scrollBarH.element, "mousedown", focusEditor, editor);
        }

        editor.on("mousemove", function(e){
            if (_self.state || _self.$dragDelay || !_self.$dragEnabled)
                return;

            var character = editor.renderer.screenToTextCoordinates(e.x, e.y);
            var range = editor.session.selection.getRange();
            var renderer = editor.renderer;

            if (!range.isEmpty() && range.insideStart(character.row, character.column)) {
                renderer.setCursorStyle("default");
            } else {
                renderer.setCursorStyle("");
            }
        }, editor);
    }

    onMouseEvent(name, e) {
        if (!this.editor.session) return;
        this.editor._emit(name, new MouseEvent(e, this.editor));
    }

    onMouseMove(name, e) {
        // optimization, because mousemove doesn't have a default handler.
        var listeners = this.editor._eventRegistry && this.editor._eventRegistry.mousemove;
        if (!listeners || !listeners.length)
            return;

        this.editor._emit(name, new MouseEvent(e, this.editor));
    }

    onMouseWheel(name, e) {
        var mouseEvent = new MouseEvent(e, this.editor);
        mouseEvent.speed = this.$scrollSpeed * 2;
        mouseEvent.wheelX = e.wheelX;
        mouseEvent.wheelY = e.wheelY;

        this.editor._emit(name, mouseEvent);
    }
    
    setState(state) {
        this.state = state;
    }

    captureMouse(ev, mouseMoveHandler) {
        this.x = ev.x;
        this.y = ev.y;

        this.isMousePressed = true;

        // do not move textarea during selection
        var editor = this.editor;
        var renderer = this.editor.renderer;
        renderer.$isMousePressed = true;

        var self = this;
        var onMouseMove = function(e) {
            if (!e) return;
            // if editor is loaded inside iframe, and mouseup event is outside
            // we won't recieve it, so we cancel on first mousemove without button
            if (isWebKit && !e.which && self.releaseMouse)
                return self.releaseMouse();

            self.x = e.clientX;
            self.y = e.clientY;
            mouseMoveHandler && mouseMoveHandler(e);
            self.mouseEvent = new MouseEvent(e, self.editor);
            self.$mouseMoved = true;
        };

        var onCaptureEnd = function(e) {
            editor.off("beforeEndOperation", onOperationEnd);
            clearInterval(timerId);
            if (editor.session) onCaptureInterval();
            self[self.state + "End"] && self[self.state + "End"](e);
            self.state = "";
            self.isMousePressed = renderer.$isMousePressed = false;
            if (renderer.$keepTextAreaAtCursor)
                renderer.$moveTextAreaToCursor();
            self.$onCaptureMouseMove = self.releaseMouse = null;
            e && self.onMouseEvent("mouseup", e);
            editor.endOperation();
        };

        var onCaptureInterval = function() {
            self[self.state] && self[self.state]();
            self.$mouseMoved = false;
        };

        if (isOldIE && ev.domEvent.type == "dblclick") {
            return setTimeout(function() {onCaptureEnd(ev);});
        }

        var onOperationEnd = function(e) {
            if (!self.releaseMouse) return;
            // some touchpads fire mouseup event after a slight delay, 
            // which can cause problems if user presses a keyboard shortcut quickly
            if (editor.curOp.command.name && editor.curOp.selectionChanged) {
                self[self.state + "End"] && self[self.state + "End"]();
                self.state = "";
                self.releaseMouse();
            }
        };

        editor.on("beforeEndOperation", onOperationEnd);
        editor.startOperation({command: {name: "mouse"}});

        self.$onCaptureMouseMove = onMouseMove;
        self.releaseMouse = capture(this.editor.container, onMouseMove, onCaptureEnd);
        var timerId = setInterval(onCaptureInterval, 20);
    }
    cancelContextMenu() {
        var stop = function(e) {
            if (e && e.domEvent && e.domEvent.type != "contextmenu")
                return;
            this.editor.off("nativecontextmenu", stop);
            if (e && e.domEvent)
                stopEvent(e.domEvent);
        }.bind(this);
        setTimeout(stop, 10);
        this.editor.on("nativecontextmenu", stop);
    }
    destroy() {
        if (this.releaseMouse) this.releaseMouse();
    }
}

defineOptions(MouseHandler.prototype, "mouseHandler", {
    scrollSpeed: {initialValue: 2},
    dragDelay: {initialValue: (isMac ? 150 : 0)},
    dragEnabled: {initialValue: true},
    focusTimeout: {initialValue: 0},
    tooltipFollowsMouse: {initialValue: true}
});