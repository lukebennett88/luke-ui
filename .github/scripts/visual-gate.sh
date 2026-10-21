#!/usr/bin/env bash
set -eu
test "$IMPACT" = success
case "$REQUIRED" in
  false) test "$COMPARE" = skipped ;;
  true) test "$COMPARE" = success ;;
  *) exit 1 ;;
esac
