#!/usr/bin/env bash
__DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source ${__DIR}/_default.sh
# Based on _default ---^

export DEPLOY_ENV="$(basename "${BASH_SOURCE[0]}" .sh)"
export NODE_ENV="development"
#export DEBUG=*:*
