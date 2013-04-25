
var path = require('path')
var util = require('util')
var pbnj = require('../lib/pbnj')
var soynode = require('soynode')


var project = new pbnj.Project(__dirname)
project.processFile('activity.proto', true)

project.loadTemplates('templates')
.then(function () {
  return project.compile('db.proto')
})
.then(function () {
  console.log('Done')
})
.fail(function (err) {
  console.error(err, err.stack)
})
