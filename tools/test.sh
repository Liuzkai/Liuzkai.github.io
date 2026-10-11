#!/usr/bin/env bash
set -euo pipefail
if [[ "${1:-}" == '--build' ]]; then JEKYLL_ENV=production bundle exec jekyll build; fi
python3 tools/check-site.py
