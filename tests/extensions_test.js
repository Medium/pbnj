
/**
 * @fileoverview Tests that extensions work.
 */

var fs = require('fs')
var parser = require('../lib/parser')
var path = require('path')
var Project = require('../lib/Project')
var baseDir = __dirname

exports.testExtendsParsing = function (test) {
  var proto = parseFile('super-person.proto')
  test.equal(1, proto.getExtends().length)

  var e = proto.getExtend('Person')
  test.ok(e)

  test.equal('number', e.getField('flying_speed').getType())
  test.done()
}

exports.testExtendsResolution = function (test) {
  var project = new Project(baseDir)
      .addProto('protos/person.proto')
      .addProto('protos/super-person.proto')

  project._resolveExtensions()
  var person = project.getProtos('protos/person.proto')[0]
  var personMsg = person.getMessage('Person')
  test.equal('number', personMsg.getField('flying_speed').getType())
  test.done()
}

function parseFile(file) {
  return parser(file, fs.readFileSync(path.join(__dirname, 'protos', file), 'utf8'))
}
