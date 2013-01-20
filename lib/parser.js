
var tokenize = require('./tokenize')
var Token = require('./Token')
var ProtoDescriptor = require('./descriptors/ProtoDescriptor')
var MessageDescriptor = require('./descriptors/MessageDescriptor')
var EnumDescriptor = require('./descriptors/EnumDescriptor')
var FieldDescriptor = require('./descriptors/FieldDescriptor')

// TODO : groups
// TODO : extensions
// TODO : options

module.exports = function parser(string) {
  var tokens = tokenize(string)
  var proto = new ProtoDescriptor()

  while (tokens.length) {
    var token = tokens.shift()
    if (token.type == Token.Type.LINE_COMMENT || token.type == Token.Type.BLOCK_COMMENT) continue
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

  function parsePackage() {
    proto.setPackage(expect(Token.Type.WORD).content)
    expect(Token.Type.TERMINATOR)
  }

  function parseFileOption() {
    var key = expect(Token.Type.WORD)
    var equals = expect(Token.Type.OPERATOR, '=')
    var value = expect(Token.Type.STRING)
    expect(Token.Type.TERMINATOR)
    proto.addOption(key.content, value.content)
    // TODO : Handle duplicate options.
  }

  function parseImport() {
    var filename = expect(Token.Type.STRING).content
    expect(Token.Type.TERMINATOR)
    proto.addImport(filename)
  }

  function parseMessage(parent) {
    var name = expect(Token.Type.WORD).content
    var message = new MessageDescriptor(name)
    parent.addMessage(name, message)

    parseBlock(function (token) {
      if (token.type == Token.Type.LINE_COMMENT || token.type == Token.Type.BLOCK_COMMENT) return
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

  function parseField() {
    var type = expect(Token.Type.WORD).content
    var name = expect(Token.Type.WORD).content
    expect(Token.Type.OPERATOR, '=')
    var index = expect(Token.Type.WORD).content
    return new FieldDescriptor(type, name, index)
  }

  function parseRequiredField(parent) {
    var field = parseField()
    expect(Token.Type.TERMINATOR)
    parent.addField(field)
  }

  function parseOptionalField(parent) {
    var field = parseField()
    field.setOptional(true)
    if (peek().type == Token.Type.START_OPTION) {
      parseOptions(field)
    }
    expect(Token.Type.TERMINATOR)
    parent.addField(field)
  }

  function parseRepeatedField(parent) {
    var field = parseField()
    field.setRepeated(true)
    expect(Token.Type.TERMINATOR)
    parent.addField(field)
  }

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

  function parseOptions(parent) {
    parseBlock(function (token) {
      var name = token.content
      expect(Token.Type.OPERATOR, '=')
      var value = expect(Token.Type.WORD).content
      parent.addOption(name, value)
      if (peek().type == Token.Type.DELIMITER) expect(Token.Type.DELIMITER, ',')
    }, Token.Type.START_OPTION, Token.Type.END_OPTION)
  }

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

  function expect(type, value) {
    var token = tokens.shift()
    if (token.type != type || value && token.content != value) {
      throw new ParseError(token, type)
    }
    return token
  }

  function peek() {
    return tokens[0]
  }
}

function ParseError(token, expected) {
  Error.captureStackTrace(this, ParseError)
  this.token = token
  this.expected = expected
  this.message = 'Unexpected token at line:' + token.line + ', column:' +
      token.column + ', saw:' + token.content + ', expected:' + expected
}
ParseError.prototype = Object.create(Error.prototype)


