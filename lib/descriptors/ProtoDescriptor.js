// Copyright 2013 The Obvious Corporation.

/**
 * @fileoverview Descriptor class representing a single protocol buffer file.
 */

var util = require('util')
var Descriptor = require('./Descriptor')

/**
 * @constructor
 * @extends {Descriptor}
 */
function ProtoDescriptor() {
  Descriptor.call(this)

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
    package: this._package,
    messages: this._messages,
    options: this._options,
    imports: this._imports
  }, false, null)
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
  this._imports.push(filename)
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


ProtoDescriptor.prototype.getMessageTypes = function () {
  return Object.keys(this._messages)
}


ProtoDescriptor.prototype.getType = function (name) {
  if (this._messages[name]) return this._messages[name]

  var parts = name.split('.')

  if (parts[0] == this._package) {
    parts.shift()
    return this.getType(parts.join('.'))

  } else {

  }
}
