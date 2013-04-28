
/**
 * @fileoverview Descriptor class representing a field in a PB message.
 */

var util = require('util')
var Descriptor = require('./Descriptor')
var FieldType = require('../FieldType')
var helper = require('../helper')

/**
 * @param {string|FieldType} type The field type, e.g. string or int32
 * @param {string} name The field name
 * @param {number} tag The tag number for this field
 * @constructor
 * @extends {Descriptor}
 */
function FieldDescriptor(type, name, tag) {
  Descriptor.call(this)

  this._type = type
  this._name = name
  this._tag = tag
  this._isOptional = false
  this._isRepeated = false
  this._options = {}
}
util.inherits(FieldDescriptor, Descriptor)
module.exports = FieldDescriptor


/** @override */
FieldDescriptor.prototype.toTemplateObject = function () {
  return {
    rawName: this._name,
    rawType: this._type,
    name: this.getCamelName(),
    type: this.getType(),
    tag: this._tag,
    isOptional: this._isOptional,
    isRepeated: this._isRepeated,
    options: this._options
  }
}


FieldDescriptor.prototype.getType = function () {
  return FieldType[this._type] || this._type
}


FieldDescriptor.prototype.getRawType = function () {
  return this._type
}


FieldDescriptor.prototype.getName = function () {
  return this._name
}

FieldDescriptor.prototype.getCamelName = function () {
  return helper.toCamelCase(this._name)
}

FieldDescriptor.prototype.getTag = function () {
  return this._tag
}


FieldDescriptor.prototype.setOptional = function (isOptional) {
  this._isOptional = isOptional
  return this
}


FieldDescriptor.prototype.isOptional = function () {
  return this._isOptional
}


FieldDescriptor.prototype.setRepeated = function (isRepeated) {
  this._isRepeated = isRepeated
  return this
}


FieldDescriptor.prototype.isRepeated = function () {
  return this._isRepeated
}


FieldDescriptor.prototype.addOption = function (name, value) {
  this._options[name] = value
  return this
}


FieldDescriptor.prototype.getOption = function (name) {
  return this._options[name]
}
