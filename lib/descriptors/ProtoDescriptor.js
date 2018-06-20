
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
  this._syntax = 'proto2'
  this._package = ''
  this._options = {}
  this._importNames = []
  this._imports = []
  this._messages = {}
  this._services = {}
  this._enums = {}
  this._extends = {}
}
util.inherits(ProtoDescriptor, Descriptor)
module.exports = ProtoDescriptor


/** @override */
ProtoDescriptor.prototype.inspect = function () {
  return util.inspect({
    name: this.getName(),
    package: this._package,
    messages: this._messages,
    services: this._services,
    extends: this._extends,
    enums: this._enums,
    options: this._options,
    importNames: this._importNames,
    imports: this._imports
  }, false, null)
}


/** @override */
ProtoDescriptor.prototype.toTemplateObject = function () {
  var messages = null
  var services = null
  var extendObjs = null
  var enums = null
  var imports = null
  var self = this

  var result = {
    name: this.getName(),
    package: this._package,
    syntax: this._syntax,
    options: this._options,
    importNames: this._importNames,
    get messages() {
      if (messages) return messages
      return ((messages = helper.values(self._messages, helper.toTemplateObject)))
    },
    get services() {
      if (services) return services
      return ((services = helper.values(self._services, helper.toTemplateObject)))
    },
    get extends() {
      if (extendObjs) return extendObjs
      return ((extendObjs = helper.values(self._extends, helper.toTemplateObject)))
    },
    get enums() {
      if (enums) return enums
      return ((enums = helper.values(self._enums, helper.toTemplateObject)))
    },
    get imports() {
      if (imports) return imports
      return ((imports = self._imports.map(helper.toTemplateObject)))
    }
  }
  return result
}


ProtoDescriptor.prototype.getName = function () {
  return path.basename(this._filePath)
}


/** @return {string} */
ProtoDescriptor.prototype.getFilePath = function () {
  return this._filePath
}


ProtoDescriptor.prototype.setPackage = function (package) {
  this._package = package
  return this
}


ProtoDescriptor.prototype.getPackage = function () {
  return this._package
}

ProtoDescriptor.prototype.setSyntax = function (syntax) {
  this._syntax = syntax
  return this
}


ProtoDescriptor.prototype.getSyntax = function () {
  return this._syntax
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


ProtoDescriptor.prototype.addService = function (service) {
  this._services[service.getName()] = service
  service.setParent(this)
  return this
}


ProtoDescriptor.prototype.getService = function (name) {
  return this._services[name]
}


ProtoDescriptor.prototype.getServices = function () {
  return helper.values(this._services)
}


ProtoDescriptor.prototype.getServiceNames = function () {
  return Object.keys(this._services)
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


/**
 * @return {Array.<EnumDescriptor>}
 */
ProtoDescriptor.prototype.getEnums = function () {
  return helper.values(this._enums)
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
