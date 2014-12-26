// Copyright 2014 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

var tokenize = require("./lib/tokenizer")
var parse    = require("./lib/parser")

exports.parse = function(string, options) {
  var tokenResult = tokenize(string, options)
  var parseResult = parse(tokenResult.tokens)
  return {
    commands: parseResult.commands,
    errors:   parseResult.errors.concat(tokenResult.errors)
  }
}

exports.translateLineColumn = function(command, line, column) {
  var lineInfo = command.lines[line - 1]
  if (!lineInfo) {
    throw new RangeError("Line out of range: " + line)
  }
  var lineLength = lineInfo[2]
  if (column < 1 || column > lineLength + 1) {
    throw new RangeError("Column out of range: " + column)
  }
  return {
    line:   lineInfo[0],
    column: lineInfo[1] + column - 1
  }
}

exports.translateIndex = function(command, index) {
  var originalIndex = index
  if (index >= 0) {
    var length = command.lines.length
    for (var lineNum = 0; lineNum < length; lineNum++) {
      var lineInfo   = command.lines[lineNum]
      var lineLength = lineInfo[2]
      if (index <= lineLength) {
        return {
          line:   lineInfo[0],
          column: lineInfo[1] + index
        }
      }
      index -= lineLength + 1
    }
  }
  throw new RangeError("Index out of range: " + originalIndex)
}
