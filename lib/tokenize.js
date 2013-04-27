
/**
 * @fileoverview Provides a function which will tokenize a protocol buffer
 * schema.
 */

var Token = require('./Token')

/**
 * @param {string} string
 * @return {Array.<Token>}
 */
module.exports = function tokenize(string) {
  var pos = 0
  var currentLine = 1
  var currentColumn = 1
  var currentChar = string[0]
  var currentToken = ''
  var tokens = []

  while (currentChar) {
    if (lookingAt('//') || lookingAt('#')) consumeLineComment()
    else if (lookingAt('/*')) consumeBlockComment()
    else if (lookingAt('"')) consumeString('"')
    else if (lookingAt('\'')) consumeString('\'')
    else if (lookingAt('=')) consumeChar(Token.Type.OPERATOR)
    else if (lookingAt(';')) consumeChar(Token.Type.TERMINATOR)
    else if (lookingAt(',')) consumeChar(Token.Type.DELIMITER)
    else if (lookingAt('{')) consumeChar(Token.Type.START_BLOCK)
    else if (lookingAt('}')) consumeChar(Token.Type.END_BLOCK)
    else if (lookingAt('[')) consumeChar(Token.Type.START_OPTION)
    else if (lookingAt(']')) consumeChar(Token.Type.END_OPTION)
    else if (lookingAtWordCharacter()) consumeWord()
    else nextChar()
  }

  return tokens

  function lookingAt(str) {
    return string.substr(pos, str.length) == str
  }

  function lookingAtRe(re) {
    return currentChar && re.test(currentChar)
  }

  function lookingAtWordCharacter() {
    return lookingAtRe(/[a-zA-Z0-9_\.]/)
  }

  function consumeLineComment() {
    consumeToken(Token.Type.LINE_COMMENT, '\n')
  }

  function consumeBlockComment() {
    consumeToken(Token.Type.BLOCK_COMMENT, '*/')
  }

  function consumeString(quote) {
    var line = currentLine
    var column = currentColumn

    // Skip the first quote.
    nextChar()

    while (currentChar != quote) {
      switch (currentChar) {
        case undefined:
          throw Error('Unterminated string')

        case '\n':
          // TODO: Handle error, line breaks not allowed in string.
          nextChar()
          break
        case '\\':
          if (lookingAt('\\' + quote)) {
            // Unescape the quote.
            currentToken += quote
            nextChar()
            nextChar()
          } else {
            // TODO: Validate escape sequence.
            consumeChars(1)
          }
          break
        default:
          consumeChars(1)
        }
    }

    // Skip the trailing quote.
    nextChar()

    addToken(Token.Type.STRING, line, column)
  }

  function consumeChar(type) {
    var line = currentLine
    var column = currentColumn
    consumeChars(1)
    addToken(type, line, column)
  }

  function consumeWord() {
    var line = currentLine
    var column = currentColumn
    while (lookingAtWordCharacter()) {
      currentToken += currentChar
      nextChar()
    }
    addToken(Token.Type.WORD, line, column)
  }

  function consumeToken(type, until) {
    var line = currentLine
    var column = currentColumn
    consumeUntil(until)
    addToken(type, line, column)
  }

  function consumeUntil(str) {
    while (!lookingAt(str)) {
      currentToken += currentChar
      nextChar()
    }
    consumeChars(str.length)
  }

  function consumeChars(count) {
    while (count--) {
      currentToken += currentChar
      nextChar()
    }
  }

  function addToken(type, line, column) {
    tokens.push(new Token(type, currentToken, line, column))
    currentToken = ''
  }

  function nextChar() {
    if (currentChar == '\n') {
      currentLine++
      currentColumn = 1
    } else {
      currentColumn++
    }
    if (pos < string.length) {
      currentChar = string[++pos]
      return true
    } else {
      return false
    }
  }
}
