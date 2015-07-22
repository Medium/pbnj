
/**
 * @fileoverview Extend class for extending a pb message.
 */

var util = require('util')
var Descriptor = require('./Descriptor')
var helper = require('../helper')


/**
 * @param {string} name The message name
 * @constructor
 * @extends {Descriptor}
 */
function ExtendDescriptor(name) {
  Descriptor.call(this)

  this._name = name
  this._fields = {}
  this._fieldNames = {}
}
util.inherits(ExtendDescriptor, Descriptor)
module.exports = ExtendDescriptor


/**
 * Merge this Extend into the original message.
 */
ExtendDescriptor.prototype.mergeInto = function (message) {
  for (var key in this._fields) {
    var field = this._fields[key]
    if (message.getFieldByTag(field.getTag())) {
      throw new Error(
          'duplicate tag name in extend "' + this._name + '" at field ' + field.getName())
    }

    message.addField(field)
  }
}


/** @override */
ExtendDescriptor.prototype.inspect = function (depth) {
  return util.inspect(this.toTemplateObject(), false, null)
}


/** @override */
ExtendDescriptor.prototype.toTemplateObject = function () {
  return {
    name: this._name,
    fields: helper.values(this._fields, helper.toTemplateObject)
  }
}


ExtendDescriptor.prototype.getName = function () {
  return this._name
}


ExtendDescriptor.prototype.addField = function (field) {
  this._fields[field.getTag()] = field
  this._fieldNames[field.getName()] = field
  field.setParent(this)
  return this
}


ExtendDescriptor.prototype.getField = function (name) {
  return this._fieldNames[name] || this._fieldNames[helper.toProtoCase(name)] || null
}


ExtendDescriptor.prototype.getFieldByTag = function (tag) {
  return this._fields[tag] || null
}


ExtendDescriptor.prototype.getFields = function () {
  return helper.values(this._fields)
}


ExtendDescriptor.prototype.getFieldNames = function () {
  return Object.keys(this._fieldNames)
}
