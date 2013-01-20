
var fs = require('fs')
var path = require('path')
var util = require('util')
var example = fs.readFileSync(path.join(__dirname, '../examples/person.proto'), 'utf8')

var parser = require('./parser')

console.log(util.inspect(parser(example), true, 100))
