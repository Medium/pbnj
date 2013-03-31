// Copyright 2013 The Obvious Corporation.

/**
 * @fileoverview Class for managing a "project", in otherwords the parsing and
 * compilation of a set of protocol buffer schemas.
 */

var fs = require('fs')
var path = require('path')
var util = require('util')

var parser = require('./parser')


/**
 * @param {string=} opt_basePath Defaults to current working directory.
 * @constructor
 */
function Project(opt_basePath) {

  /**
   * Look for protos starting at the specified path, defaults to cwd.
   * @type {string}
   */
  this._basePath = opt_basePath || process.cwd()

  /**
   * Map of filenames to the parsed proto descriptor.
   * @type {Object.<pbnj.ProtoDescriptor>}
   */
  this._protos = {}
}
module.exports = Project


/**
 * Gets a string representation of this object, compatible with `util.inspect`
 * @return {string}
 */
Project.prototype.inspect = function () {
  return util.inspect({
    basePath: this._basePath,
    protos: this._protos
  }, false, null)
}


/**
 * Processes a protocol buffer schema file.
 * @param {string} fileName Filename relative to the project's base path.
 * @param {boolean=} opt_followImports Whether to parse imported files.
 */
Project.prototype.processFile = function (fileName, opt_followImports) {
  if (!this._protos[fileName]) {
    var file = fs.readFileSync(path.join(this._basePath, fileName), 'utf8')
    var proto = this._protos[fileName] = parser(file)
    if (opt_followImports) {
      var imports = proto.getImports()
      for (var i = 0; i < imports.length; i++) {
        this.processFile(imports[i], true)
      }
    }
  }
}


/**
 * Gets a list of parsed proto descriptors.
 * @return {Array.<ProtoDescriptor>}
 */
Project.prototype.getProtos = function () {
  return this._protos
}


/**
 * Gets the descriptor definition for a particular type name.
 * @param {string} name The type name, e.g. proto.project.FooBar
 * @return {Descriptor}
 */
Project.prototype.getType = function (name) {
  for (var file in this._protos) {
    var descriptor = this._protos[file].getType(name)
    if (descriptor) return descriptor
  }
  return null
}
