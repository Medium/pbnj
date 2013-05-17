
/**
 * @fileoverview Descriptor class representing an enumeration.
 */

var util = require('util')
var Descriptor = require('./Descriptor')

/**
 * @param {string} name Name of the enumeration
 * @constructor
 * @extends {Descriptor}
 */
function EnumDescriptor(name) {
  Descriptor.call(this)

  this._name = name
  this._numbers = {}
  this._names = {}
}
util.inherits(EnumDescriptor, Descriptor)
module.exports = EnumDescriptor


/** @override */
EnumDescriptor.prototype.inspect = function () {
  return util.inspect(this._names, false, null)
}

/** @override */
EnumDescriptor.prototype.toTemplateObject = function () {
  var numbers = this.getNumbers()
  numbers.sort()
  return {
    name: this._name,
    values: numbers.map(function (n) {
      return this.getValueForNumber(n)
    }, this)
  }
}

EnumDescriptor.prototype.getName = function () {
  return this._name
}


EnumDescriptor.prototype.addValue = function (name, number) {
  this._names[number] = name
  this._numbers[name] = number
  return this
}


EnumDescriptor.prototype.getNumbers = function () {
  return Object.keys(this._names)
}


EnumDescriptor.prototype.getNames = function () {
  return Object.keys(this._numbers)
}


EnumDescriptor.prototype.getValueForNumber = function (number) {
  var name = this._names[number]
  return name ? { name: name, number: number } : null
}


EnumDescriptor.prototype.getNumberForName = function (name) {
  var number = this._numbers[name]
  return number ? { name: name, number: number } : null
}
