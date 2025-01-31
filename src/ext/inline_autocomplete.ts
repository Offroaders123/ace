import { HashHandler } from "../keyboard/hash_handler.js";
import { AceInline } from "../autocomplete/inline.js";
import { FilteredList } from "../autocomplete.js";
import { CompletionProvider } from "../autocomplete.js";
import { Editor } from "../editor.js";
import { getCompletionPrefix } from "../autocomplete/util.js";
import { importCssString } from "../lib/dom.js";
import { delayedCall } from "../lib/lang.js";
import { CommandBarTooltip } from "./command_bar.js";
import { BUTTON_CLASS_NAME } from "./command_bar.js";

import { snippetCompleter } from "./language_tools.js";
import { textCompleter } from "./language_tools.js";
import { keyWordCompleter } from "./language_tools.js";

var destroyCompleter = function(e, editor) {
    editor.completer && editor.completer.destroy();
};

/**
 * This class controls the inline-only autocompletion components and their lifecycle.
 * This is more lightweight than the popup-based autocompletion, as it can only work with exact prefix matches.
 * There is an inline ghost text renderer and an optional command bar tooltip inside.
 */
export class InlineAutocomplete {
    static for(editor) {
        if (editor.completer instanceof InlineAutocomplete) {
            return editor.completer;
        }
        if (editor.completer) {
            editor.completer.destroy();
            editor.completer = null;
        }
    
        editor.completer = new InlineAutocomplete(editor);
        editor.once("destroy", destroyCompleter);
        return editor.completer;
    };
    
    static startCommand = {
        name: "startInlineAutocomplete",
        exec: function(editor, options) {
            var completer = InlineAutocomplete.for(editor);
            completer.show(options);
        },
        bindKey: { win: "Alt-C", mac: "Option-C" }
    };

    commands = {
        "Previous": {
            bindKey: "Alt-[",
            name: "Previous",
            exec: function(editor) {
                editor.completer.goTo("prev");
            }
        },
        "Next": {
            bindKey: "Alt-]",
            name: "Next",
            exec: function(editor) {
                editor.completer.goTo("next");
            }
        },
        "Accept": {
            bindKey: { win: "Tab|Ctrl-Right", mac: "Tab|Cmd-Right" },
            name: "Accept",
            exec: function(editor) {
                return editor.completer.insertMatch();
            }
        },
        "Close": {
            bindKey: "Esc",
            name: "Close",
            exec: function(editor) {
                editor.completer.detach();
            }
        }
    };
    
    /**
     * Factory method to create a command bar tooltip for inline autocomplete.
     * 
     * @param {HTMLElement} parentEl  The parent element where the tooltip HTML elements will be added.
     * @returns {CommandBarTooltip}   The command bar tooltip for inline autocomplete
     */
    static createInlineTooltip(parentEl) {
        var inlineTooltip = new CommandBarTooltip(parentEl);
        inlineTooltip.registerCommand("Previous", 
            Object.assign({}, InlineAutocomplete.prototype.commands["Previous"], {
                enabled: true,
                type: "button",
                iconCssClass: "ace_arrow_rotated"
            })
        );
        inlineTooltip.registerCommand("Position", {
            enabled: false,
            getValue: function(editor) {
                return editor ? [editor.completer.getIndex() + 1, editor.completer.getLength()].join("/") : "";
            },
            type: "text",
            cssClass: "completion_position"
        });
        inlineTooltip.registerCommand("Next", 
            Object.assign({}, InlineAutocomplete.prototype.commands["Next"], {
                enabled: true,
                type: "button",
                iconCssClass: "ace_arrow"
            })
        );
        inlineTooltip.registerCommand("Accept", 
            Object.assign({}, InlineAutocomplete.prototype.commands["Accept"], {
                enabled: function(editor) {
                    return !!editor && editor.completer.getIndex() >= 0;
                },
                type: "button"
            })
        );
        inlineTooltip.registerCommand("ShowTooltip", {
            name: "Always Show Tooltip",
            exec: function() {
                inlineTooltip.setAlwaysShow(!inlineTooltip.getAlwaysShow());
            },
            enabled: true,
            getValue: function() {
                return inlineTooltip.getAlwaysShow();
            },
            type: "checkbox"
        });
        return inlineTooltip;
    };

