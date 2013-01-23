


function Descriptor() {
  this._parent = null
}
module.exports = Descriptor


Descriptor.prototype.setParent = function (parent) {
  this._parent = parent
}


Descriptor.prototype.getParent = function () {
  return this._parent
}


Descriptor.prototype.getAncestors = function () {
  var ancestors = []
  var parent = this._parent
  while (parent) {
    ancestors.push(parent)
    parent = parent.getParent()
  }
  return ancestors
}

