// Copyright 2014 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

var fs            = require("fs")
var expect        = require("chai").expect
var jsonStringify = require("json-stringify-pretty-compact")

var parse = require("../").parse

function read(file) {
  return fs.readFileSync("test/" + file).toString()
}

function write(file, string) {
  return fs.writeFileSync("test/" + file, string)
}

function eachFixture(callback) {
  fs.readdirSync("test/fixtures").forEach(function(file) {
    if (file[0] === ".") return
    var fixture = read("fixtures/" + file).replace(/\|$/gm, "")
    var actual  = parse(fixture)
    callback(actual, "expected/" + file + ".json", file)
  })
}

if (require.main === module) {
  eachFixture(function(actual, expectedPath) {
    write(expectedPath, jsonStringify(actual))
  })
  process.exit(0)
}

suite("parser", function() {

  eachFixture(function(actual, expectedPath, file) {
    test(file, function() {
      expect(actual).to.eql(JSON.parse(read(expectedPath)))
    })
  })


  suite("options", function() {

    test("commentChar", function() {
      expect(parse('# command').commands)
        .to.have.length(0)
      expect(parse('" command', {commentChar: '"'}).commands)
        .to.have.length(0)
      expect(parse("command").commands)
        .to.have.length(1)
      expect(parse("command", {commentChar: "c"}).commands)
        .to.have.length(0)
    })


    test("no comments", function() {
      expect(parse("#command", {commentChar: ""}).commands)
        .to.have.length(1)
    })


    test("continuationChar", function() {
      expect(parse("command\n|bar", {continuationChar: "|"}).commands[0].value)
        .to.equal("\nbar")
    })


    test("no continuations", function() {
      expect(parse("command\n\\command", {continuationChar: ""}).commands)
        .to.have.length(2)
    })

  })


  suite("whitespace", function() {

    test("newlines", function() {
      ;["\n", "\r\n", "\r", "\f", "\v"].forEach(function(newline) {
        expect(parse(["a", "b", "", "c"].join(newline)).commands)
          .to.have.length(3)
        // Values always use \n for simplicity.
        expect(parse(["command foo", "\\bar"].join(newline)).commands[0].value)
          .to.equal("foo\nbar")
      })
    })


    test("non-breaking spaces in indents", function() {
      var string = [
        "command",
        "  sub",
        "\u00a0\u00a0sub"
      ].join("\n")
      expect(parse(string)).to.deep.equal({
        "commands": [
          {
            "name": "command",
            "value": "",
            "lines": [[1, 8, 0]],
            "line": 1,
            "column": 1,
            "endLine": 3,
            "subCommands": [
              {
                "name": "sub",
                "value": "",
                "lines": [[2, 6, 0]],
                "line": 2,
                "column": 3,
                "endLine": 2,
                "subCommands": []
              },
              {
                "name": "sub",
                "value": "",
                "lines": [[3, 6, 0]],
                "line": 3,
                "column": 3,
                "endLine": 3,
                "subCommands": []
              }
            ]
          }
        ],
        "errors": []
      })
    })


    test("space/tab after continuation char", function() {
      var testChar = function(char, expected) {
        var string = [
          "command",
          "\\" + char + char + "foo"
        ].join("\n")
        expect(parse(string).commands[0].value.slice(1))
          .to.equal(expected)
      }

      // If you put a tab after the continuation char, you know what you’re
      // doing. You _want_ it there.
      testChar("\t", "\t\tfoo")
      // Any type of space should be stripped.
      testChar(" ", " foo")
      testChar("\u00a0", "\u00a0foo")
    })

  })

})
