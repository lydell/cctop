// Copyright 2014 Simon Lydell
// X11 (“MIT”) Licensed. (See LICENSE.)

var expect = require("chai").expect

var cctop               = require("../")
var parse               = cctop.parse
var translateLineColumn = cctop.translateLineColumn
var translateIndex      = cctop.translateIndex


var string = [
  "# comment",
  "command   line 1",
  "  \\ line 2",
  "  \\ line 3",
  "  \\line 4",
  "\\   line 5",
].join("\n")

var command = parse(string).commands[0]
var valueLessCommand = parse("command").commands[0]


suite("translateLineColumn", function() {

  test("is a function", function() {
    expect(translateLineColumn).to.be.a("function")
  })


  test("simple cases", function() {
    var testPos = function(from, to) {
      expect(translateLineColumn(command, from[0], from[1]))
        .to.deep.equal({line: to[0], column: to[1]})
    }

    testPos([1, 1], [2, 11])
    testPos([1, 7], [2, 17])
    testPos([2, 1], [3,  5])
    testPos([2, 7], [3, 11])
    testPos([3, 3], [4,  7])
    testPos([4, 1], [5,  4])
    testPos([4, 7], [5, 10])
    testPos([5, 1], [6,  3])
    testPos([5, 9], [6, 11])
  })


  test("value-less command", function() {
    expect(translateLineColumn(valueLessCommand, 1, 1))
      .to.deep.equal({line: 1, column: 8})
  })


  test("line out of range", function() {
    var testLine = function(line) {
      expect(translateLineColumn.bind(null, command, line, 1))
        .to.throw(RangeError, String(line))
    }

    testLine(-1)
    testLine( 0)
    testLine( 6)
  })


  test("column out of range", function() {
    var testColumn = function(from) {
      expect(translateLineColumn.bind(null, command, from[0], from[1]))
        .to.throw(RangeError, String(from[1]))
    }

    testColumn([1, -1])
    testColumn([1,  0])
    testColumn([1,  8])
    testColumn([5, 10])
  })


})


suite("translateIndex", function() {

  test("is a function", function() {
    expect(translateIndex).to.be.a("function")
  })


  test("simple cases", function() {
    var testIndex = function(index, to) {
      expect(translateIndex(command, index))
        .to.deep.equal({line: to[0], column: to[1]})
    }
    var value = command.value

    testIndex(0, [2, 11])
    testIndex(5, [2, 16])
    testIndex(value.indexOf(      "\n"), [2, 17])
    testIndex(value.indexOf(  "line 2"), [3,  5])
    testIndex(value.indexOf(       "2"), [3, 10])
    testIndex(value.indexOf(    "ne 3"), [4,  7])
    testIndex(value.indexOf(  "line 4"), [5,  4])
    testIndex(value.indexOf(       "4"), [5,  9])
    testIndex(value.indexOf("  line 5"), [6,  3])
    testIndex(value.lastIndexOf(  "\n"), [5, 10])
    testIndex(value.length             , [6, 11])
  })


  test("value-less command", function() {
    expect(translateIndex(valueLessCommand, 0))
      .to.deep.equal({line: 1, column: 8})
  })


  test("index out of range", function() {
    var testIndex = function(index) {
      expect(translateIndex.bind(null, command, index))
        .to.throw(RangeError, String(index))
    }

    testIndex(-1)
    testIndex(command.value.length + 1)
  })

})
