
/**
 * @fileoverview Tests that parsing works end-to-end.
 */

var fs = require('fs')
var parser = require('../lib/parser')
var path = require('path')


// Parsing tests:
// verify parse failures for
// - bad types.
// - enum values are in int32 range.


exports.testKitchenSinkParsing = function (test) {
  var proto = parseFile('kitchen-sink.proto')

  test.equal(proto.getPackage(), 'some_package')

  // Test imports.
  test.equal(proto.getImportNames().length, 3)
  test.equal(proto.getImportNames()[0], 'protos/options.proto')

  // Test proto level options.
  test.equal(proto.getOptionKeys().length, 2)
  test.equal(proto.getOption('file_level_option'), 'string value')
  test.equal(proto.getOption('another_option'), 'Just "testing" that strings parse.')

  // Test message level options.
  test.equals(proto.getMessage('AnotherMessage').getOption('message_level_option'), 'XYZ')

  // Test messages.
  test.equal(proto.getMessages().length, 2)
  test.ok(!!proto.getMessage('AnotherMessage').getMessage('MessagesWithinMessages'))
  test.ok(!!proto.getMessage('AnotherMessage')
      .getMessage('MessagesWithinMessages')
      .getEnum('EnumInsideMessageInsideMessage'))

  // Test fields.
  var msg = proto.getMessage('ThisIsTheKitchenSink')
  test.equal(msg.getFields().length, 10)
  test.ok(msg.getField('optional_field').isOptional())
  test.ok(!msg.getField('required_field').isOptional())
  test.ok(!msg.getField('required_field').isRepeated())
  test.ok(!msg.getField('optional_field').isRepeated())
  test.ok(!msg.getField('repeated_field').isOptional())
  test.ok(msg.getField('repeated_field').isRepeated())

  test.equal(msg.getField('required_field').getType(), 'string')
  test.equal(msg.getField('optional_field').getType(), 'number')
  test.equal(msg.getField('repeated_field').getType(), 'boolean')
  test.equal(msg.getField('using_another_message').getType(), 'AnotherMessage')
  test.equal(msg.getField('color_field').getType(), 'examples.Color')
  test.equal(msg.getField('color_field').getBaseType(), 'Color')
  test.equal(-1, msg.getField('negative_field').getOption('default'))
  test.equal('string', msg.getField('string_field').getOption('default'))

  test.equal(msg.getOneof('oneof_name').getOneofIndex(), 0)
  test.ok(msg.getField('oneof_field_normal').isOptional())
  test.ok(msg.getField('oneof_field_with_option').isOptional())
  test.ok(msg.getField('oneof_color_field').isOptional())
  test.equal(msg.getField('oneof_field_normal').getType(), 'number')
  test.equal(msg.getField('oneof_field_with_option').getOption('default'), 'string')
  test.equal(msg.getField('oneof_color_field').getType(), 'examples.Color')
  test.equal(msg.getField('oneof_color_field').getBaseType(), 'Color')

  test.done()
}


exports.testBadProto_duplicateTags = function (test) {
  assertFails('message Dupe { required string first = 1; required string second = 1; }',
      'duplicate tag in',
      'Protos with duplicate tags should throw parse errors', test)
}


exports.testBadProto_duplicateTagNames = function (test) {
  assertFails('message Dupe { required string first = 1; required string first = 2; }',
      'duplicate tag name in',
      'Protos with duplicate tag names should throw parse errors', test)
}

exports.testBadProto_badTypeNumber = function (test) {
  assertFails('message BadType { required number first = 1; }',
      'invalid type',
      '"number" is not a valid type', test)
}

exports.testBadProto_badTypeBoolean = function (test) {
  assertFails('message BadType { required boolean first = 1; }',
      'invalid type',
      '"boolean" is not a valid type', test)
}


exports.testBadProto_badTag = function (test) {
  assertFails('message BadTag { required string first = 1-1; }',
      'Malformed number 1-1',
      'Malformed number 1-1',
      test)
}


exports.testBadProto_unexpectedChars = function (test) {
  assertFails('message BadTag { required string first = $1; }',
      'Unexpected characters in "test.proto" at line: 1, column: 42, char: $',
      'Bad characters',
      test)
}


exports.testExtendConsumed = function (test) {
  var proto = parseFile('options.proto')
  // TODO : Verify descriptor is extended
  test.done()
}


function assertFails(protoString, expectedError, message, test) {
  try {
    parser('test.proto', protoString)
    test.ok(false, message)
  } catch (e) {
    if (e.stack.indexOf(expectedError) == -1) {
      test.ok(false, 'Unexpected error thrown, ' + e.stack)
    }
  }
  test.done()
}


function parseFile(file) {
  return parser(file, fs.readFileSync(path.join(__dirname, 'protos', file), 'utf8'))
}
