
/**
 * @fileoverview Tests specifically of Project related functionality.
 */

var kew = require('kew')
var fs = require('fs')
var path = require('path')
var Project = require('../lib/Project')
var builder = new (require('nodeunitq')).Builder(module.exports)

var baseDir = __dirname

builder.add(function testGetProtos(test) {
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
})


builder.add(function testBasicCompilation(test) {
  var compilations = []
  return new Project(baseDir)
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
    })
})

builder.add(function testSuffixSpecificOutputDir(test) {
  var compilations = []
  return new Project(baseDir)
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
    })
})


builder.add(function testDefaultOutputFnWritesFile(test) {
  var expectedFile = path.join(__dirname, 'generated-stuff2', 'common.proto.js')

  // Make sure the expected file doesn't exist yet.
  if (fs.existsSync(expectedFile)) fs.unlinkSync(expectedFile)

  return new Project(baseDir)
    .addJob('protos/common.proto', 'protoTemplate.justNames')
    .setOutDir('generated-stuff2')
    .compile()
    .then(function () {
      test.ok(fs.existsSync(expectedFile), 'Expected output missing')
      fs.unlinkSync(expectedFile)
    })
})

builder.add(function testKitchenSinkProto(test) {
  var project = new Project(baseDir)
      .addProto('protos/kitchen-sink.proto')

  var allProtos = project.getProtos().map(getProtoName)
  test.deepEqual(['kitchen-sink.proto', 'options.proto', 'descriptor.proto', 'common.proto'], allProtos)

  return project.setOutDir('generated-stuff3').compile()
})

builder.add(function testRemoveField(test) {
  var project = new Project(baseDir)
      .addProto('protos/common.proto')

  var color = project.getProtos('protos/common.proto')[0].getMessage('Color')
  test.equal(3, color.toTemplateObject().fields.length)

  color.removeFieldByName('red')
  test.equal(2, color.toTemplateObject().fields.length)
  test.done()
})


function getProtoName(proto) {
  return proto.getName()
}
