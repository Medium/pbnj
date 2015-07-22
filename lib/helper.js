
/**
 * @fileoverview Helpers for working with proto descriptors.
 */

var kew = require('kew')
var mkdirp = require('mkdirp')
var path = require('path')

/**
 * Returns the values in the array, using an optional mapping function.
 * @param {Object} object
 * @param {Function} opt_mapper
 * @return {Array.<Object>}
 */
exports.values = function (object, opt_mapper) {
  return Object.keys(object).map(function (key) {
    return opt_mapper ? opt_mapper(object[key]) : object[key]
  })
}


/**
 * Deep clone of an object, does not handle circular references so use with care.
 * @param {Object} object
 * @return {Object}
 */
exports.clone = function (object) {
  if (object === null) return null
  if (typeof object != 'object') return object
  var clone = {}
  for (var key in object) {
    clone[key] = exports.clone(object[key])
  }
  return clone
}


/**
 * Clones the first object in the argument list and then extends it with the properties in all
 * subsequent arguments.
 * @param {Object} var_args
 * @return {Object}
 */
exports.extend = function (var_args) {
  var core = exports.clone(arguments[0])
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) core[key] = arguments[i][key]
  }
  return core
}


/**
 * Converts a string in underscore_case to camelCase.
 * @param {string} str
 * @return {string}
 */
exports.toCamelCase = function(str) {
  // If it's all upper-case, convert it to lower case
  // (for constant names like TWO_WORDS)
  if (str.toUpperCase() == str) {
    str = str.toLowerCase()
  }
  return String(str).replace(/\_([a-z])/g, function(all, match) {
    return match.toUpperCase()
  })
}


/**
 * Converts a string in underscore_case to TitleCase.
 * @param {string} str
 * @return {string}
 */
exports.toTitleCase = function(str) {
  var camelCase = exports.toCamelCase(str)
  return camelCase[0].toUpperCase() + camelCase.substr(1)
}



/**
 * Converts a string from camelCase to proto_case (e.g. from
 * "multiPartString" to "multi_part_string").
 * @param {string} str
 * @return {string}
 */
exports.toProtoCase = function(str) {
  return String(str).replace(/([A-Z])/g, '_$1').toLowerCase();
};


/**
 * Returns item.toTemplateObject, intended to be a convenient helper for Array.map()
 * @param {Descriptor} item
 * @return {Object}
 */
exports.toTemplateObject = function (item) {
  return item.toTemplateObject()
}


/**
 * Synchronously ensures a directory exists for the file.
 * @param {string} name
 * @return {Promise}
 */
exports.mkdir = function(name) {
  var deferred = kew.defer()
  var dir = path.dirname(name)
  mkdirp(dir, deferred.makeNodeResolver())
  return deferred.promise
}
