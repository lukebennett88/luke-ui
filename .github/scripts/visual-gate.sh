#!/usr/bin/env bash
set -eu
test "$IMPACT" = success
if [ "$REQUIRED" = false ]; then
  test "$COMPARE" = skipped && test "$REVIEW" = skipped
else
  test "$REQUIRED" = true
  test "$COMPARE" = success
  if [ "$CHANGES" = 0 ]; then
    test "$REVIEW" = skipped
  else
    case "$CHANGES" in ''|*[!0-9]*) exit 1 ;; esac
    test "$CHANGES" -gt 0 && test "$REVIEW" = success
  fi
fi
