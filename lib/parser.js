// Copyright 2014 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

var dummyCommandTokens = [
  {type: "command-name", text: null, line: null, column: null},
  {type: "value",        text: "",   line: null, column: null}
]

function parse(tokens) {
  var errors = []
  var commands = parseCommands(dummyCommandTokens.concat(tokens), 0).commands
  var dummyCommand = commands.shift()

  if (dummyCommand.value.length > 0 || dummyCommand.subCommands.length > 0) {
    errors.push({
      id:      "missing-command-name-line",
      line:    1,
      column:  1,
      command: dummyCommand
    })
  }

  return {
    commands: commands,
    errors:   errors
  }
}

function parseCommands(tokens, index) {
  var commands = []
  var endLine

  while (index < tokens.length) {
    var commandNameToken = tokens[index++]
    var valueToken       = tokens[index++]

    var continuations = []
    while (index < tokens.length && tokens[index].type === "continuation") {
      continuations.push(tokens[index++])
    }

    var valueTokens = [valueToken].concat(continuations)

    var command = {
      name:  commandNameToken.text,
      value: valueTokens.map(function(token) { return token.text }).join("\n"),
      lines: valueTokens.map(function(token) {
        return [token.line, token.column, token.text.length]
      }),
      line:    commandNameToken.line,
      column:  commandNameToken.column,
      endLine: endLine = valueTokens[valueTokens.length - 1].line,
      subCommands: []
    }

    var indentToken = tokens[index]
    if (indentToken && indentToken.type === "indent") {
      var result = parseCommands(tokens, index + 1)
      if (result.commands.length > 0) {
        command.subCommands = result.commands
        command.endLine = endLine = result.endLine
      }
      index = result.index
    }

    if (!commandNameToken.error) {
      commands.push(command)
    }

    var dedentToken = tokens[index]
    if (dedentToken && dedentToken.type === "dedent") {
      index++
      break
    }
  }

  return {
    commands: commands,
    index:    index,
    endLine:  endLine
  }
}

module.exports = parse
