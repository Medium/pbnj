
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


module.exports = {
  ParseError: ParseError
}
