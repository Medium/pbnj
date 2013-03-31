// Copyright 2013 The Obvious Corporation.

/**
 * @fileoverview Descriptor class representing a field in a PB message.
 */

var util = require('util')
var Descriptor = require('./Descriptor')

/**
 * @param {FieldType} type The field type, e.g. string or int32
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
FieldDescriptor.prototype.inspect = function () {
  return util.inspect({
    name: this._name,
    fieldType: this._isOptional ? 'optional' : this._isRepeated ? 'repeated' : 'required',
    protoType: this._type,
    options: this._options
  }, false, null)
}


FieldDescriptor.prototype.getType = function () {
  return this._type
}


FieldDescriptor.prototype.getName = function () {
  return this._name
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


FieldDescriptor.prototype.setRequired = function (isRequired) {
  this._isRequired = isRequired
  return this
}


FieldDescriptor.prototype.isRequired = function () {
  return this._isRequired
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
