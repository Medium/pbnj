var fs = require('fs')
var path = require('path')
var util = require('util')

var parser = require('./parser')


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


Project.prototype.inspect = function (depth) {
  return util.inspect({
    basePath: this._basePath,
    protos: this._protos
  }, false, null)
}


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


Project.prototype.getProtos = function () {
  return this._protos
}


Project.prototype.getType = function (name) {
  for (var file in this._protos) {
    var descriptor = this._protos[file].getType(name)
    if (descriptor) return descriptor
  }
  return null
}
