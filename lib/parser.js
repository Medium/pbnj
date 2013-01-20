
var tokenize = require('./tokenize')
var Token = require('./Token')

// TODO : import
// TODO : groups
// TODO : extensions
// TODO : options

module.exports = function parser(string) {
  var proto = new ProtoDescription()
  var tokens = tokenize(string)

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
      case 'message':
        parseMessage(proto)
        break
      default:
        throw Error('Unexpected token ' + token.content)
    }
  }

  return proto

  function parsePackage() {
    proto.package = expect(Token.Type.WORD).content
    expect(Token.Type.TERMINATOR)
  }

  function parseFileOption() {
    var key = expect(Token.Type.WORD)
    var equals = expect(Token.Type.OPERATOR, '=')
    var value = expect(Token.Type.STRING)
    expect(Token.Type.TERMINATOR)
    proto.options[key.content] = value.content
    // TODO : Handle duplicate options.
  }

  function parseMessage(parent) {
    var name = expect(Token.Type.WORD).content
    var message = parent.messages[name] = new MessageDescription(name)

    parseBlock(function (token) {
      if (token.type == Token.Type.LINE_COMMENT || token.type == Token.Type.BLOCK_COMMENT) return
      switch (token.content) {
        case 'message':
          // Parse nested messages.
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
    var field = new FieldDescription()
    field.type = expect(Token.Type.WORD).content
    field.name = expect(Token.Type.WORD).content
    expect(Token.Type.OPERATOR, '=')
    field.index = expect(Token.Type.WORD).content
    return field
  }

  function parseRequiredField(parent) {
    var field = parseField()
    expect(Token.Type.TERMINATOR)
    parent.fields.push(field)
  }

  function parseOptionalField(parent) {
    var field = parseField()
    field.isOptional = true
    if (peek().type == Token.Type.START_OPTION) {
      parseOptions(field)
    }
    expect(Token.Type.TERMINATOR)
    parent.fields.push(field)
  }

  function parseRepeatedField(parent) {
    var field = parseField()
    field.isRepeated = true
    expect(Token.Type.TERMINATOR)
    parent.fields.push(field)
  }

  function parseEnum(parent) {
    var name = expect(Token.Type.WORD).content
    var enumeration = parent.enums[name] = new EnumDescription(name)
    parseBlock(function (token) {
      var name = token.content
      expect(Token.Type.OPERATOR, '=')
      var index = expect(Token.Type.WORD).content
      expect(Token.Type.TERMINATOR)
      enumeration.values[index] = name
    })
  }

  function parseOptions(parent) {
    parseBlock(function (token) {
      var name = token.content
      expect(Token.Type.OPERATOR, '=')
      var value = expect(Token.Type.WORD).content
      parent.options[name] = value
      if (peek().type == Token.Type.DELIMITER) expect(Token.Type.DELIMITER, ',')
    }, Token.Type.START_OPTION, Token.Type.END_OPTION)
  }

  function parseBlock(fn, start, end) {
    expect(start || Token.Type.START_BLOCK)
    while (true) {
      var token = tokens.shift()
      if (!token) {
        throw Error('Missing end block')
      } else if (token.type == (end || Token.Type.END_BLOCK)) {
        // Finished parsing block.
        return
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
ParseError.prototype = new Error()


function ProtoDescription() {
  this.package = ''
  this.options = {}
  this.messages = {}
}

function MessageDescription(name) {
  this.name = name
  this.fields = []
  this.messages = {}
  this.enums = {}
}

function EnumDescription(name) {
  this.name = name
  this.values = {}
}

function FieldDescription() {
  this.isOptional = false
  this.isRepeated = false
  this.type = ''
  this.name = ''
  this.index = -1
  this.options = {}
}
