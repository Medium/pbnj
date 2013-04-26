// Copyright 2013 The Obvious Corporation.

/**
 * @fileoverview Class for managing a "project", in otherwords the parsing and
 * compilation of a set of protocol buffer schemas.
 */

var kew = require('kew')
var fs = require('fs')
var path = require('path')
var soynode = require('soynode')
var util = require('util')

var helper = require('./helper')
var parser = require('./parser')

soynode.setOptions({tmpDir: '/tmp/pbnj', allowDynamicRecompile: false, eraseTemporaryFiles: false})


/**
 * @param {string=} opt_basePath Defaults to current working directory.
 * @constructor
 */
function Project(opt_basePath) {

  /**
   * Look for protos starting at the specified path, defaults to cwd.
   * @private {string}
   */
  this._basePath = opt_basePath || process.cwd()

  /**
   * Where files are output to.
   * @private {string}
   */
  this._outDir = path.join(this._basePath, 'genfiles')

  /**
   * Suffix for generated files.
   * @private {string}
   */
  this._defaultSuffix = '.js'

  /**
   * Map of filenames to the parsed proto descriptor.
   * @private {Object.<pbnj.ProtoDescriptor>}
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
 * Sets the output directory to use.  It will be resolved relative to baseDir.
 * @param {string} outDir
 * @return {Project}
 */
Project.prototype.setOutDir = function (outDir) {
  this._outDir = path.resolve(this._basePath, outDir)
  return this
}


/**
 * Processes a protocol buffer schema file, synchronously.
 * @param {string} fileName Filename relative to the project's base path.
 * @param {boolean=} opt_followImports Whether to parse imported files.
 */
Project.prototype.processFile = function (fileName, opt_followImports) {
  if (!this._protos[fileName]) {
    var filePath = path.resolve(this._basePath, fileName)
    var fileContents = fs.readFileSync(filePath, 'utf8')
    var proto = this._protos[fileName] = parser(path.basename(fileName), fileContents)
    if (opt_followImports) {
      var imports = proto.getImports()
      // Resolve imports relative to the directory the importing file is in.
      var dir = path.dirname(filePath)
      for (var i = 0; i < imports.length; i++) {
        var importPath = path.resolve(dir, imports[i])
        this.processFile(importPath, true)
      }
    }
  }
}


/**
 * Loads Closure Templates in the provided folder, relative to the project's basePath.
 * @param {string} templateFolder
 * @return {Promise} A promise for when the templates have compiled (or errored).
 */
Project.prototype.loadTemplates = function (templateFolder) {
  var deferred = kew.defer()
  soynode.compileTemplates(path.resolve(this._basePath, templateFolder), deferred.makeNodeResolver())
  return deferred.promise
}


/**
 * Compiles all the protos in the project using the given template and saves them in the output
 * direcotry.
 * @param {string} protoTemplate The template name
 * @param {string} suffix Suffix to append to the generated filename
 * @return {Promise} A promise of when the compile has finished
 */
Project.prototype.compile = function (protoTemplate, suffix) {
  return kew.all(this.getProtos().map(function (proto) {
    var filename = path.join(this._outDir, proto.getName() + (suffix || this._defaultSuffix))

    return helper.mkdir(filename).then(function () {
      var contents = soynode.render(protoTemplate, proto.toTemplateObject())
      var deferred = kew.defer()
      console.log('Writing ' + filename)
      fs.writeFile(filename, contents, deferred.makeNodeResolver())
      return deferred.promise
    }.bind(this))

  }.bind(this)))
}


/**
 * Gets a list of parsed proto descriptors.
 * @return {Array.<ProtoDescriptor>}
 */
Project.prototype.getProtos = function () {
  return helper.values(this._protos)
}


/**
 * Finds the descriptor definition for a particular type name.
 * @param {string} name The type name, e.g. proto.project.FooBar
 * @return {Descriptor}
 */
Project.prototype.findType = function (name) {
  // TODO(dan): Fully implement this to walk through the tree.
  for (var file in this._protos) {
    var descriptor = this._protos[file].findType(name)
    if (descriptor) return descriptor
  }
  return null
}
