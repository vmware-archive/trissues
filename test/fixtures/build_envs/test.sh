#!/usr/bin/env bash
__DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source ${__DIR}/development.sh
# Based on development ---^

export DEPLOY_ENV="$(basename "${BASH_SOURCE[0]}" .sh)"
export NODE_ENV="test"

export TRISSUES_SERVER_PORT="8000"
export TRISSUES_GITHUB_REPO="pivotaltracker/trissues"
export TRISSUES_TRACKER_PROJECTID=101
export TRISSUES_AUTH_GITHUB="fake-test-token"
export TRISSUES_AUTH_TRACKER="fake-test-token"
