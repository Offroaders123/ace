import { implement } from "./lib/oop.js";
import { EventEmitter } from "./lib/event_emitter.js";


/**
 * Tokenizes the current [[Document `Document`]] in the background, and caches the tokenized rows for future use. 
 * 
 * If a certain row is changed, everything below that row is re-tokenized.
 **/
export class BackgroundTokenizer {
    
    /**
     * Creates a new `BackgroundTokenizer` object.
     * @param {Tokenizer} tokenizer The tokenizer to use
     * @param {Editor} editor The editor to associate with
     **/
    constructor(tokenizer, editor) {
        this.running = false;
        this.lines = [];
        this.states = [];
        this.currentLine = 0;
        this.tokenizer = tokenizer;

        var self = this;

        this.$worker = function() {
            if (!self.running) { return; }

            var workerStart = new Date();
            var currentLine = self.currentLine;
            var endLine = -1;
            var doc = self.doc;

            var startLine = currentLine;
            while (self.lines[currentLine])
                currentLine++;

            var len = doc.getLength();
            var processedLines = 0;
            self.running = false;
            while (currentLine < len) {
                self.$tokenizeRow(currentLine);
                endLine = currentLine;
                do {
                    currentLine++;
                } while (self.lines[currentLine]);

                // only check every 5 lines
                processedLines ++;
                if ((processedLines % 5 === 0) && (new Date() - workerStart) > 20) {
                    self.running = setTimeout(self.$worker, 20);
                    break;
                }
            }
            self.currentLine = currentLine;

            if (endLine == -1)
                endLine = currentLine;

            if (startLine <= endLine)
                self.fireUpdateEvent(startLine, endLine);
        };
    }
    
    /**
     * Sets a new tokenizer for this object.
     * @param {Tokenizer} tokenizer The new tokenizer to use
     **/
    setTokenizer(tokenizer) {
        this.tokenizer = tokenizer;
        this.lines = [];
        this.states = [];

        this.start(0);
    }

    /**
     * Sets a new document to associate with this object.
     * @param {Document} doc The new document to associate with
     **/
    setDocument(doc) {
        this.doc = doc;
        this.lines = [];
        this.states = [];

        this.stop();
    }

     /**
     * Fires whenever the background tokeniziers between a range of rows are going to be updated.
     * 
     * @event update
     * @param {Object} e An object containing two properties, `first` and `last`, which indicate the rows of the region being updated.
     *
     **/
    /**
     * Emits the `'update'` event. `firstRow` and `lastRow` are used to define the boundaries of the region to be updated.
     * @param {Number} firstRow The starting row region
     * @param {Number} lastRow The final row region
     **/
    fireUpdateEvent(firstRow, lastRow) {
        var data = {
            first: firstRow,
            last: lastRow
        };
        this._signal("update", {data: data});
    }

    /**
     * Starts tokenizing at the row indicated.
     * @param {Number} startRow The row to start at
     **/
    start(startRow) {
        this.currentLine = Math.min(startRow || 0, this.currentLine, this.doc.getLength());

        // remove all cached items below this line
        this.lines.splice(this.currentLine, this.lines.length);
        this.states.splice(this.currentLine, this.states.length);

        this.stop();
        // pretty long delay to prevent the tokenizer from interfering with the user
        this.running = setTimeout(this.$worker, 700);
    }

    /**
     * Sets pretty long delay to prevent the tokenizer from interfering with the user
     */
    scheduleStart() {
        if (!this.running)
            this.running = setTimeout(this.$worker, 700);
    }

    $updateOnChange(delta) {
        var startRow = delta.start.row;
        var len = delta.end.row - startRow;

        if (len === 0) {
            this.lines[startRow] = null;
        } else if (delta.action == "remove") {
            this.lines.splice(startRow, len + 1, null);
            this.states.splice(startRow, len + 1, null);
        } else {
            var args = Array(len + 1);
            args.unshift(startRow, 1);
            this.lines.splice.apply(this.lines, args);
            this.states.splice.apply(this.states, args);
        }

        this.currentLine = Math.min(startRow, this.currentLine, this.doc.getLength());

        this.stop();
    }

    /**
     * Stops tokenizing.
     **/
    stop() {
        if (this.running)
            clearTimeout(this.running);
        this.running = false;
    }

    /**
     * Gives list of [[Token]]'s of the row. (tokens are cached)
     * @param {Number} row The row to get tokens at
     * @returns {Token[]}
     **/
    getTokens(row) {
        return this.lines[row] || this.$tokenizeRow(row);
    }

    /**
     * Returns the state of tokenization at the end of a row.
     * @param {Number} row The row to get state at
     * @returns {string}
     **/
    getState(row) {
        if (this.currentLine == row)
            this.$tokenizeRow(row);
        return this.states[row] || "start";
    }

    $tokenizeRow(row) {
        var line = this.doc.getLine(row);
        var state = this.states[row - 1];

        var data = this.tokenizer.getLineTokens(line, state, row);

        if (this.states[row] + "" !== data.state + "") {
            this.states[row] = data.state;
            this.lines[row + 1] = null;
            if (this.currentLine > row + 1)
                this.currentLine = row + 1;
        } else if (this.currentLine == row) {
            this.currentLine = row + 1;
        }

        return this.lines[row] = data.tokens;
    }

    cleanup() {
        this.running = false;
        this.lines = [];
        this.states = [];
        this.currentLine = 0;
        this.removeAllListeners();
    }

}

implement(BackgroundTokenizer.prototype, EventEmitter);