// Copyright 2013 The Obvious Corporation.

/**
 * @fileoverview Base class for protocol buffer descriptors.
 */


/**
 * @constructor
 */
function Descriptor() {
  this._parent = null
}
module.exports = Descriptor


/**
 * Exposes a representation of the descriptor for `util.inspect`. Sub-classes
 * should override in order to show relavent information.
 * @return {string}
 */
Descriptor.prototype.inspect = function () {
  return util.inspect(this.toTemplateObject(), false, null)
}


/**
 * Returns a JS object containing fields for use in a template.
 * @return {!Object}
 */
Descriptor.prototype.toTemplateObject = function () {
  return {}
}


/**
 * Sets the parent descriptor.
 * @param {Descriptor} parent
 */
Descriptor.prototype.setParent = function (parent) {
  this._parent = parent
}


/**
 * Gets the parent descriptor
 * @return {Descriptor}
 */
Descriptor.prototype.getParent = function () {
  return this._parent
}


/**
 * Gets the ancestor chain for this descriptor.
 * @return {Array.<Descriptor>}
 */
Descriptor.prototype.getAncestors = function () {
  var ancestors = []
  var parent = this._parent
  while (parent) {
    ancestors.push(parent)
    parent = parent.getParent()
  }
  return ancestors
}
