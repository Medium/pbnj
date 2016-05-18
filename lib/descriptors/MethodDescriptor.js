
/**
 * @fileoverview Descriptor class representing a service rpc method.
 */

var util = require('util')
var Descriptor = require('./Descriptor')
var FieldType = require('../FieldType')
var helper = require('../helper')

/**
 * @param {string} name Name of the method
 * @param {string|FieldType} inputType The method input type, e.g. string or int32
 * @param {string|FieldType} outputType The method output type, e.g. string or int32

 * @constructor
 * @extends {Descriptor}
 */
function MethodDescriptor(name, inputType, outputType) {
  Descriptor.call(this)

  this._name = name
  this._inputType = inputType
  this._inputTypeDescriptor = null
  this._outputType = outputType
  this._outputTypeDescriptor = null
  this._options = {}
}
util.inherits(MethodDescriptor, Descriptor)
module.exports = MethodDescriptor


/** @override */
MethodDescriptor.prototype.toTemplateObject = function () {
  return {
    name: this._name,
    camelName: this.getCamelName(),
    titleName: this.getTitleName(),
    upperUnderscoreName: this.getUpperUnderscoreName(),

    inputType: this.getInputType(),
    outputType: this.getOutputType(),

    baseInputType: this.getBaseInputType(),
    baseOutputType: this.getBaseOutputType(),

    rawInputType: this._inputType,
    rawOutputType: this._outputType,

    inputTypeDescriptor: this._inputTypeDescriptor ?
      this._inputTypeDescriptor.toTemplateObject() : null,
    outputTypeDescriptor: this._outputTypeDescriptor ?
      this._outputTypeDescriptor.toTemplateObject() : null,

    options: this._options
  }
}


MethodDescriptor.prototype.getName = function () {
  return this._name
}


MethodDescriptor.prototype.getCamelName = function () {
  return helper.toLowerCaseFirstLetter(this._name)
}


MethodDescriptor.prototype.getTitleName = function () {
  return helper.toTitleCase(this._name)
}


MethodDescriptor.prototype.getUpperUnderscoreName = function () {
  return helper.toUpperUnderscoreCase(this._name)
}


/**
 * @return {boolean} Whether the input is one of the built-in protobuf types.
 */
MethodDescriptor.prototype.isNativeInputType = function () {
  return !!FieldType[this._inputType]
}


/**
 * @return {boolean} Whether the output is one of the built-in protobuf types.
 */
MethodDescriptor.prototype.isNativeOutputType = function () {
  return !!FieldType[this._outputType]
}


/**
 * @return {MessageDescriptor|EnumDescriptor} The type of the input.
 *     Null if the input is a native type.
 */
MethodDescriptor.prototype.getInputTypeDescriptor = function () {
  return this._inputTypeDescriptor
}


/**
 * @return {MessageDescriptor|EnumDescriptor} The type of the output.
 *     Null if the output is a native type.
 */
MethodDescriptor.prototype.getOutputTypeDescriptor = function () {
  return this._outputTypeDescriptor
}


/**
 * @param {MessageDescriptor|EnumDescriptor} input The type of the input
 * @param {MessageDescriptor|EnumDescriptor} output The type of the output
 */
MethodDescriptor.prototype.setTypeDescriptors = function (input, output) {
  this._inputTypeDescriptor = input
  this._outputTypeDescriptor = output
}


MethodDescriptor.prototype.getInputType = function () {
  return FieldType[this._inputType] || this._inputType
}


MethodDescriptor.prototype.getOutputType = function () {
  return FieldType[this._outputType] || this._outputType
}


MethodDescriptor.prototype.getBaseInputType = function () {
  var parts = this.getInputType().split('.')
  return parts[parts.length - 1]
}


MethodDescriptor.prototype.getBaseOutputType = function () {
  var parts = this.getOutputType().split('.')
  return parts[parts.length - 1]
}


MethodDescriptor.prototype.getRawInputType = function () {
  return this._inputType
}


MethodDescriptor.prototype.getRawOutputType = function () {
  return this._outputType
}


MethodDescriptor.prototype.addOption = function (name, value) {
  this._options[name] = value
  return this
}


MethodDescriptor.prototype.getOption = function (name) {
  return this._options[name]
}

