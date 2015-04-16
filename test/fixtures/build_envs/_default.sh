#!/usr/bin/env bash
# Environment tree:
#
#   _default.sh
#   ├── development.sh
#   │   └── test.sh
#   └── production.sh
#       └── staging.sh
#
# This provides DRY flexibilty, but in practice I recommend using mainly
# development.sh and production.sh, and duplication keys between them
# so you can easily compare side by side.
# Then just use _default.sh, test.sh, staging.sh for tweaks, to keep things
# clear.
#
# These variables are mandatory and have special meaning
#
#   - NODE_APP_PREFIX="MYAPP" # filter and nest vars starting with MYAPP right into your app
#   - NODE_ENV="production"   # the environment your program thinks it's running
#   - DEPLOY_ENV="staging"    # the machine you are actually running on
#   - DEBUG=*.*               # Used to control debug levels per module

export NODE_APP_PREFIX="TRISSUES"
export TRISSUES_EXCLUDE_LABELS=${TRISSUES_EXCLUDE_LABELS:="wontfix, invalid, duplicate"}

export TRISSUES_AUTH_GITHUB=${TRISSUES_AUTH_GITHUB:="fake-test-token"}
export TRISSUES_AUTH_TRACKER=${TRISSUES_AUTH_TRACKER:="fake-test-token"}

export multi="spec=-"
