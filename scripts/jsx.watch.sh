#!/usr/bin/env bash
rm -R public/js/modules/lib/.module-cache
jsx --watch public/js/modules/jsx/ public/js/modules/lib/
