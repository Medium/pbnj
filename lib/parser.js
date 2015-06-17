
/**
 * @fileoverview Parses a protocol buffer schema definition.
 */

var tokenize = require('./tokenize')
var Token = require('./Token')
var ProtoDescriptor = require('./descriptors/ProtoDescriptor')
var MessageDescriptor = require('./descriptors/MessageDescriptor')
var EnumDescriptor = require('./descriptors/EnumDescriptor')
var FieldDescriptor = require('./descriptors/FieldDescriptor')
var ParseError = require('./errors').ParseError
var FieldType = require('./FieldType')
var fieldTypeValues = {}

Object.keys(FieldType).forEach(function (k) {
  fieldTypeValues[FieldType[k]] = true
})


// TODO : validate enums
// TODO : validate types
// TODO : support for proto extensions ?
// TODO : Implement experimental Map type through options.


/**
 * See https://developers.google.com/protocol-buffers/docs/proto for language
 * definition and explanations.
 *
 * For reference the C++ parser is at: http://goo.gl/k9uAT
 *
 * @param {string} identifier Identifier for the content being parsed, usually the file name.
 * @param {string} string
 * @return {ProtoDescriptor}
 */
module.exports = function parser(identifier, string) {
  var tokensIncludingComments = tokenize(string, identifier)
  var tokens = tokensIncludingComments.filter(function (t) {
    return !isComment(t)
  })
  var proto = new ProtoDescriptor(identifier)

  while (tokens.length) {
    var token = tokens.shift()
    switch (token.content) {
      case 'package':
        parsePackage()
        break
      case 'option':
        parseOption(proto)
        break
      case 'import':
        parseImport()
        break
      case 'message':
        parseMessage(proto)
        break
      case 'enum':
        parseEnum(proto)
        break
      case 'extend':
        parseExtend(proto)
        break

      default:
        throw Error('Unexpected token in "' + identifier + '"; ' + token.content)
    }
  }

  return proto

  // Parses the package statement: package pacakgeName;
  function parsePackage() {
    proto.setPackage(expect(Token.Type.WORD).content)
    expect(Token.Type.TERMINATOR)
  }

  // Parses a file level option:
  // option optionName = "optionValue";
  // option (optionName) = "optionValue";
  function parseOption(parent) {
    var hasParens = false
    if (peek().type == Token.Type.START_PAREN) {
      expect(Token.Type.START_PAREN)
      hasParens = true
    }

    var key = expect(Token.Type.WORD)
    if (hasParens) {
      expect(Token.Type.END_PAREN)
    }

    var equals = expect(Token.Type.OPERATOR)
    var value = expect(Token.Type.STRING)
    expect(Token.Type.TERMINATOR)
    parent.addOption(key.content, value.content)
    // TODO : Handle duplicate options.
  }

  // Parses an import statement: import "filename";
  function parseImport() {
    var filename = expect(Token.Type.STRING).content
    expect(Token.Type.TERMINATOR)
    proto.addImportName(filename)
  }

  // Parses a message definition: message MessageName { ... }
  function parseMessage(parent) {
    var name = expect(Token.Type.WORD).content
    var message = new MessageDescriptor(name)
    parent.addMessage(message)

    parseBlock(function (token) {
      switch (token.content) {
        case 'message':
          // Recursive parsing of nested messages.
          parseMessage(message)
          break
         case 'option':
          parseOption(message)
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
          throw new ParseError(identifier, token)
      }
    })
  }

  // Parses a field, may have options:
  //     fieldType protoType name = tag;
  //     fieldType protoType name = tag [default = "value"];
  function parseField(parent) {
    var typeToken = expect(Token.Type.WORD)
    var type = typeToken.content
    var name = expect(Token.Type.WORD)
    expect(Token.Type.OPERATOR)
    var tag = expect(Token.Type.NUMBER)

    if (parent.getField(name.content)) {
      throw new ParseError(identifier, name, 'duplicate tag name in "' + parent.getName() + '"')
    }
    if (parent.getFieldByTag(tag.content)) {
      throw new ParseError(identifier, tag, 'duplicate tag in "' + parent.getName() + '"')
    }
    if ((type in fieldTypeValues) && !(type in FieldType)) {
      throw new ParseError(identifier, typeToken, 'invalid type "' + type + '"')
    }

    var field = new FieldDescriptor(type, name.content, Number(tag.content))
    if (peek().type == Token.Type.START_OPTION) {
      parseFieldOptions(field)
    }
    parent.addField(field)
    return field
  }

  // Parses a required field: required protoType name = tag;
  function parseRequiredField(parent) {
    var field = parseField(parent)
    expect(Token.Type.TERMINATOR)
  }

  // Parses an optional field: optional protoType name = tag [default = 123];
  function parseOptionalField(parent) {
    var field = parseField(parent)
    field.setOptional(true)
    expect(Token.Type.TERMINATOR)
  }

  // Parses a repeated field: repeated protoType name = tag [default = 123];
  function parseRepeatedField(parent) {
    var field = parseField(parent)
    field.setRepeated(true)
    expect(Token.Type.TERMINATOR)
  }

  // Parses an enum: enum EnumName { OPT1 = 1; OPT2 = 2; }
  function parseEnum(parent) {
    var name = expect(Token.Type.WORD).content
    var enumeration = new EnumDescriptor(name)
    parent.addEnum(enumeration)
    parseBlock(function (token) {
      var name = token.content
      expect(Token.Type.OPERATOR)
      var number = expect(Token.Type.NUMBER)
      expect(Token.Type.TERMINATOR)
      enumeration.addValue(name, Number(number.content))
    })
  }

  // Parses extend: extend google.protobuf.MessageOptions {optional string type = 50001;}
  function parseExtend(parent) {
    var name = expect(Token.Type.WORD).content
    parseBlock(function (token) {
      // TODO : parse and add to descriptor
    })
  }

  // Parses field options: [ name1 = value1, name2 = value2, (name3) = value3 ]
  function parseFieldOptions(parent) {
    parseBlock(function (token) {
      var hasParens = false
      var nameToken = token
      if (token.type == Token.Type.START_PAREN) {
        token = expect(Token.Type.WORD)
        hasParens = true
      } else if (token.type != Token.Type.WORD) {
        throw new ParseError(identifier, token, 'expected ' + Token.toErrorString(Token.Type.WORD) + '.')
      }

      var name = token.content
      if (hasParens) {
        expect(Token.Type.END_PAREN)
      }

      expect(Token.Type.OPERATOR)
      var value = expect([Token.Type.WORD, Token.Type.STRING, Token.Type.NUMBER]).content
      parent.addOption(name, value)
      if (peek().type == Token.Type.DELIMITER) expect(Token.Type.DELIMITER)
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
    return isOneOf(token, [Token.Type.LINE_COMMENT, Token.Type.BLOCK_COMMENT])
  }

  function isOneOf(token, types) {
    for (var i = 0; i < types.length; i++) {
      if (token.type == types[i]) return true
    }
    return false
  }

  // Gets the next token and throws an error if it doesn't match one of the
  // expected types.
  function expect(types) {
    var token = token = tokens.shift()
    if (!Array.isArray(types)) types = [types]
    if (!isOneOf(token, types)) {
      throw new ParseError(identifier, token, 'expected ' + types.map(Token.toErrorString) + '.')
    }
    return token
  }

  // Peeks at the next token without moving forward.
  function peek() {
    return tokens[0]
  }

}