    constructor(editor) {
        this.editor = editor;
        this.keyboardHandler = new HashHandler(this.commands);
        this.$index = -1;

        this.blurListener = this.blurListener.bind(this);
        this.changeListener = this.changeListener.bind(this);


        this.changeTimer = delayedCall(function() {
            this.updateCompletions();
        }.bind(this));
    }
    
    getInlineRenderer() {
        if (!this.inlineRenderer)
            this.inlineRenderer = new AceInline();
        return this.inlineRenderer;
    }

    getInlineTooltip() {
        if (!this.inlineTooltip) {
            this.inlineTooltip = InlineAutocomplete.createInlineTooltip(document.body || document.documentElement);
        }
        return this.inlineTooltip;
    }


    /**
     * This function is the entry point to the class. This triggers the gathering of the autocompletion and displaying the results;
     * @param {CompletionOptions} options
     */
    show(options) {
        this.activated = true;

        if (this.editor.completer !== this) {
            if (this.editor.completer)
                this.editor.completer.detach();
            this.editor.completer = this;
        }

        this.editor.on("changeSelection", this.changeListener);
        this.editor.on("blur", this.blurListener);

        this.updateCompletions(options);
    }

    $open() {
        if (this.editor.textInput.setAriaOptions) {
            this.editor.textInput.setAriaOptions({});
        }

        this.editor.keyBinding.addKeyboardHandler(this.keyboardHandler);
        this.getInlineTooltip().attach(this.editor);

        if (this.$index === -1) {
            this.setIndex(0);
        } else {
            this.$showCompletion();
        }
        
        this.changeTimer.cancel();
    }
    
    insertMatch() {
        var result = this.getCompletionProvider().insertByIndex(this.editor, this.$index);
        this.detach();
        return result;
    }

    changeListener(e) {
        var cursor = this.editor.selection.lead;
        if (cursor.row != this.base.row || cursor.column < this.base.column) {
            this.detach();
        }
        if (this.activated)
            this.changeTimer.schedule();
        else
            this.detach();
    }

    blurListener(e) {
        this.detach();
    }

    goTo(where) {
        if (!this.completions || !this.completions.filtered) {
            return;
        }
        var completionLength = this.completions.filtered.length;
        switch(where.toLowerCase()) {
            case "prev":
                this.setIndex((this.$index - 1 + completionLength) % completionLength);
                break;
            case "next":
                this.setIndex((this.$index + 1 + completionLength) % completionLength);
                break;
            case "first":
                this.setIndex(0);
                break;
            case "last":
                this.setIndex(this.completions.filtered.length - 1);
                break;
        }
    }

    getLength() {
        if (!this.completions || !this.completions.filtered) {
            return 0;
        }
        return this.completions.filtered.length;
    }

    getData(index) {
        if (index == undefined || index === null) {
            return this.completions.filtered[this.$index];
        } else {
            return this.completions.filtered[index];
        }
    }

    getIndex() {
        return this.$index;
    }

    isOpen() {
        return this.$index >= 0;
    }

    setIndex(value) {
        if (!this.completions || !this.completions.filtered) {
            return;
        }
        var newIndex = Math.max(-1, Math.min(this.completions.filtered.length - 1, value));
        if (newIndex !== this.$index) {
            this.$index = newIndex;
            this.$showCompletion();
        }
    }

    getCompletionProvider() {
        if (!this.completionProvider)
            this.completionProvider = new CompletionProvider();
        return this.completionProvider;
    }

    $showCompletion() {
        if (!this.getInlineRenderer().show(this.editor, this.completions.filtered[this.$index], this.completions.filterText)) {
            // Not able to show the completion, hide the previous one
            this.getInlineRenderer().hide();
        }
        if (this.inlineTooltip && this.inlineTooltip.isShown()) {
            this.inlineTooltip.update();
        }
    }

