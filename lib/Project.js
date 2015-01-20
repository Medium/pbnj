
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
   * The template directory, relative to the base path.
   * @private {string}
   */
  this._templateDir = ''

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

  /**
   * Array of compile jobs.
   * @private {Array.<{proto: string, template: string, suffix: string}>}
   */
  this._compileJobs = []
}
module.exports = Project


/**
 * @param {ProtoDescriptor} descriptor
 * @param {string} outFile
 * @param {string} compiledContents
 * @return {Promise}
 */
Project.prototype._outputFn = Project.defaultOutputFn = function (descriptor, outFile, compiledContents) {
  return helper.mkdir(outFile).then(function () {
    var deferred = kew.defer()
    fs.writeFile(outFile, compiledContents, deferred.makeNodeResolver())
    return deferred.promise
  })
}


/**
 * Gets a string representation of this object, compatible with `util.inspect`
 * @return {string}
 */
Project.prototype.inspect = function () {
  return util.inspect({
    basePath: this._basePath,
    outDir: this._outDir,
    templateDir: this._templateDir,
    jobs: this._compileJobs,
    protos: this._protos
  }, false, null)
}


/**
 * Loads Closure Templates in the provided folder, relative to the project's basePath.
 * @param {string} templateFolder
 * @return {Project}
 */
Project.prototype.setTemplateDir = function (templateFolder) {
  this._templateDir = templateFolder
  return this
}


/**
 * Overrides the output function, default writes the compiled contents to a file. Arguments will
 * be the proto descriptor, the filename that would normally be written, and the compiled contents.
 * @param {{function (ProtoDescriptor, string, string) : Promise}} outputFn
 * @return {Project}
 */
Project.prototype.setOutputFn = function (outputFn) {
  this._outputFn = outputFn
  return this
}


/**
 * Sets the output directory to use.  It will be resolved relative to baseDir.
 * @param {string} outDir
 * @return {Project}
 */
Project.prototype.setOutDir = function (outDir) {
  this._outDir = this._resolve(outDir)
  return this
}


/**
 * Adds a compilation job.
 * @param {string} protoFile The proto file to compile, all imports will be followed.
 * @param {string} templateName The Soy template name to use when compiling.
 * @param {string=} opt_suffix Optional suffix for generated files.
 * @param {boolean=} opt_skipImports If true, dont' follow imports.
 * @return {Project}
 */
Project.prototype.addJob = function (protoFile, templateName, opt_suffix, opt_skipImports) {
  this.addProto(protoFile, !opt_skipImports)
  this._compileJobs.push({
    proto: this._resolve(protoFile),
    template: templateName,
    suffix: opt_suffix
  })
  return this
}


/**
 * Processes a protocol buffer schema file, synchronously.
 * @param {string} fileName Filename relative to the project's base path.
 * @param {boolean=} opt_followImports Whether to parse imported files.
 * @return {Project}
 */
Project.prototype.addProto = function (fileName, opt_followImports) {
  this._getProto(fileName, opt_followImports)
  return this
}

/**
 * Processes a protocol buffer schema file, synchronously.
 * @param {string} fileName Filename relative to the project's base path.
 * @param {boolean=} opt_followImports Whether to parse imported files.
 * @return {ProtoDescriptor}
 */
Project.prototype._getProto = function (fileName, opt_followImports) {
  // TODO(dan): Make async.

  var filePath = this._resolve(fileName)

  var proto = this._protos[filePath]
  if (!proto) {
    var fileContents = fs.readFileSync(filePath, 'utf8')
    proto = this._protos[filePath] = parser(filePath, fileContents)
    if (opt_followImports) {
      proto.getImportNames().forEach(function (importName) {
        proto.addImport(this._getProto(importName, true))
      }, this)
    }
  }
  return proto
}


/**
 * Executes all the compilation jobs.
 * @return {Promise} A promise of when all compilation jobs have finished/
 */
Project.prototype.compile = function () {
  soynode.setOptions({
    outputDir: this._outDir,
    uniqueDir: false,
    allowDynamicRecompile: false,
    eraseTemporaryFiles: false
  })

  var deferred = kew.defer()
  soynode.compileTemplates(this._resolve(this._templateDir), deferred.makeNodeResolver())

  return deferred.promise.then(function () {
    var promises = []

    for (var i = 0; i < this._compileJobs.length; i++) {
      var job = this._compileJobs[i]
      var protoDescriptors = this.getProtos(job.proto)
      for (var j = 0; j < protoDescriptors.length; j++) {
        var descriptor = protoDescriptors[j]
        var fileName = path.join(this._outDir, descriptor.getName() + (job.suffix || this._defaultSuffix))
        var contents = soynode.render(job.template, descriptor.toTemplateObject())
        promises.push(this._outputFn(descriptor, fileName, contents))
      }
    }

    return kew.all(promises)
  }.bind(this))
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


/**
 * Gets a list of parsed proto descriptors.
 * @param {string} opt_protoFile If specified, only the provided proto, and imported protos will be
 *    returned.
 * @return {Array.<ProtoDescriptor>}
 */
Project.prototype.getProtos = function (opt_protoFile) {
  if (!opt_protoFile) return helper.values(this._protos)

  var protoPath = this._resolve(opt_protoFile)

  if (this._protos[protoPath]) {
    return this._getImported(protoPath, {})

  } else {
    throw new Error('Unknown proto file [' + protoPath + ']')
  }
}


/**
 * Returns the full path relative to the base directory.
 * @param {string} fileName
 * @return {string}
 */
Project.prototype._resolve = function (fileName) {
  return path.resolve(this._basePath, fileName)
}


/**
 * Recursively gathers all imported protocol buffers
 * @param {string} file
 * @param {Object} visited
 * @return {Array.<ProtoDescriptor>}
 */
Project.prototype._getImported = function (file, visited) {
  visited[file] = true
  var protos = [this._protos[file]]
  var imports = this._protos[file].getImportNames()
  for (var i = 0; i < imports.length; i++) {
    if (!visited[imports[i]]) {
      protos = protos.concat(this._getImported(imports[i], visited))
    }
  }
  return protos
}
