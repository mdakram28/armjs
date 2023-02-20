#!/bin/bash

cargo watch -i .gitignore -i "pkg/*" -i "target/*" -s "bash ./scripts/build_run_all.sh"