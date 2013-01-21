
var fs = require('fs')
var path = require('path')
var util = require('util')
var example = fs.readFileSync(path.join(__dirname, '../examples/person.proto'), 'utf8')

var pbnj = require('./pbnj')

console.log(util.inspect(pbnj.parser(example), true, 100))
