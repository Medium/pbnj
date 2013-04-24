
var path = require('path')
var util = require('util')
var pbnj = require('./pbnj')
var soynode = require('soynode')


var project = new pbnj.Project(path.join(__dirname, '..'))
project.processFile('examples/activity.proto', true)

//console.log(util.inspect(project, true, 100))

soynode.setOptions({
    tmpDir: '/tmp/pbnj'
  , allowDynamicRecompile: false
  , eraseTemporaryFiles: false
})

soynode.compileTemplates(path.join(__dirname, '..', 'examples', 'templates'), function (err) {
  if (err) throw err
  project.getProtos().forEach(function (proto) {
    console.log(util.inspect(proto.toTemplateObject(), true, 100))
    console.log(soynode.render('db.proto', proto.toTemplateObject()))
  })
})
