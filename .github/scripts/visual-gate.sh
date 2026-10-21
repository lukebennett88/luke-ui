#!/usr/bin/env bash
set -eu
test "$COMPARE" = success
case "$CHANGES" in ''|*[!0-9]*) exit 1 ;; esac
if [ "$CHANGES" -eq 0 ]; then
  test "$REVIEW" = skipped
else
  test "$REVIEW" = success
fi
