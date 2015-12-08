
/**
 * @fileoverview Descriptor class representing a field in a PB message.
 */

var util = require('util')
var Descriptor = require('./Descriptor')
var helper = require('../helper')

/**
 * @param {string} name The field name
 * @param {number} oneofIndex The oneofIndex for this field
 * @constructor
 * @extends {Descriptor}
 */
function OneofDescriptor(name, oneofIndex) {
  Descriptor.call(this)

  this._name = name
  this._oneofIndex = oneofIndex
}
util.inherits(OneofDescriptor, Descriptor)
module.exports = OneofDescriptor


/** @override */
OneofDescriptor.prototype.toTemplateObject = function () {
  return {
    name: this._name,
    camelName: this.getCamelName(),
    titleName: this.getTitleName(),
    upperUnderscoreName: this.getUpperUnderscoreName(),
    oneofIndex: this._oneofIndex
  }
}


OneofDescriptor.prototype.getName = function () {
  return this._name
}


OneofDescriptor.prototype.getCamelName = function () {
  return helper.toCamelCase(this._name)
}


OneofDescriptor.prototype.getTitleName = function () {
  return helper.toTitleCase(this._name)
}


OneofDescriptor.prototype.getUpperUnderscoreName = function () {
  return helper.toUpperUnderscoreCase(this._name)
}


OneofDescriptor.prototype.getOneofIndex = function () {
  return this._oneofIndex
}
