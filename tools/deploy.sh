#!/usr/bin/env bash
# Publish with a normal commit; never rewrite gh-pages history.
set -euo pipefail
[[ "${GITHUB_ACTIONS:-}" == "true" ]] || { echo 'Run this script in GitHub Actions.' >&2; exit 1; }
[[ -f _site/index.html ]] || { echo 'Build _site first.' >&2; exit 1; }
root=$(pwd)
publish=$(mktemp -d)
trap 'git worktree remove --force "$publish" >/dev/null 2>&1 || true' EXIT
git fetch origin gh-pages
git worktree add --detach "$publish" origin/gh-pages
# Preserve a Pages-managed custom domain if one exists.
if [[ -f "$publish/CNAME" && ! -f _site/CNAME ]]; then cp "$publish/CNAME" _site/CNAME; fi
rsync -a --delete --exclude=.git "$root/_site/" "$publish/"
touch "$publish/.nojekyll"
git -C "$publish" config user.name 'GitHub Actions'
git -C "$publish" config user.email '41898282+github-actions[bot]@users.noreply.github.com'
git -C "$publish" add -A
if ! git -C "$publish" diff --cached --quiet; then
  git -C "$publish" commit -m "Publish ${GITHUB_SHA:-site}"
  git -C "$publish" push origin HEAD:gh-pages
fi
