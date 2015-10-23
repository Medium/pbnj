
/**
 * @fileoverview Descriptor class that represents an individual PB message.
 */

var util = require('util')
var Descriptor = require('./Descriptor')
var helper = require('../helper')


/**
 * @param {string} name The message name
 * @constructor
 * @extends {Descriptor}
 */
function MessageDescriptor(name) {
  Descriptor.call(this)

  this._name = name
  this._options = {}
  this._messages = {}
  this._enums = {}
  this._fields = {}
  this._fieldNames = {}
}
util.inherits(MessageDescriptor, Descriptor)
module.exports = MessageDescriptor


/** @override */
MessageDescriptor.prototype.inspect = function () {
  return util.inspect(this.toTemplateObject(), false, null)
}


/**
 * @param {boolean=} opt_skipFields
 * @override
 */
MessageDescriptor.prototype.toTemplateObject = function (opt_skipFields) {
  var obj = {
    name: this._name,
    camelName: this.getCamelName(),
    options: this._options
  }

  if (!opt_skipFields) {
    obj.fields = helper.values(this._fields, helper.toTemplateObject),
    obj.messages = helper.values(this._messages, helper.toTemplateObject),
    obj.enums = helper.values(this._enums, helper.toTemplateObject)
  }

  return obj
}


MessageDescriptor.prototype.addOption = function (name, value) {
  this._options[name] = value
  return this
}


MessageDescriptor.prototype.getOption = function (name) {
  return this._options[name]
}


MessageDescriptor.prototype.getOptionKeys = function () {
  return Object.keys(this._options)
}


MessageDescriptor.prototype.getName = function () {
  return this._name
}

MessageDescriptor.prototype.getCamelName = function () {
  return helper.toLowerCaseFirstLetter(this._name)
}


MessageDescriptor.prototype.addField = function (field) {
  this._fields[field.getTag()] = field
  this._fieldNames[field.getName()] = field
  field.setParent(this)
  return this
}

/**
 * @param {string} name
 * @return {MessageDescriptor}
 */
MessageDescriptor.prototype.removeFieldByName = function (name) {
  var field = this.getField(name)
  if (!field) {
    throw new Error('Field not found: ' + name)
  }
  return this._removeField(field)
}

/**
 * @param {FieldDescriptor} field
 * @return {MessageDescriptor}
 */
MessageDescriptor.prototype._removeField = function (field) {
  delete this._fields[field.getTag()]
  delete this._fieldNames[field.getName()]
  field.setParent(this)
  return this
}

MessageDescriptor.prototype.getField = function (name) {
  return this._fieldNames[name] || this._fieldNames[helper.toProtoCase(name)] || null
}


MessageDescriptor.prototype.getFieldByTag = function (tag) {
  return this._fields[tag] || null
}


MessageDescriptor.prototype.getFields = function () {
  return helper.values(this._fields)
}


MessageDescriptor.prototype.getFieldNames = function () {
  return Object.keys(this._fieldNames)
}


MessageDescriptor.prototype.addMessage = function (message) {
  this._messages[message.getName()] = message
  message.setParent(this)
  return this
}


MessageDescriptor.prototype.getMessage = function (name) {
  return this._messages[name]
}


MessageDescriptor.prototype.getMessages = function () {
  return helper.values(this._messages)
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
