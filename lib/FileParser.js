var fs = require('fs')
var path = require('path')
var util = require('util')

var parser = require('./parser')


function FileParser(opt_protoPath) {

  /**
   * Look for protos starting at the specified path, defaults to cwd.
   * @type {string}
   */
  this._protoPath = opt_protoPath || process.cwd()

  /**
   * Map of filenames to the parsed proto descriptor.
   * @type {Object.<pbnj.ProtoDescriptor>}
   */
  this._protos = {}
}
module.exports = FileParser


FileParser.prototype.processFile = function (fileName, opt_followImports) {
  if (!this._protos[fileName]) {
    var file = fs.readFileSync(path.join(this._protoPath, fileName), 'utf8')
    var proto = this._protos[fileName] = parser(file)
    if (opt_followImports) {
      var imports = proto.getImports()
      for (var i = 0; i < imports.length; i++) {
        this.processFile(imports[i], true)
      }
    }
  }
}
