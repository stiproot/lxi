#!/bin/bash

# USED TO INSTALL THE PACKAGE LOCALLY.
# !!! THIS IS A TMP SOLUTION UNTIL WE PUBLISH TO OUR PIP FEED.

python3.12 -m pip uninstall lxi_framework

python3.12 -m pip install dist/lxi_framework-0.0.1/.

cp -f dist/lxi_framework-0.0.1.tar.gz ~/code/azdo/Lxi/src/workflows-api/pkgs/
cp -f dist/lxi_framework-0.0.1.tar.gz ~/code/azdo/Lxi/src/embeddings-api/pkgs/
cp -f dist/lxi_framework-0.0.1.tar.gz ~/code/azdo/Lxi/src/qry-api/pkgs/
