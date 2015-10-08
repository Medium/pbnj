
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
  this._importNames = []
  this._imports = []
  this._messages = {}
  this._enums = {}
  this._extends = {}

  this._rescursing = false
}
util.inherits(ProtoDescriptor, Descriptor)
module.exports = ProtoDescriptor


/** @override */
ProtoDescriptor.prototype.inspect = function () {
  return util.inspect({
    name: this.getName(),
    package: this._package,
    messages: this._messages,
    extends: this._extends,
    enums: this._enums,
    options: this._options,
    importNames: this._importNames,
    imports: this._imports
  }, false, null)
}


/** @override */
ProtoDescriptor.prototype.toTemplateObject = function () {
  if (this._recursing) {
    throw new Error('import loop detected: ' + this.getName())
  }
  this._recursing = true

  var result = {
    name: this.getName(),
    package: this._package,
    options: this._options,
    messages: helper.values(this._messages, helper.toTemplateObject),
    extends: helper.values(this._messages, helper.toTemplateObject),
    enums: helper.values(this._enums, helper.toTemplateObject),
    importNames: this._importNames,
    imports: this._imports.map(helper.toTemplateObject)
  }
  this._recursing = false
  return result
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


ProtoDescriptor.prototype.addImportName = function (fileName) {
  this._importNames.push(fileName)
  return this
}


ProtoDescriptor.prototype.getImportNames = function () {
  return this._importNames.concat()
}


ProtoDescriptor.prototype.addImport = function (protoDescriptor) {
  this._imports.push(protoDescriptor)
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


ProtoDescriptor.prototype.addExtend = function (extend) {
  this._extends[extend.getName()] = extend
  extend.setParent(this)
  return this
}


ProtoDescriptor.prototype.getExtend = function (name) {
  return this._extends[name]
}


ProtoDescriptor.prototype.getExtends = function () {
  return helper.values(this._extends)
}


ProtoDescriptor.prototype.addEnum = function (enumeration) {
  this._enums[enumeration.getName()] = enumeration
  enumeration.setParent(this)
  return this
}


ProtoDescriptor.prototype.getEnum = function (name) {
  return this._enums[name]
}


ProtoDescriptor.prototype.getEnumTypes = function () {
  return Object.keys(this._enums)
}


ProtoDescriptor.prototype.findType = function (name) {
  if (this._messages[name]) return this._messages[name]

  var parts = name.split('.')

  if (parts[0] == this._package) {
    parts.shift()
    return this.findType(parts.join('.'))

  }
  return null
}
