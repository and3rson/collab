// The bindings defined specifically in the Sublime Text mode
var bindings = {
  "Alt-Left": "goSubwordLeft",
  "Alt-Right": "goSubwordRight",
  "Ctrl-Up": "scrollLineUp",
  "Ctrl-Down": "scrollLineDown",
  "Shift-Ctrl-L": "splitSelectionByLine",
  "Shift-Tab": "indentLess",
  "Esc": "singleSelectionTop",
  "Ctrl-L": "selectLine",
  "Shift-Ctrl-K": "deleteLine",
  "Ctrl-Enter": "insertLineAfter",
  "Shift-Ctrl-Enter": "insertLineBefore",
  "Ctrl-D": "selectNextOccurrence",
  "Shift-Ctrl-Space": "selectScope",
  "Shift-Ctrl-M": "selectBetweenBrackets",
  "Ctrl-M": "goToBracket",
  "Shift-Ctrl-Up": "swapLineUp",
  "Shift-Ctrl-Down": "swapLineDown",
  "Ctrl-/": "toggleCommentIndented",
  "Ctrl-J": "joinLines",
  "Shift-Ctrl-D": "duplicateLine",
  "Ctrl-T": "transposeChars",
  "F9": "sortLines",
  "Ctrl-F9": "sortLinesInsensitive",
  "F2": "nextBookmark",
  "Shift-F2": "prevBookmark",
  "Ctrl-F2": "toggleBookmark",
  "Shift-Ctrl-F2": "clearBookmarks",
  "Alt-F2": "selectBookmarks",
  "Alt-Q": "wrapLines",
  "Ctrl-K Ctrl-Backspace": "delLineLeft",
  "Backspace": "smartBackspace",
  "Ctrl-K Ctrl-K": "delLineRight",
  "Ctrl-K Ctrl-U": "upcaseAtCursor",
  "Ctrl-K Ctrl-L": "downcaseAtCursor",
  "Ctrl-K Ctrl-Space": "setSublimeMark",
  "Ctrl-K Ctrl-A": "selectToSublimeMark",
  "Ctrl-K Ctrl-W": "deleteToSublimeMark",
  "Ctrl-K Ctrl-X": "swapWithSublimeMark",
  "Ctrl-K Ctrl-Y": "sublimeYank",
  "Ctrl-K Ctrl-G": "clearBookmarks",
  "Ctrl-K Ctrl-C": "showInCenter",
  "Shift-Alt-Up": "selectLinesUpward",
  "Shift-Alt-Down": "selectLinesDownward",
  "Ctrl-F3": "findUnder",
  "Shift-Ctrl-F3": "findUnderPrevious",
  "Shift-Ctrl-[": "fold",
  "Shift-Ctrl-]": "unfold",
  "Ctrl-K Ctrl-j": "unfoldAll",
  "Ctrl-K Ctrl-0": "unfoldAll",
  "Ctrl-H": "replace",
}

// The implementation of joinLines
function joinLines(cm) {
"use strict";

  var ranges = cm.listSelections(), joined = [];
  for (var i = 0; i < ranges.length; i++) {
    var range = ranges[i], from = range.from();
    var start = from.line, end = range.to().line;
    while (i < ranges.length - 1 && ranges[i + 1].from().line == end)
      end = ranges[++i].to().line;
    joined.push({start: start, end: end, anchor: !range.empty() && from});
  }
  cm.operation(function() {
    var offset = 0, ranges = [];
    for (var i = 0; i < joined.length; i++) {
      var obj = joined[i];
      var anchor = obj.anchor && Pos(obj.anchor.line - offset, obj.anchor.ch), head;
      for (var line = obj.start; line <= obj.end; line++) {
        var actual = line - offset;
        if (line == obj.end) head = Pos(actual, cm.getLine(actual).length + 1);
        if (actual < cm.lastLine()) {
          cm.replaceRange(" ", Pos(actual), Pos(actual + 1, /^\s*/.exec(cm.getLine(actual + 1))[0].length));
          ++offset;
        }
      }
      ranges.push({anchor: anchor || head, head: head});
    }
    cm.setSelections(ranges, 0);
  });
}
