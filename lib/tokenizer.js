// Copyright 2014 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

function get(options, name, defaultValue) {
  return (name in options ? options[name] : defaultValue)
}

function whitespaceType(char) {
  return (char === "\t" ? "tab" : "space")
}

var newline           = /\r\n|[\r\n\f\v]/
var space             = /[^\S\t\r\n\f\v]/
var tab               = /\t/
var leadingWhitespace = /^\s*/
var commandNameLine   = /^(\S+)(\s*)(.*)$/

function tokenize(string, options) {
  var getOption = get.bind(null, options || {})
  var tokens = []
  var errors = []
  var lines  = string.split(newline)
  var indentType
  var indentStack = [0]
  var commentChar      = getOption("commentChar", "#")
  var continuationChar = getOption("continuationChar", "\\")

  for (var index = 0; index < lines.length; index++) {
    var line = lines[index]
    var indent = line.match(leadingWhitespace)[0]
    var indentLength = indent.length
    var rest = line.slice(indentLength)
    var lineNum = index + 1

    // Skip blank lines and comments.
    if (rest === "" || rest[0] === commentChar) {
      continue
    }

    // Continuations.
    if (rest[0] === continuationChar) {
      var pre = (space.test(rest[1]) ? 2 : 1)
      tokens.push({
        type:   "continuation",
        text:   rest.slice(pre),
        line:   lineNum,
        column: indentLength + pre + 1
      })
      continue
    }

    // Command name lines.

    var errorId = null

    if (space.test(indent) && tab.test(indent)) {
      errorId = "indent-mixed-space-tab-line"
    } else if (
      indentType && indentLength > 0 && whitespaceType(indent[0]) !== indentType
    ) {
      errorId = "indent-mixed-space-tab-block"
    } else if (indentLength > indentStack[indentStack.length - 1]) {
      indentStack.push(indentLength)
      tokens.push({type: "indent"})
      indentType = whitespaceType(indent[0])
    } else if (indentStack.indexOf(indentLength) === -1) {
      errorId = "indent-ambigous-length"
    } else while (indentLength < indentStack[indentStack.length - 1]) {
      indentStack.pop()
      tokens.push({type: "dedent"})
    }

    if (errorId) {
      errors.push({
        id:     errorId,
        line:   lineNum,
        column: 1
      })
    }

    if (indentStack.length === 1) {
      indentType = undefined
    }

    var match   = rest.match(commandNameLine)
    var name    = match[1]
    var spacing = match[2]
    var value   = match[3]

    tokens.push({
      type:   "command-name",
      text:   name,
      line:   lineNum,
      column: indentLength + 1,
      error:  Boolean(errorId)
    })

    tokens.push({
      type:   "value",
      text:   value,
      line:   lineNum,
      column: indentLength + name.length + spacing.length + 1
    })
  }

  return {
    tokens: tokens,
    errors: errors
  }
}

module.exports = tokenize
