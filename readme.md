Overview [![Build Status](https://travis-ci.org/lydell/cctop.svg?branch=master)](https://travis-ci.org/lydell/cctop)
========

cctop is a Plain Ol’ Text Configuration Cyntax as cool as [ZZ Top]. (At least
last time I checked abbreviations were backwards and “cyntax” wasn’t spelled
with an “s”. That’s as true as Frank Beard’s beard is long.)

cctop also describes its TOP-level cyntax: Commands and Comments. That’s all
there is to it. Commands and comments.

[ZZ Top]: http://en.wikipedia.org/wiki/ZZ_Top


Design Goals
============

- Super simple.
- Fault tolerant. Use everything that is valid and report the rest.
- Excellent error reporting.
- Being able to safely append lines to a syntactically invalid file.


Syntax: Commands and comments
=============================

cctop’s syntax is line based.

Lines beginning with a configurable comment character (such as `"`, `#` or `;`)
are comments and are ignored entirely. They may be indented if you like;
indentation does not matter for continuation lines. Note that comments may only
appear on lines of their own (not at the end of some other line).

Blank lines (consisting of whitespace only) are ignored too.

All other lines belong to _commands._

Commands start with the name of the command. Names consist of non-whitespace
characters and go on to the first whitespace character. They may not start with
the comment character (or any other character with special meaning), though.

The rest of the line is trimmed of leading whitespace and then used as-is as the
_value_ of the command.

The value may continue on new lines by starting those lines with a configurable
continuation character (such as `\` and `|`). You may indent those lines if you
like; indentation does not matter for continuation lines.

The continuation character may be followed by space, which is removed.  The rest
of the line is used as-is. The value and all continuation lines are always
joined with `\n`.

If a command is indented it belongs to the first earlier command with less
indentation and is called a _sub-command._

An example:

```
# Site-specific rules.
at example.com
\  foo.org
# Match using regex:
\  ^.tt?ps?://.*\.html?

  unmap e
  # Define custom function.
  command test
    \ window.location = "test";
  map <c-f5> test
```


Installation
============

`npm install cctop`

```js
var cctop = require("cctop")
```


API
===

`cctop.parse(string, options)`
------------------------------

Parses `string` into an AST that you evaluate however you wish.

`options`:

- commentChar: `String`. Defaults to `#`.
- continuationChar: `String`. Defaults to `\`.

Returns an object with two properties:

- errors: `Array`. If it is empty, no errors occured. The errors are described
  in detail in the next section.
- commands: `Array`. Each item is an object with the following properties:
  - name: `String`.
  - value: `String`. May be empty.
  - subCommands: `Array`. May be empty.
  - line: `Number`.
  - column: `Number`.
  - endLine: `Number`. The line number of the last continuation line or
    sub-command (even invalid ones).
  - lines: `Array`. You shouldn’t use this property directly. It is merely there
    for the `translate{LineColumn,Index}` functions.

`cctop.translateLineColumn(command, line, column)`
--------------------------------------------------

Consider the following example:

```
at example.com
  use-css
    \ a {
    \   color: black
    \   text-decoration: none
    \ }
```

In this case, the “use-css” command takes some CSS code as a value, which is
passed to a CSS parser. If you know CSS you might have spotted that there is a
missing semi-colon at line 3, column 15 of the CSS (yes, line 3, not 2, since
the value of the “use-css” command starts at the same line as the word “use-css”
itself). Using `translateLineColumn` you can translate that position to the
position in the entire configuration file, which makes it much easier to find.
Pass the `command` object from the `parse` function for the “use-css” command,
as well as the `line` (3) and `column` (15). A `{line: Number, column: Number}`
object is returned.

`cctop.translateIndex(command, index)`
--------------------------------------

The same as `translateLineColumn`, except that it takes a zero-based `index`
instead of a line and column. Sometimes it is easier to keep track of the index
of an error than the line and column.


Errors
======

All errors returned by cctop are objects with the following properties:

- id: `String`.
- line: `Number`.
- column: `Number`.

These are the different ids:

- indent-mixed-space-tab-line: When a line is indented with both spaces _and_
  tabs. Choose one or the other.

- indent-mixed-space-tab-block: When some lines in the same block are indented
  with spaces and some with tabs. Choose one or the other.

- intent-ambigous-length: Best shown with an example:

  ```
  command
      subcommand ok
    subcommand ambigous!
  ```

- missing-command-name-line: When a file begins with continuation lines and/or
  sub-commands. They need a command to belong to, but it is missing. This type
  of error has a `command` property representing this missing command.


Notes
=====

All line and column numbers are one-based.


License
=======

[The X11 (“MIT”) License](LICENSE).
