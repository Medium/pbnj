
var path = require('path')
var util = require('util')
var pbnj = require('./pbnj')

var project = new pbnj.Project(path.join(__dirname, '..'))
project.processFile('examples/person.proto', true)

console.log(util.inspect(project, true, 100))
