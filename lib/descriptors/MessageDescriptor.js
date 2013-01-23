var util = require('util')
var Descriptor = require('./Descriptor')

function MessageDescriptor(name) {
  Descriptor.call(this)

  this._name = name
  this._messages = {}
  this._enums = {}
  this._fields = {}
  this._fieldNames = {}
}
util.inherits(MessageDescriptor, Descriptor)
module.exports = MessageDescriptor


MessageDescriptor.prototype.inspect = function (depth) {
  return util.inspect({
    name: this._name,
    fields: this._fields,
    messages: this._messages,
    enums: this._enums
  }, false, null)
}


MessageDescriptor.prototype.getName = function () {
  return this._name
}


MessageDescriptor.prototype.addField = function (field) {
  this._fields[field.getTag()] = field
  this._fieldNames[field.getName()] = field
  field.setParent(this)
  return this
}


MessageDescriptor.prototype.getField = function (name) {
  return this._fieldNames[name]
}


MessageDescriptor.prototype.addMessage = function (message) {
  this._messages[message.getName()] = message
  message.setParent(this)
  return this
}


MessageDescriptor.prototype.getMessage = function (name) {
  return this._messages[name]
}


MessageDescriptor.prototype.getMessageTypes = function () {
  return Object.keys(this._messages)
}


MessageDescriptor.prototype.addEnum = function (enumeration) {
  this._enums[enumeration.getName()] = enumeration
  enumeration.setParent(this)
  return this
}


MessageDescriptor.prototype.getEnum = function (name) {
  return this._enums[name]
}


MessageDescriptor.prototype.getEnumTypes = function () {
  return Object.keys(this._enums)
}
