import { createElement } from "../lib/dom.js";
import { delayedCall } from "../lib/lang.js";

/** simple statusbar **/
export class StatusBar{
    constructor(editor, parentNode) {
        this.element = createElement("div");
        this.element.className = "ace_status-indicator";
        this.element.style.cssText = "display: inline-block;";
        parentNode.appendChild(this.element);

        var statusUpdate = delayedCall(function(){
            this.updateStatus(editor);
        }.bind(this)).schedule.bind(null, 100);

        editor.on("changeStatus", statusUpdate);
        editor.on("changeSelection", statusUpdate);
        editor.on("keyboardActivity", statusUpdate);
    }
    
    updateStatus(editor) {
        var status = [];
        function add(str, separator) {
            str && status.push(str, separator || "|");
        }

        add(editor.keyBinding.getStatusText(editor));
        if (editor.commands.recording)
            add("REC");
        
        var sel = editor.selection;
        var c = sel.lead;
        
        if (!sel.isEmpty()) {
            var r = editor.getSelectionRange();
            add("(" + (r.end.row - r.start.row) + ":"  +(r.end.column - r.start.column) + ")", " ");
        }
        add(c.row + ":" + c.column, " ");        
        if (sel.rangeCount)
            add("[" + sel.rangeCount + "]", " ");
        status.pop();
        this.element.textContent = status.join("");
    }
}