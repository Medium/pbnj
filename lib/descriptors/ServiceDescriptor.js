
/**
 * @fileoverview Descriptor class representing a service.
 */

var util = require('util')
var Descriptor = require('./Descriptor')
var helper = require('../helper')

/**
 * @param {string} name Name of the service
 * @constructor
 * @extends {Descriptor}
 */
function ServiceDescriptor(name) {
  Descriptor.call(this)

  this._name = name
  this._package = ''
  this._methods = {} // by name
  this._methodSequence = [] // note(djm): preserves method sequence w/in the service
}
util.inherits(ServiceDescriptor, Descriptor)
module.exports = ServiceDescriptor


/** @override */
ServiceDescriptor.prototype.inspect = function () {
  return util.inspect(this._names, false, null)
}

/** @override */
ServiceDescriptor.prototype.toTemplateObject = function () {
  return {
    name: this._name,
    fullName: helper.joinPackage(this._package, this._name),
    methods: this._methodSequence.map(helper.toTemplateObject)
  }
}


ServiceDescriptor.prototype.setPackage = function (package) {
  this._package = package
}


ServiceDescriptor.prototype.getName = function () {
  return this._name
}


/**
 * @param {MethodDescriptor} method The next method in the service
 */
ServiceDescriptor.prototype.addMethod = function (method) {
  this._methods[method.getName()] = method
  this._methodSequence.push(method)
  method.setParent(this)
  return this
}


/**
 * @returns {Array.<MethodDescriptor>} the sequence of methods in the service
 */
ServiceDescriptor.prototype.getMethods = function () {
  return this._methodSequence.concat()
}


ServiceDescriptor.prototype.getMethod = function (name) {
  return this._methods[name]
}
