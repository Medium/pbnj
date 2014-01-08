
/**
 * @fileoverview Errors thrown by PBNJ.
 */


/**
 * Error thrown if something goes wrong during parsing.
 */
function ParseError(name, token, msg) {
  Error.captureStackTrace(this, ParseError)
  this.token = token
  this.message = 'Unexpected token in "' + name + '" at line: ' + token.line +
      ', column: ' + token.column + ', token: "' + token.content + '"' + (msg ? (', ' + msg) : '')
}
ParseError.prototype = Object.create(Error.prototype)

/**
 * Error thrown if something goes wrong during tokenization.
 */
function TokenError(name, line, column, ch, opt_msg) {
  Error.captureStackTrace(this, TokenError)
  this.message = 'Unexpected characters in "' + name + '" at line: ' + line +
      ', column: ' + column + ', char: ' + ch + (opt_msg ? ('. ' + opt_msg) : '')
}
TokenError.prototype = Object.create(Error.prototype)


module.exports = {
  ParseError: ParseError,
  TokenError: TokenError
}