    $updatePrefix() {
        var pos = this.editor.getCursorPosition();
        var prefix = this.editor.session.getTextRange({start: this.base, end: pos});
        this.completions.setFilter(prefix);
        if (!this.completions.filtered.length)
            return this.detach();
        if (this.completions.filtered.length == 1
        && this.completions.filtered[0].value == prefix
        && !this.completions.filtered[0].snippet)
            return this.detach();
        this.$open(this.editor, prefix);
        return prefix;
    }

    updateCompletions(options) {
        var prefix = "";
        
        if (options && options.matches) {
            var pos = this.editor.getSelectionRange().start;
            this.base = this.editor.session.doc.createAnchor(pos.row, pos.column);
            this.base.$insertRight = true;
            this.completions = new FilteredList(options.matches);
            return this.$open(this.editor, "");
        }

        if (this.base && this.completions) {
            prefix = this.$updatePrefix();
        }

        var session = this.editor.getSession();
        var pos = this.editor.getCursorPosition();
        var prefix = getCompletionPrefix(this.editor);
        this.base = session.doc.createAnchor(pos.row, pos.column - prefix.length);
        this.base.$insertRight = true;
        var options = {
            exactMatch: true,
            ignoreCaption: true
        };
        this.getCompletionProvider().provideCompletions(this.editor, options, function(err, completions, finished) {
            var filtered = completions.filtered;
            var prefix = getCompletionPrefix(this.editor);

            if (finished) {
                // No results
                if (!filtered.length)
                    return this.detach();

                // One result equals to the prefix
                if (filtered.length == 1 && filtered[0].value == prefix && !filtered[0].snippet)
                    return this.detach();
            }
            this.completions = completions;
            this.$open(this.editor, prefix);
        }.bind(this));
    }

    detach() {
        if (this.editor) {
            this.editor.keyBinding.removeKeyboardHandler(this.keyboardHandler);
            this.editor.off("changeSelection", this.changeListener);
            this.editor.off("blur", this.blurListener);
        }
        this.changeTimer.cancel();
        if (this.inlineTooltip) {
            this.inlineTooltip.detach();
        }
        
        this.setIndex(-1);

        if (this.completionProvider) {
            this.completionProvider.detach();
        }

        if (this.inlineRenderer && this.inlineRenderer.isOpen()) {
            this.inlineRenderer.hide();
        }

        if (this.base)
            this.base.detach();
        this.activated = false;
        this.completionProvider = this.completions = this.base = null;
    }

    destroy() {
        this.detach();
        if (this.inlineRenderer)
            this.inlineRenderer.destroy();
        if (this.inlineTooltip)
            this.inlineTooltip.destroy();
        if (this.editor && this.editor.completer == this) {
            this.editor.off("destroy", destroyCompleter);
            this.editor.completer = null;
        }
        this.inlineTooltip = this.editor = this.inlineRenderer = null;
    }

}

var completers = [snippetCompleter, textCompleter, keyWordCompleter];

require("../config").defineOptions(Editor.prototype, "editor", {
    enableInlineAutocompletion: {
        set: function(val) {
            if (val) {
                if (!this.completers)
                    this.completers = Array.isArray(val)? val : completers;
                this.commands.addCommand(InlineAutocomplete.startCommand);
            } else {
                this.commands.removeCommand(InlineAutocomplete.startCommand);
            }
        },
        value: false
    }
});

importCssString(`

.ace_icon_svg.ace_arrow,
.ace_icon_svg.ace_arrow_rotated {
    -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBmaWxsLXJ1bGU9ImV2ZW5vZGQiIGNsaXAtcnVsZT0iZXZlbm9kZCIgZD0iTTUuODM3MDEgMTVMNC41ODc1MSAxMy43MTU1TDEwLjE0NjggOEw0LjU4NzUxIDIuMjg0NDZMNS44MzcwMSAxTDEyLjY0NjUgOEw1LjgzNzAxIDE1WiIgZmlsbD0iYmxhY2siLz48L3N2Zz4=");
}

.ace_icon_svg.ace_arrow_rotated {
    transform: rotate(180deg);
}

div.${BUTTON_CLASS_NAME}.completion_position {
    padding: 0;
}
`, "inlineautocomplete.css", false);