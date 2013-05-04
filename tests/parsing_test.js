
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
// - 


exports.testKitchenSinkParsing = function (test) {
  var descriptor = parseFile('kitchen-sink.proto')
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
