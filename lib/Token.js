
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
  END_OPTION: 11
}
