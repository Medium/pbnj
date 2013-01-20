var util = require('util')


function EnumDescriptor(name) {
  this._name = name
  this._indexes = {}
  this._values = {}
}
module.exports = EnumDescriptor


EnumDescriptor.prototype.inspect = function () {
  return util.inspect(this._indexes, false, null)
}


EnumDescriptor.prototype.getName = function () {
  return this._name
}


EnumDescriptor.prototype.addValue = function (value, index) {
  this._indexes[index] = value
  this._values[value] = index
  return this
}


EnumDescriptor.prototype.getIndexes = function () {
  return Object.keys(this._indexes)
}


EnumDescriptor.prototype.getValues = function () {
  return Object.keys(this._values)
}


EnumDescriptor.prototype.indexOf = function (value) {
  return this._values[value] || -1
}


EnumDescriptor.prototype.valueAt = function (index) {
  return this._indexes[index]
}
