import { inherits } from "../lib/oop.js";
import { Mode as TextMode } from "./text.js";
import { AdaHighlightRules } from "./ada_highlight_rules.js";
import { Range } from "../range.js";

export class Mode {
    constructor() {
    this.HighlightRules = AdaHighlightRules;
    this.$behaviour = this.$defaultBehaviour;
    }
}
inherits(Mode, TextMode);

(function() {

    this.lineCommentStart = "--";

    this.getNextLineIndent = function(state, line, tab) {
        var indent = this.$getIndent(line);

        var tokenizedLine = this.getTokenizer().getLineTokens(line, state);
        var tokens = tokenizedLine.tokens;

        if (tokens.length && tokens[tokens.length-1].type == "comment") {
            return indent;
        }

        //  Indent when line ends with one of the following keywords
        if (state == "start") {
            var match = line.match(/^.*(begin|loop|then|is|do)\s*$/);
            if (match) {
                indent += tab;
            }
        }

        return indent;
    };

    this.checkOutdent = function(state, line, input) {
        var complete_line = line + input;

        // Outdent when the current line contains begin or end, and nothing
        // else. This ensures that we'll send the signal only once.
        if (complete_line.match(/^\s*(begin|end)$/)) {
            return true;
        }

        return false;
    };

    this.autoOutdent = function(state, session, row) {

        var line = session.getLine(row);
        var prevLine = session.getLine(row - 1);
        var prevIndent = this.$getIndent(prevLine).length;
        var indent = this.$getIndent(line).length;

        // Don't outdent if current line is at the same level as the last one,
        // it means that the user outdented himself
        if (indent <= prevIndent) {
            return;
        }

        session.outdentRows(new Range(row, 0, row + 2, 0));
    };


    this.$id = "ace/mode/ada";
}).call(Mode.prototype);