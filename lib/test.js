
var path = require('path')
var util = require('util')
var pbnj = require('./pbnj')

var fp = new pbnj.FileParser(path.join(__dirname, '..'))
fp.processFile('examples/person.proto', true)

console.log(util.inspect(fp, true, 100))
