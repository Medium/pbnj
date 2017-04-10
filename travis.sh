#!/bin/sh
set -e
wget https://github.com/google/protobuf/releases/download/v3.2.0/protobuf-python-3.2.0.tar.gz
tar -xzvf protobuf-python-3.2.0.tar.gz
cd protobuf-3.2.0 && ./configure --prefix=$HOME/protobuf && make && make install
