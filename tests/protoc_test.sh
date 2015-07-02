#!/bin/sh

cd `dirname $0`/..
mkdir tmp_protoc_test
protoc tests/protos/*.proto --proto_path=./tests:/usr/local/include --cpp_out=tmp_protoc_test
RESULT=$?
rm -fR tmp_protoc_test
exit $RESULT
