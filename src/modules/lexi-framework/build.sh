#!/bin/bash

# USED TO BUILD THE PACKAGE AND EXTRACT THE CONTENTS OF THE TAR FILE.

rm -rf dist/

python3 -m build

cd dist/

tar -xvf *.tar.gz -C .
