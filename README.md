pbnj
====

[![Build Status](https://travis-ci.org/Medium/pbnj.svg?branch=master)](https://travis-ci.org/Medium/pbnj)

_JavaScript protocol buffer schema parser and template based code generator_

This project is functional and being used in real projects.  But is in its early
days and likely to be in a state of flux for some time.

Protocol Buffers
----------------

Protocol buffers were designed as a way to automatically serialize and
deserialize data, in a fast and efficient manner. You define how you want your
data to be structured in the special proto format, and then use special
generated code to read and write your data.

This project focuses on using the proto schema definition as a generalized
basis for code generation. Serialization / deserialization is a side effect of
the generated code and this project is un-opinionated on such matters -- you
may use JSON, binary data, JS Arrays, Message Pack, whatever.

To learn more about the proto buffer format, visit
[Google's Language Guide](https://developers.google.com/protocol-buffers/docs/proto).

Rationale
---------

1. The official protoc compiler does have plugin support for customizing code
generation, but the tool chain I was working with was nodejs and I wanted
consistency.  Also, exposing an object representation of the schema allows for
other tools and analysis, for example schema validation and tests.

2. I was unhappy with existing JS implementations. They seem to either be
partially open sourced or else rely on unstructured JSON as their format in JS.

Author
------

[Dan Pupius](https://github.com/dpup) ([personal website](http://pupius.co.uk)).

License
-------

Copyright 2013 [Daniel Pupius](http://pupius.co.uk/).
[Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0).
