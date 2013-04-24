

exports.values = function (object, opt_mapper) {
  return Object.keys(object).map(function (key) {
    return opt_mapper ? opt_mapper(object[key]) : object[key]
  })
}


exports.clone = function (object) {
  if (object === null) return null
  if (typeof object != 'object') return object
  var clone = {}
  for (var key in object) {
    clone[key] = exports.clone(object[key])
  }
  return clone
}


exports.extend = function (var_args) {
  var core = exports.clone(arguments[0])
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) core[key] = arguments[i][key]
  }
  return core
}


exports.toTemplateObject = function (item) { return item.toTemplateObject() }
