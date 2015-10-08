
/**
 * @fileoverview Provides a function which will tokenize a protocol buffer
 * schema.
 */

var Token = require('./Token')
var TokenError = require('./errors').TokenError

/**
 * @param {string} string
 * @param {string} fileName
 * @return {Array.<Token>}
 */
module.exports = function tokenize(string, fileName) {
  var pos = 0
  var currentLine = 1
  var currentColumn = 1
  var currentChar = string[0]
  var currentToken = ''
  var tokens = []

  fileName = fileName || '[Unknown file]'

  function throwTokenError(opt_msg) {
    throw new TokenError(fileName, currentLine, currentColumn, currentChar, opt_msg)
  }

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
    else if (lookingAt('(')) consumeChar(Token.Type.START_PAREN)
    else if (lookingAt(')')) consumeChar(Token.Type.END_PAREN)
    else if (lookingAtNumberFirstCharacter()) consumeNumber()
    else if (lookingAtWordFirstCharacter()) consumeWord()
    else if (lookingAtRe(/\s/)) nextChar()
    else throwTokenError()
  }

  return tokens

  function lookingAt(str) {
    return string.substr(pos, str.length) == str
  }

  function lookingAtRe(re) {
    return currentChar && re.test(currentChar)
  }

  function lookingAtNumberFirstCharacter() {
    return lookingAtRe(/[-0-9]/)
  }

  function lookingAtNumberCharacter() {
    return lookingAtNumberFirstCharacter() || currentChar == '.'
  }

  function lookingAtWordFirstCharacter() {
    return lookingAtRe(/[a-zA-Z_]/)
  }

  function lookingAtWordCharacter() {
    return lookingAtWordFirstCharacter() || lookingAtRe(/[0-9\.]/)
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
          throwTokenError('Unterminated string')
          break

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

  function consumeNumber() {
    var line = currentLine
    var column = currentColumn
    while (lookingAtNumberCharacter()) {
      currentToken += currentChar
      nextChar()
    }
    var token = addToken(Token.Type.NUMBER, line, column)
    if (isNaN(token.content)) {
      throwTokenError('Malformed number ' + token.content)
    }
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
    var token = new Token(type, currentToken, line, column)
    tokens.push(token)
    currentToken = ''
    return token
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
