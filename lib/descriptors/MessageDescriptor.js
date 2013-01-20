var util = require('util')

function MessageDescriptor(name) {
  this._name = name
  this._messages = {}
  this._enums = {}
  this._fields = {}
  this._fieldNames = {}
}
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
  return this
}


MessageDescriptor.prototype.getField = function (name) {
  return this._fieldNames[name]
}


MessageDescriptor.prototype.addMessage = function (name, message) {
  this._messages[name] = message
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
  return this
}


MessageDescriptor.prototype.getEnum = function (name) {
  return this._enums[name]
}


MessageDescriptor.prototype.getEnumTypes = function () {
  return Object.keys(this._enums)
}
