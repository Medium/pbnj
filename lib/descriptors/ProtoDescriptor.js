
/**
 * @fileoverview Descriptor class representing a single protocol buffer file.
 */

var path = require('path')
var util = require('util')
var Descriptor = require('./Descriptor')
var helper = require('../helper')


/**
 * @constructor
 * @extends {Descriptor}
 */
function ProtoDescriptor(filePath) {
  Descriptor.call(this)

  this._filePath = filePath
  this._package = ''
  this._options = {}
  this._imports = []
  this._messages = {}
}
util.inherits(ProtoDescriptor, Descriptor)
module.exports = ProtoDescriptor


/** @override */
ProtoDescriptor.prototype.inspect = function () {
  return util.inspect({
    name: this.getName(),
    package: this._package,
    messages: this._messages,
    options: this._options,
    imports: this._imports
  }, false, null)
}


/** @override */
ProtoDescriptor.prototype.toTemplateObject = function () {
  return {
    name: this.getName(),
    package: this._package,
    options: this._options,
    messages: helper.values(this._messages, helper.toTemplateObject)
  }
}


ProtoDescriptor.prototype.getName = function () {
  return path.basename(this._filePath)
}


ProtoDescriptor.prototype.setPackage = function (package) {
  this._package = package
  return this
}


ProtoDescriptor.prototype.getPackage = function () {
  return this._package
}


ProtoDescriptor.prototype.addOption = function (name, value) {
  this._options[name] = value
  return this
}


ProtoDescriptor.prototype.getOption = function (name) {
  return this._options[name]
}


ProtoDescriptor.prototype.getOptionKeys = function () {
  return Object.keys(this._options)
}


ProtoDescriptor.prototype.addImport = function (filename) {
  this._imports.push(path.resolve(path.dirname(this._filePath), filename))
  return this
}


ProtoDescriptor.prototype.getImports = function () {
  return this._imports.concat()
}


ProtoDescriptor.prototype.addMessage = function (message) {
  this._messages[message.getName()] = message
  message.setParent(this)
  return this
}


ProtoDescriptor.prototype.getMessage = function (name) {
  return this._messages[name]
}


ProtoDescriptor.prototype.getMessages = function () {
  return helper.values(this._messages)
}


ProtoDescriptor.prototype.getMessageTypes = function () {
  return Object.keys(this._messages)
}


ProtoDescriptor.prototype.findType = function (name) {
  if (this._messages[name]) return this._messages[name]

  var parts = name.split('.')

  if (parts[0] == this._package) {
    parts.shift()
    return this.findType(parts.join('.'))

  } else {

  }
}
