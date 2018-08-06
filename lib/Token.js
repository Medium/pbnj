
/**
 * @fileoverview Class for representing a single token in the protocol buffer
 * schema.
 */


/**
 * @param {Token.Type} type
 * @param {string} content
 * @param {number} line
 * @param {number} column
 * @constructor
 */
function Token(type, content, line, column) {
  this.type = type
  this.content = content
  this.line = line
  this.column = column
}
module.exports = Token


/**
 * Token types
 * @enum {number}
 */
Token.Type = {
  LINE_COMMENT: 1,
  BLOCK_COMMENT: 2,
  WORD: 3,
  STRING: 4,
  OPERATOR: 5,
  TERMINATOR: 6,
  DELIMITER: 7,
  START_BLOCK: 8,
  END_BLOCK: 9,
  START_OPTION: 10,
  END_OPTION: 11,
  NUMBER: 12,
  START_PAREN: 13,
  END_PAREN: 14,
  COLON: 15
}


/**
 * Given a token type returns a readable error string.
 * @param {Token.Type} value
 * @return {string}
 */
Token.toErrorString = function (value) {
  switch (value) {
    case Token.Type.LINE_COMMENT: return '// (line comment)'
    case Token.Type.BLOCK_COMMENT: return '/* (block comment)'
    case Token.Type.WORD: return 'word'
    case Token.Type.STRING: return 'quote delimited string'
    case Token.Type.OPERATOR: return '= (operator)'
    case Token.Type.TERMINATOR: return '; (terminator)'
    case Token.Type.DELIMITER: return ', (delimiter)'
    case Token.Type.START_BLOCK: return '{ (open block)'
    case Token.Type.END_BLOCK: return '} (close block)'
    case Token.Type.START_OPTION: return '[ (open option)'
    case Token.Type.END_OPTION: return '] (close option)'
    case Token.Type.START_PAREN: return '( (open parenthesis)'
    case Token.Type.END_PAREN: return ') (close parenthesis)'
    case Token.Type.NUMBER: return 'number'
    case Token.Type.COLON: return ': (begin definition)'
    default:
      return 'Token Value=' + value
  }
}
