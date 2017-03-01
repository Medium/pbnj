
/**
 * @fileoverview Parses a protocol buffer schema definition.
 */

var tokenize = require('./tokenize')
var Token = require('./Token')
var ProtoDescriptor = require('./descriptors/ProtoDescriptor')
var MessageDescriptor = require('./descriptors/MessageDescriptor')
var ServiceDescriptor = require('./descriptors/ServiceDescriptor')
var EnumDescriptor = require('./descriptors/EnumDescriptor')
var ExtendDescriptor = require('./descriptors/ExtendDescriptor')
var FieldDescriptor = require('./descriptors/FieldDescriptor')
var MethodDescriptor = require('./descriptors/MethodDescriptor')
var ParseError = require('./errors').ParseError
var FieldType = require('./FieldType')
var fieldTypeValues = {}

Object.keys(FieldType).forEach(function (k) {
  fieldTypeValues[FieldType[k]] = true
})


// TODO : validate enums
// TODO : validate types
// TODO : Implement experimental Map type through options.


/**
 * See https://developers.google.com/protocol-buffers/docs/proto for language
 * definition and explanations.
 *
 * For reference the C++ parser is at:
 *   https://github.com/google/protobuf/blob/master/src/google/protobuf/compiler/parser.cc
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
      case 'service':
        parseService(proto)
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

    expect(Token.Type.OPERATOR) // equals
    var value = expect([Token.Type.STRING, Token.Type.WORD])
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
        case 'oneof':
          parseOneof(message)
          break
        case 'extensions':
          parseExtensions(proto)
          break
        default:
          throw new ParseError(identifier, token)
      }
    })
  }

  // Parses a service definition: service ServiceName { ... }
  function parseService(parent) {
    var name = expect(Token.Type.WORD).content
    var service = new ServiceDescriptor(name)
    parent.addService(service)

    parseBlock(function (token) {
      switch (token.content) {
        case 'rpc':
          parseMethod(service)
          break
        case 'option':
          parseOption(service)
          break
        default:
          throw new ParseError(identifier, token)
      }
    })
  }

  // Parses a service method:
  //     rpc MethodName (InputType) returns (OutputType) { ... }
  function parseMethod(service) {
    // 'rpc' token has already been consumed
    var nameToken = expect(Token.Type.WORD)
    var name = nameToken.content
    if (service.getMethod(name)) {
      throw new ParseError(identifier, nameToken, 'duplicate method in "' + service.getName() + '"')
    }
    expect(Token.Type.START_PAREN)
    var inputType = expect(Token.Type.WORD).content
    expect(Token.Type.END_PAREN)
    var returnsToken = expect(Token.Type.WORD)
    if (returnsToken.content != 'returns') {
      throw new ParseError(identifier, token, 'expected "returns" instead of "' + returnsToken.content + '"')
    }
    expect(Token.Type.START_PAREN)
    var outputType = expect(Token.Type.WORD).content
    expect(Token.Type.END_PAREN)

    var method = new MethodDescriptor(name, inputType, outputType)
    if (peek().type == Token.Type.START_BLOCK) {
      parseBlock(function (token) {
        switch (token.content) {
          case 'option':
            parseOption(method)
            break
          default:
            throw new ParseError(identifier, token)
        }
      })
    }
    expectOptional(Token.Type.TERMINATOR)
    service.addMethod(method)
    return method
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
    parseField(parent)
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
    expectOptional(Token.Type.TERMINATOR)
  }

  // Parses extend: extend google.protobuf.MessageOptions {optional string type = 50001;}
  function parseExtend(parent) {
    var name = expect(Token.Type.WORD).content
    var extend = new ExtendDescriptor(name)
    parent.addExtend(extend)

    parseBlock(function (token) {
      switch (token.content) {
        case 'required':
          parseRequiredField(extend)
          break
        case 'optional':
          parseOptionalField(extend)
          break
        case 'repeated':
          parseRepeatedField(extend)
          break
        default:
          throw new ParseError(identifier, token)
      }
    })
  }

  // Parses extensions: extensions 1 to max;
  function parseExtensions() {
    expect([Token.Type.WORD, Token.Type.NUMBER])
    if (expect(Token.Type.WORD).content != 'to') {
      throw new ParseError(identifier, token, 'expected "to".')
    }
    expect([Token.Type.WORD, Token.Type.NUMBER])
    expect(Token.Type.TERMINATOR)
  }

  // Parses oneof: oneof oneofName {protoType fieldName = 1;}
  function parseOneof(parent) {
    var oneofName = expect(Token.Type.WORD).content

    if (parent.getOneof(oneofName)) {
      throw new ParseError(
          identifier, oneofName, 'duplicate oneof name in "' + parent.getName() + '"')
    }

    var oneof = parent.addOneof(oneofName)
    var oneofIndex = oneof.getOneofIndex()

    parseBlock(function (token) {
      if (token.content == 'required' ||
          token.content == 'optional' ||
          token.content == 'repeated') {
        throw new Error('Fields in oneof blocks cannot have labels (required/optional/repeated).')
      }

      // Add the token back so parseField can function properly.
      tokens.unshift(token)

      var field = parseField(parent)
      field.setOneofIndex(oneofIndex)
      field.setOptional(true)
      expect(Token.Type.TERMINATOR)
    })
  }

  // Parses field options: [ name1 = value1, name2 = value2, (name3) = value3, (lib.option_type).name4 = value4 ]
  function parseFieldOptions(parent) {
    parseBlock(function (token) {
      var hasParens = false
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

      if (peek().type == Token.Type.DOT) {
        expect(Token.Type.DOT)
        token = expect(Token.Type.WORD)
        name = token.content
      }

      expect(Token.Type.OPERATOR)
      var value = expect([Token.Type.WORD, Token.Type.STRING, Token.Type.NUMBER]).content
      parent.addOption(name, value)
      expectOptional(Token.Type.DELIMITER)
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
    return isInArray(token, [Token.Type.LINE_COMMENT, Token.Type.BLOCK_COMMENT])
  }

  function isInArray(token, types) {
    for (var i = 0; i < types.length; i++) {
      if (token.type == types[i]) return true
    }
    return false
  }

  function expectOptional(type) {
    if (peek() && peek().type == type) expect(type)
  }

  // Gets the next token and throws an error if it doesn't match one of the
  // expected types.
  function expect(types) {
    var token = token = tokens.shift()
    if (!Array.isArray(types)) types = [types]
    if (!isInArray(token, types)) {
      throw new ParseError(identifier, token, 'expected ' + types.map(Token.toErrorString) + '.')
    }
    return token
  }

  // Peeks at the next token without moving forward.
  function peek() {
    return tokens[0]
  }

}
