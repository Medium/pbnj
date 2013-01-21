
var tokenize = require('./tokenize')
var Token = require('./Token')
var ProtoDescriptor = require('./descriptors/ProtoDescriptor')
var MessageDescriptor = require('./descriptors/MessageDescriptor')
var EnumDescriptor = require('./descriptors/EnumDescriptor')
var FieldDescriptor = require('./descriptors/FieldDescriptor')

// TODO : Add support for [ default = "some string" ]
// TODO : groups
// TODO : extensions
// TODO : options

/**
 * See https://developers.google.com/protocol-buffers/docs/proto for language
 * definition and explanations.
 *
 * For reference the C++ parser is at: http://goo.gl/k9uAT
 *
 * @param {string} string
 * @return {ProtoDescriptor}
 */
module.exports = function parser(string) {
  var tokens = tokenize(string)
  var proto = new ProtoDescriptor()

  while (tokens.length) {
    var token = tokens.shift()
    if (isComment(token.type)) continue
    switch (token.content) {
      case 'package':
        parsePackage()
        break
      case 'option':
        parseFileOption()
        break
      case 'import':
        parseImport()
        break
      case 'message':
        parseMessage(proto)
        break
      default:
        throw Error('Unexpected token ' + token.content)
    }
  }

  return proto

  // Parses the package statement: package pacakgeName;
  function parsePackage() {
    proto.setPackage(expect(Token.Type.WORD).content)
    expect(Token.Type.TERMINATOR)
  }

  // Parses a file level option: option optionName = "optionValue";
  function parseFileOption() {
    var key = expect(Token.Type.WORD)
    var equals = expect(Token.Type.OPERATOR, '=')
    var value = expect(Token.Type.STRING)
    expect(Token.Type.TERMINATOR)
    proto.addOption(key.content, value.content)
    // TODO : Handle duplicate options.
  }

  // Parses an import statement: import "filename";
  function parseImport() {
    var filename = expect(Token.Type.STRING).content
    expect(Token.Type.TERMINATOR)
    proto.addImport(filename)
  }

  // Parses a message definition: message MessageName { ... }
  function parseMessage(parent) {
    var name = expect(Token.Type.WORD).content
    var message = new MessageDescriptor(name)
    parent.addMessage(name, message)

    parseBlock(function (token) {
      if (isComment(token)) return
      switch (token.content) {
        case 'message':
          // Recursive parsing of nested messages.
          parseMessage(message)
          break
        case 'enum':
          parseEnum(message)
          break
        case 'required':
          parseRequiredField(message)
          break
        case 'optional':
          parseOptionalField(message)
          break
        case 'repeated':
          parseRepeatedField(message)
          break
        default:
          throw new ParseError(token)
      }
    })
  }

  // Parses a field, may have options:
  //     fieldType protoType name = tag;
  //     fieldType protoType name = tag [default = "value"];
  function parseField() {
    var type = expect(Token.Type.WORD).content
    var name = expect(Token.Type.WORD).content
    expect(Token.Type.OPERATOR, '=')
    var tag = expect(Token.Type.WORD).content
    var field = new FieldDescriptor(type, name, tag)
    if (peek().type == Token.Type.START_OPTION) {
      parseFieldOptions(field)
    }
    return field
  }

  // Parses a required field: required protoType name = tag;
  function parseRequiredField(parent) {
    var field = parseField()
    expect(Token.Type.TERMINATOR)
    parent.addField(field)
  }

  // Parses an optional field: optional protoType name = tag [default = 123];
  function parseOptionalField(parent) {
    var field = parseField()
    field.setOptional(true)
    expect(Token.Type.TERMINATOR)
    parent.addField(field)
  }

  // Parses a repeated field: repeated protoType name = tag [default = 123];
  function parseRepeatedField(parent) {
    var field = parseField()
    field.setRepeated(true)
    expect(Token.Type.TERMINATOR)
    parent.addField(field)
  }

  // Parses an enum: enum EnumName { OPT1 = 1; OPT2 = 2; }
  function parseEnum(parent) {
    var name = expect(Token.Type.WORD).content
    var enumeration = new EnumDescriptor(name)
    parent.addEnum(enumeration)
    parseBlock(function (token) {
      var name = token.content
      expect(Token.Type.OPERATOR, '=')
      var index = expect(Token.Type.WORD).content
      expect(Token.Type.TERMINATOR)
      enumeration.addValue(name, index)
    })
  }

  // Parses field options: [ name1 = value1, name2 = value2 ]
  function parseFieldOptions(parent) {
    parseBlock(function (token) {
      var name = token.content
      expect(Token.Type.OPERATOR, '=')
      var value = expect(Token.Type.WORD).content
      parent.addOption(name, value)
      if (peek().type == Token.Type.DELIMITER) expect(Token.Type.DELIMITER, ',')
    }, Token.Type.START_OPTION, Token.Type.END_OPTION)
  }

  // Parses a block, calling fn for each token until the end token is seen.
  function parseBlock(fn, opt_start, opt_end) {
    var start = opt_start || Token.Type.START_BLOCK
    var end = opt_end || Token.Type.END_BLOCK
    expect(start)
    while (true) {
      var token = tokens.shift()
      if (!token) {
        throw Error('Missing end block')
      } else if (token.type == end) {
        return // Finished parsing block.
      } else {
        fn(token)
      }
    }
  }

  function isComment(token) {
    return token.type == Token.Type.LINE_COMMENT ||
           token.type == Token.Type.BLOCK_COMMENT
  }

  // Gets the next token and throws an error if it doesn't match the expected
  // type and value.
  function expect(type, value) {
    var token = tokens.shift()
    if (token.type != type || value && token.content != value) {
      throw new ParseError(token, type)
    }
    return token
  }

  // Peeks at the next token without moving forward.
  function peek() {
    return tokens[0]
  }
}


/**
 * Error thrown if something goes wrong during parsing.
 */
function ParseError(token, expected) {
  Error.captureStackTrace(this, ParseError)
  this.token = token
  this.expected = expected
  this.message = 'Unexpected token at line:' + token.line + ', column:' +
      token.column + ', saw:' + token.content + ', expected:' + expected
}
ParseError.prototype = Object.create(Error.prototype)


