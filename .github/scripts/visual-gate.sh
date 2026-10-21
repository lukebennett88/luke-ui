#!/usr/bin/env bash
set -eu
test "$IMPACT" = success
case "$REQUIRED" in
  false)
    test "$COMPARE" = skipped
    test "$REVIEW" = skipped
    test -z "$CHANGES"
    exit 0
    ;;
  true) ;;
  *) exit 1 ;;
esac
test "$COMPARE" = success
case "$CHANGES" in ''|*[!0-9]*) exit 1 ;; esac
if [ "$CHANGES" -eq 0 ]; then
  test "$REVIEW" = skipped
else
  test "$REVIEW" = success
fi
