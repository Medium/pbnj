
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
 * @param {string=} opt_basePath The base path, for a default configuration
 *     of protoc_path and out_path.
 * @constructor
 */
function Project(opt_basePath) {
  var basePath = opt_basePath || process.cwd()

  /** @private {string} */
  this._basePath = basePath

  /**
   * Look for protos starting at the specified path. Defaults to cwd and default includes.
   * @private {Array.<string>}
   */
  this._protocPaths = [basePath, path.resolve(__dirname, '../include')]

  /**
   * Default out dir
   * @private {string}
   */
  this._outDir = path.join(basePath, 'genfiles')

  /**
   * Where files are output to for each suffix.
   * @private {!Object<string, string>}
   */
  this._outDirs = {}

  /**
   * The template directory, relative to the base path.
   * @private {string}
   */
  this._templateDir = basePath

  /**
   * Suffix for generated files.
   * @private {string}
   */
  this._defaultSuffix = '.js'

  /**
   * Map of absolute filenames to the parsed proto descriptor.
   * @private {Object.<pbnj.ProtoDescriptor>}
   */
  this._protos = {}

  /**
   * Array of compile jobs.
   * @private {Array.<{proto: string, template: string, suffix: string}>}
   */
  this._compileJobs = []

  /** @private {boolean} */
  this._resolvedExtensions = false
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
    return kew.nfcall(fs.writeFile, outFile, compiledContents)
  })
}


/**
 * Gets a string representation of this object, compatible with `util.inspect`
 * @return {string}
 */
Project.prototype.inspect = function () {
  return util.inspect({
    basePath: this._basePath,
    protocPaths: this._protocPaths,
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
  this._templateDir = path.resolve(this._basePath, templateFolder)
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
 * Sets the output directory to use for each suffix. If no suffix is passed in, sets the default outDir.
 * It will be resolved relative to the first directory
 * @param {string} outDir
 * @param {string=} opt_suffix
 * @return {Project}
 */
Project.prototype.setOutDir = function (outDir, opt_suffix) {
  if (!opt_suffix) {
    this._outDir = path.resolve(this._basePath, outDir)
  } else {
    this._outDirs[opt_suffix] = path.resolve(this._basePath, outDir)
  }
  return this
}


/**
 * Sets the protoc_path for resolving proto files.
 * @param {Array.<string>} protocPaths
 * @return {Project}
 */
Project.prototype.setProtocPaths = function (protocPaths) {
  if (!Array.isArray(protocPaths)) throw new Error('required array')
  this._protocPaths = protocPaths
  return this
}


/**
 * Adds a compilation job.
 * @param {string} protoFile The proto file to compile, all imports will be followed.
 * @param {string} templateName The Soy template name to use when compiling.
 * @param {string=} opt_suffix Optional suffix for generated files.
 * @return {Project}
 */
Project.prototype.addJob = function (protoFile, templateName, opt_suffix) {
  this.addProto(protoFile)
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
 * @return {Project}
 */
Project.prototype.addProto = function (fileName) {
  this._processProto(fileName)
  return this
}

/**
 * Processes a protocol buffer schema file, synchronously.
 * @param {string} fileName Filename relative to protoc_paths
 * @return {ProtoDescriptor}
 */
Project.prototype._processProto = function (fileName) {
  // TODO(dan): Make async.

  var filePath = this._resolve(fileName)

  var proto = this._protos[filePath]
  if (!proto) {
    var fileContents = fs.readFileSync(filePath, 'utf8')
    proto = this._protos[filePath] = parser(filePath, fileContents)
    proto.getImportNames().forEach(function (importName) {
      proto.addImport(this._processProto(importName))
    }, this)
  }
  return proto
}


/**
 * Resolve all protobuf extensions into the main messages.
 * @private
 */
Project.prototype._resolveExtensions = function () {
  if (this._resolvedExtensions) return

  var protos = this.getProtos()
  var messagesByName = {}
  var extensionsByName = {}
  var i, j, descriptor;

  for (i = 0; i < protos.length; i++) {
    descriptor = protos[i]
    var messages = descriptor.getMessages()
    for (j = 0; j < messages.length; j++) {
      var m = messages[j]
      var mName = descriptor.getPackage() + '.' + m.getName()

      messagesByName[mName] = m
    }
  }

  for (i = 0; i < protos.length; i++) {
    descriptor = protos[i]
    var extensions = descriptor.getExtends()
    for (j = 0; j < extensions.length; j++) {
      var e = extensions[j]
      var eName = descriptor.getPackage() + '.' + e.getName()
      if (messagesByName[eName]) {
        e.mergeInto(messagesByName[eName])
      }
    }
  }

  this._resolvedExtensions = true
}



/**
 * Executes all the compilation jobs.
 * @return {Promise} A promise of when all compilation jobs have finished
 */
Project.prototype.compile = function () {
  this._resolveExtensions()

  soynode.setOptions({
    outputDir: this._outDir,
    uniqueDir: false,
    allowDynamicRecompile: false,
    eraseTemporaryFiles: false
  })

  return kew.nfcall(soynode.compileTemplates.bind(soynode, this._templateDir)).then(function () {
    var promises = []

    for (var i = 0; i < this._compileJobs.length; i++) {
      var job = this._compileJobs[i]
      var descriptor = this.getProtos(job.proto)[0]
      var baseFileName = descriptor.getName()
      if (job.suffix == '.java' && descriptor.getOption('java_outer_classname')) {
        baseFileName = descriptor.getOption('java_outer_classname')
      } else if ((job.suffix == '.h' || job.suffix == '.m') && descriptor.getOption('ios_classname')) {
        baseFileName = descriptor.getOption('ios_classname')
      }
      var outDir = (job.suffix && this._outDirs[job.suffix]) ? this._outDirs[job.suffix] : this._outDir
      var fileName = path.join(outDir, baseFileName + (job.suffix || this._defaultSuffix))
      var contents = soynode.render(job.template, descriptor.toTemplateObject())
      promises.push(this._outputFn(descriptor, fileName, contents))
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
 * @param {string} opt_protoFile If specified, only the provided proto will be
 *    returned.
 * @return {Array.<ProtoDescriptor>}
 */
Project.prototype.getProtos = function (opt_protoFile) {
  if (!opt_protoFile) return helper.values(this._protos)

  var protoPath = this._resolve(opt_protoFile)

  if (this._protos[protoPath]) {
    return [this._protos[protoPath]]
  } else {
    throw new Error('Unknown proto file [' + protoPath + ']')
  }
}


/**
 * Returns the full path relative to the base directory.
 * @param {string} fileName
 * @return {string}
 * @throws An error if it could not be resolved
 */
Project.prototype._resolve = function (fileName) {
  for (var i = 0; i < this._protocPaths.length; i++) {
    var protocPath = this._protocPaths[i]
    var filePath = path.resolve(protocPath, fileName)
    try {
      fs.statSync(filePath) // https://github.com/nodejs/io.js/issues/103
      return filePath
    } catch (err) {} // Expected
  }

  // TODO(nick): it would be nice to report the line number
  // where the import appeared, if this is an import.
  throw new Error('File "' + fileName + '" could not be resolved on protoc paths: ' +
                  this._protocPaths.join(','))
}
