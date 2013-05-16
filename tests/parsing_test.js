
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
  test.equal(proto.getImportNames().length, 1)
  test.equal(proto.getImportNames()[0], path.join(process.cwd(), 'some-other-file.proto'))

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
  test.equal(msg.getFields().length, 4)
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
