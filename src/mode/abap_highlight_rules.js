/*
 * based on
 * " Vim ABAP syntax file
 * "    Language: SAP - ABAP/R4
 * "    Revision: 2.1
 * "  Maintainer: Marius Piedallu van Wyk <lailoken@gmail.com>
 * " Last Change: 2012 Oct 23
 */

import { inherits } from "../lib/oop.js";
import { TextHighlightRules } from "./text_highlight_rules.js";

export class AbapHighlightRules {
    constructor() {

    var keywordMapper = this.createKeywordMapper({
        "variable.language": "this",
        "keyword": 
            "ADD ALIAS ALIASES ASCENDING ASSERT ASSIGN ASSIGNING AT BACK" +
            " CALL CASE CATCH CHECK CLASS CLEAR CLOSE CNT COLLECT COMMIT COMMUNICATION COMPUTE CONCATENATE CONDENSE CONSTANTS CONTINUE CONTROLS CONVERT CREATE CURRENCY" +
            " DATA DEFINE DEFINITION DEFERRED DELETE DESCENDING DESCRIBE DETAIL DIVIDE DO" +
            " ELSE ELSEIF ENDAT ENDCASE ENDCLASS ENDDO ENDEXEC ENDFORM ENDFUNCTION ENDIF ENDIFEND ENDINTERFACE ENDLOOP ENDMETHOD ENDMODULE ENDON ENDPROVIDE ENDSELECT ENDTRY ENDWHILE EVENT EVENTS EXEC EXIT EXPORT EXPORTING EXTRACT" +
            " FETCH FIELDS FORM FORMAT FREE FROM FUNCTION" +
            " GENERATE GET" +
            " HIDE" +
            " IF IMPORT IMPORTING INDEX INFOTYPES INITIALIZATION INTERFACE INTERFACES INPUT INSERT IMPLEMENTATION" +
            " LEAVE LIKE LINE LOAD LOCAL LOOP" +
            " MESSAGE METHOD METHODS MODIFY MODULE MOVE MULTIPLY" +
            " ON OVERLAY OPTIONAL OTHERS" +
            " PACK PARAMETERS PERFORM POSITION PROGRAM PROVIDE PUT" +
            " RAISE RANGES READ RECEIVE RECEIVING REDEFINITION REFERENCE REFRESH REJECT REPLACE REPORT RESERVE RESTORE RETURN RETURNING ROLLBACK" +
            " SCAN SCROLL SEARCH SELECT SET SHIFT SKIP SORT SORTED SPLIT STANDARD STATICS STEP STOP SUBMIT SUBTRACT SUM SUMMARY SUPPRESS" +
            " TABLES TIMES TRANSFER TRANSLATE TRY TYPE TYPES" +
            " UNASSIGN ULINE UNPACK UPDATE" +
            " WHEN WHILE WINDOW WRITE" +
            " OCCURS STRUCTURE OBJECT PROPERTY" +
            " CASTING APPEND RAISING VALUE COLOR" +
            " CHANGING EXCEPTION EXCEPTIONS DEFAULT CHECKBOX COMMENT" +
            " ID NUMBER FOR TITLE OUTPUT" +
            " WITH EXIT USING" +
            " INTO WHERE GROUP BY HAVING ORDER BY SINGLE" +
            " APPENDING CORRESPONDING FIELDS OF TABLE" +
            " LEFT RIGHT OUTER INNER JOIN AS CLIENT SPECIFIED BYPASSING BUFFER UP TO ROWS CONNECTING" +
            " EQ NE LT LE GT GE NOT AND OR XOR IN LIKE BETWEEN",
        "constant.language": 
            "TRUE FALSE NULL SPACE",
        "support.type": 
            "c n i p f d t x string xstring decfloat16 decfloat34",
        "keyword.operator":
            "abs sign ceil floor trunc frac acos asin atan cos sin tan" +
            " abapOperator cosh sinh tanh exp log log10 sqrt" +
            " strlen xstrlen charlen numofchar dbmaxlen lines" 
    }, "text", true, " ");

    var compoundKeywords = "WITH\\W+(?:HEADER\\W+LINE|FRAME|KEY)|NO\\W+STANDARD\\W+PAGE\\W+HEADING|"+
        "EXIT\\W+FROM\\W+STEP\\W+LOOP|BEGIN\\W+OF\\W+(?:BLOCK|LINE)|BEGIN\\W+OF|"+
        "END\\W+OF\\W+(?:BLOCK|LINE)|END\\W+OF|NO\\W+INTERVALS|"+
        "RESPECTING\\W+BLANKS|SEPARATED\\W+BY|USING\\W+(?:EDIT\\W+MASK)|"+
        "WHERE\\W+(?:LINE)|RADIOBUTTON\\W+GROUP|REF\\W+TO|"+
        "(?:PUBLIC|PRIVATE|PROTECTED)(?:\\W+SECTION)?|DELETING\\W+(?:TRAILING|LEADING)"+
        "(?:ALL\\W+OCCURRENCES)|(?:FIRST|LAST)\\W+OCCURRENCE|INHERITING\\W+FROM|"+
        "LINE-COUNT|ADD-CORRESPONDING|AUTHORITY-CHECK|BREAK-POINT|CLASS-DATA|CLASS-METHODS|"+
        "CLASS-METHOD|DIVIDE-CORRESPONDING|EDITOR-CALL|END-OF-DEFINITION|END-OF-PAGE|END-OF-SELECTION|"+
        "FIELD-GROUPS|FIELD-SYMBOLS|FUNCTION-POOL|MOVE-CORRESPONDING|MULTIPLY-CORRESPONDING|NEW-LINE|"+
        "NEW-PAGE|NEW-SECTION|PRINT-CONTROL|RP-PROVIDE-FROM-LAST|SELECT-OPTIONS|SELECTION-SCREEN|"+
        "START-OF-SELECTION|SUBTRACT-CORRESPONDING|SYNTAX-CHECK|SYNTAX-TRACE|TOP-OF-PAGE|TYPE-POOL|"+
        "TYPE-POOLS|LINE-SIZE|LINE-COUNT|MESSAGE-ID|DISPLAY-MODE|READ(?:-ONLY)?|"+
        "IS\\W+(?:NOT\\W+)?(?:ASSIGNED|BOUND|INITIAL|SUPPLIED)";
     
    this.$rules = {
        "start" : [
            {token : "string", regex : "`", next  : "string"},
            {token : "string", regex : "'", next  : "qstring"},
            {token : "doc.comment", regex : /^\*.+/},
            {token : "comment",  regex : /".+$/},
            {token : "invalid", regex: "\\.{2,}"},
            {token : "keyword.operator", regex: /\W[\-+%=<>*]\W|\*\*|[~:,\.&$]|->*?|=>/},
            {token : "paren.lparen", regex : "[\\[({]"},
            {token : "paren.rparen", regex : "[\\])}]"},
            {token : "constant.numeric", regex: "[+-]?\\d+\\b"},
            {token : "variable.parameter", regex : /sy|pa?\d\d\d\d\|t\d\d\d\.|innnn/}, 
            {token : "keyword", regex : compoundKeywords}, 
            {token : "variable.parameter", regex : /\w+-\w[\-\w]*/},
            {token : keywordMapper, regex : "\\b\\w+\\b"},
            {caseInsensitive: true}
        ],
        "qstring" : [
            {token : "constant.language.escape",   regex : "''"},
            {token : "string", regex : "'",     next  : "start"},
            {defaultToken : "string"}
        ],
        "string" : [
            {token : "constant.language.escape",   regex : "``"},
            {token : "string", regex : "`",     next  : "start"},
            {defaultToken : "string"}
        ]
    };
}
};
inherits(AbapHighlightRules, TextHighlightRules);