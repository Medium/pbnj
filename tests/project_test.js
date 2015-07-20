
/**
 * @fileoverview Tests specifically of Project related functionality.
 */

var kew = require('kew')
var fs = require('fs')
var path = require('path')
var Project = require('../lib/Project')

var baseDir = __dirname

exports.testGetProtos = function (test) {
  var project = new Project(baseDir)
    .addProto('protos/vehicle.proto')
    .addProto('protos/common.proto')

  // getProtos() with no params should return all protos (including imports)
  var allProtos = project.getProtos().map(getProtoName)
  test.deepEqual(['vehicle.proto', 'common.proto', 'person.proto'], allProtos)

  // getProtos() with proto param should return only that proto
  var personProtos = project.getProtos('protos/person.proto')
  var personImports = personProtos.map(getProtoName)
  test.deepEqual(['person.proto'], personImports)

  // Make sure imports are processed and returned to template
  test.equals(1, personProtos[0].toTemplateObject().imports.length)

  var enums = personProtos[0].toTemplateObject().messages[0].enums
  test.equal(1, enums && enums.length)
  test.deepEqual(
    {name: 'PhoneType', values: [{name: 'MOBILE', titleName: 'Mobile', number: 0},
                                 {name: 'HOME', titleName: 'Home', number: 1},
                                 {name: 'WORK', titleName: 'Work', number: 2},
                                 {name: 'WORK_FAX', titleName: 'WorkFax', number: 3}]},
    enums[0])

  test.done()
}


exports.testBasicCompilation = function (test) {
  var compilations = []
  new Project(baseDir)
    .addJob('protos/vehicle.proto', 'protoTemplate.justNames', '.xx.js')
    .setOutDir('generated-stuff')
    .setOutputFn(function (descriptor, fileName, contents) {
      compilations.push({
        descriptor: descriptor,
        fileName: fileName,
        contents: contents
      })
      return kew.resolve(contents)
    })
    .compile()
    .then(function () {
      test.equals(1, compilations.length, 'One proto should have been compiled')

      test.equals('Proto=vehicle.proto,Msg=Vehicle,', compilations[0].contents)

      test.equals(path.join(__dirname, 'generated-stuff', 'vehicle.proto.xx.js'), compilations[0].fileName)

      test.done()
    })
    .fail(function (err) {
      test.ifError(err)
      test.done()
    })
}

exports.testSuffixSpecificOutputDir = function (test) {
  var compilations = []
  new Project(baseDir)
    .addJob('protos/vehicle.proto', 'protoTemplate.justNames', '.java')
    .addJob('protos/vehicle.proto', 'protoTemplate.justNames', '.xx.js')
    .setOutDir('generated-stuff')
    .setOutDir('java/generated-stuff', '.java')
    .setOutputFn(function (descriptor, fileName, contents) {
      compilations.push({
        descriptor: descriptor,
        fileName: fileName,
        contents: contents
      })
      return kew.resolve(contents)
    })
    .compile()
    .then(function () {
      test.equals(2, compilations.length, 'Two protos should have been compiled')

      test.equals('Proto=vehicle.proto,Msg=Vehicle,', compilations[0].contents)
      test.equals('Proto=vehicle.proto,Msg=Vehicle,', compilations[1].contents)

      test.equals(path.join(__dirname, 'java/generated-stuff', 'VehicleProtos.java'), compilations[0].fileName)
      test.equals(path.join(__dirname, 'generated-stuff', 'vehicle.proto.xx.js'), compilations[1].fileName)

      test.done()
    })
    .fail(function (err) {
      test.ifError(err)
      test.done()
    })
}


exports.testDefaultOutputFnWritesFile = function (test) {
  var expectedFile = path.join(__dirname, 'generated-stuff2', 'common.proto.js')

  // Make sure the expected file doesn't exist yet.
  if (fs.existsSync(expectedFile)) fs.unlinkSync(expectedFile)

  new Project(baseDir)
    .addJob('protos/common.proto', 'protoTemplate.justNames')
    .setOutDir('generated-stuff2')
    .compile()
    .then(function () {
      test.ok(fs.existsSync(expectedFile), 'Expected output missing')
      fs.unlinkSync(expectedFile)
      test.done()
    })
    .fail(function (err) {
      test.ifError(err)
      test.done()
    })
}

exports.testKitchenSinkProto = function (test) {
  var project = new Project(baseDir)
      .addProto('protos/kitchen-sink.proto')

  var allProtos = project.getProtos().map(getProtoName)
  test.deepEqual(['kitchen-sink.proto', 'options.proto', 'descriptor.proto', 'common.proto'], allProtos)

  project.setOutDir('generated-stuff3')
      .compile()
      .then(function () {
        test.done()
      }, function (err) {
        test.ifError(err)
        test.done()
      })
}


function getProtoName(proto) {
  return proto.getName()
}
