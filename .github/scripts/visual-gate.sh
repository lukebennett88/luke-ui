#!/usr/bin/env bash
set -eu
test "$IMPACT" = success
if [ "$REQUIRED" = false ]; then
  test "$COMPARE" = skipped
else
  test "$REQUIRED" = true
  test "$COMPARE" = success
  case "$CHANGES" in ''|*[!0-9]*) exit 1 ;; esac
fi
