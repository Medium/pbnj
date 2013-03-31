// Copyright 2013 The Obvious Corporation.

/**
 * @fileoverview Map of proto types and their JS equivalent. All numeric types
 * are represented as JS numbers and therefore precision may be lost for values
 * over 2^53.
 */

module.exports = {
  'double': 'number',
  'float': 'number',
  'int32': 'number',
  'int64': 'number',
  'uint32': 'number',
  'uint64': 'number',
  'sint32': 'number',
  'sint64': 'number',
  'fixed32': 'number',
  'fixed64': 'number',
  'sfixed32': 'number',
  'sfixed64': 'number',
  'bool': 'boolean',
  'string': 'string',
  'bytes': 'string'
}
