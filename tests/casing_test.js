
/**
 * @fileoverview Tests casing rulesthat parsing works end-to-end.
 */

var fs = require('fs')
var parser = require('../lib/parser')
var path = require('path')


exports.testCasingMessage = function (test) {
  var proto = parseFile('conventions.proto')

  test.equal(proto.getPackage(), 'conventions')

  var msg = proto.getMessage('Casing')

  test.ok(msg.getField('normal_case'))
  test.equal('normal_case', msg.getField('normal_case').toTemplateObject().name)
  test.equal('NormalCase', msg.getField('normal_case').toTemplateObject().titleName)

  test.ok(msg.getField('normal_case_ios'))
  test.equal('normal_case_ios', msg.getField('normal_case_ios').toTemplateObject().name)
  test.equal('NormalCaseIos', msg.getField('normal_case_ios').toTemplateObject().titleName)

  test.ok(msg.getField('camelCase'))
  test.equal('camelCase', msg.getField('camelCase').toTemplateObject().name)
  test.equal('CamelCase', msg.getField('camelCase').toTemplateObject().titleName)

  test.ok(msg.getField('camelCaseIOS'))
  test.equal('camelCaseIOS', msg.getField('camelCaseIOS').toTemplateObject().name)
  test.equal('CamelCaseIOS', msg.getField('camelCaseIOS').toTemplateObject().titleName)

  test.ok(msg.getField('TitleCase'))
  test.ok(msg.getField('TitleCaseIOS'))
  test.ok(msg.getField('Weird_Case'))

  test.done()
}

exports.testCasingEnum = function (test) {
  var proto = parseFile('conventions.proto')

  test.equal(proto.getPackage(), 'conventions')

  var e = proto.getEnum('CasingEnum')
  test.equal('TWO_WORDS', e.getValueForNumber(1).name)
  test.equal('TwoWords', e.getValueForNumber(1).titleName)
  test.done()
}

function parseFile(file) {
  return parser(file, fs.readFileSync(path.join(__dirname, 'protos', file), 'utf8'))
}
