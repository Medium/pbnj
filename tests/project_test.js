
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

  var allProtos = project.getProtos().map(getProtoName)
  test.deepEqual(['vehicle.proto', 'common.proto', 'person.proto'], allProtos)

  var personProtos = project.getProtos('protos/person.proto')
  var personImports = personProtos.map(getProtoName)
  test.deepEqual(['person.proto', 'common.proto'], personImports)

  // Make sure getImports() returns an array of proto descriptors.
  test.equals(personProtos[0].getImports()[0], personProtos[1])
  test.equals(1, personProtos[0].toTemplateObject().imports.length)

  var enums = personProtos[0].toTemplateObject().messages[0].enums
  test.equal(1, enums && enums.length)
  test.deepEqual(
    {name: 'PhoneType', values: [{name: 'MOBILE', number: 0},
                                 {name: 'HOME', number: 1},
                                 {name: 'WORK', number: 2}]},
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
      test.equals(3, compilations.length, 'Three protos should have been compiled')

      test.equals('Proto=vehicle.proto,Msg=Vehicle,', compilations[0].contents)
      test.equals('Proto=common.proto,Msg=StringPair,Msg=Color,', compilations[1].contents)
      test.equals('Proto=person.proto,Msg=Person,', compilations[2].contents)

      test.equals(path.join(__dirname, 'generated-stuff', 'vehicle.proto.xx.js'), compilations[0].fileName)
      test.equals(path.join(__dirname, 'generated-stuff', 'common.proto.xx.js'), compilations[1].fileName)
      test.equals(path.join(__dirname, 'generated-stuff', 'person.proto.xx.js'), compilations[2].fileName)

      test.done()
    })
    .fail(function (err) {
      console.log(err.stack)
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
      console.log(err.stack)
    })
}

exports.testKitchenSinkProto = function (test) {
  var project = new Project(baseDir)
      .addProto('protos/kitchen-sink.proto')

  var allProtos = project.getProtos().map(getProtoName)
  test.deepEqual(['kitchen-sink.proto', 'options.proto', 'descriptor.proto'], allProtos)

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
