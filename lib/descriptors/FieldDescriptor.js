
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
  this._typeDescriptor = null
  this._name = name
  this._tag = tag
  this._isOptional = false
  this._isRepeated = false
  this._oneofIndex = -1
  this._options = {}
}
util.inherits(FieldDescriptor, Descriptor)
module.exports = FieldDescriptor


/** @override */
FieldDescriptor.prototype.toTemplateObject = function () {
  var typeDescriptor = null
  var self = this

  return {
    name: this._name,
    camelName: this.getCamelName(),
    titleName: this.getTitleName(),
    upperUnderscoreName: this.getUpperUnderscoreName(),
    rawType: this._type,
    baseType: this.getBaseType(),
    type: this.getType(),
    get typeDescriptor() {
      if (typeDescriptor) return typeDescriptor
      if (!self._typeDescriptor) return null
      return ((typeDescriptor = self._typeDescriptor.toTemplateObject()))
    },
    tag: this._tag,
    isOptional: this._isOptional,
    isRepeated: this._isRepeated,
    hasOneofIndex: this.hasOneofIndex(),
    oneofIndex: this._oneofIndex,
    options: this._options
  }
}


/**
 * @return {boolean} Whether this is one of the built-in protobuf types.
 */
FieldDescriptor.prototype.isNativeType = function () {
  return !!FieldType[this._type]
}


/**
 * @return {MessageDescriptor|EnumDescriptor} The type descriptor for this
 *     field's scalar type. Null if this is a primitive type.
 */
FieldDescriptor.prototype.getTypeDescriptor = function () {
  return this._typeDescriptor
}


/**
 * @param {MessageDescriptor|EnumDescriptor} desc The type descriptor for this
 *     field's scalar type, to be set after each protobufs is parsed.
 */
FieldDescriptor.prototype.setTypeDescriptor = function (desc) {
  this._typeDescriptor = desc
}


FieldDescriptor.prototype.getType = function () {
  return FieldType[this._type] || this._type
}


FieldDescriptor.prototype.getBaseType = function () {
  var parts = this.getType().split('.')
  return parts[parts.length - 1]
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


FieldDescriptor.prototype.getTitleName = function () {
  return helper.toTitleCase(this._name)
}


FieldDescriptor.prototype.getUpperUnderscoreName = function () {
  return helper.toUpperUnderscoreCase(this._name)
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


FieldDescriptor.prototype.setOneofIndex = function (oneofIndex) {
  this._oneofIndex = oneofIndex
  return this
}


FieldDescriptor.prototype.getOneofIndex = function () {
  return this._oneofIndex
}


FieldDescriptor.prototype.hasOneofIndex = function () {
  return this._oneofIndex != -1
}


FieldDescriptor.prototype.addOption = function (name, value) {
  this._options[name] = value
  return this
}


FieldDescriptor.prototype.getOption = function (name) {
  return this._options[name]
}
