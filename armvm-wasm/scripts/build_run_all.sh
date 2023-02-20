#!/bin/bash

set -e

wasm-pack build --target nodejs
# cd ../armvm
# sudo -S npm run build
cd ../cli
npm run build
npm start ./test/test.o