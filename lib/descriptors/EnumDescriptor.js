var util = require('util')
var Descriptor = require('./Descriptor')


function EnumDescriptor(name) {
  Descriptor.call(this)

  this._name = name
  this._numbers = {}
  this._names = {}
}
util.inherits(EnumDescriptor, Descriptor)
module.exports = EnumDescriptor


EnumDescriptor.prototype.inspect = function () {
  return util.inspect(this._names, false, null)
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
