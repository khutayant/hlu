#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SOURCE_BRANCH="ui"
DEPLOY_BRANCH="deploy-ui"

load_pat() {
  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    printf '%s' "$GITHUB_TOKEN"
    return 0
  fi
  if [[ -n "${GH_TOKEN:-}" ]]; then
    printf '%s' "$GH_TOKEN"
    return 0
  fi

  local candidate
  for candidate in \
    "$ROOT/scripts/.github-pat" \
    "$ROOT/.github-pat" \
    "$ROOT/../.github-pat"; do
    if [[ -f "$candidate" ]]; then
      tr -d '[:space:]' <"$candidate"
      return 0
    fi
  done

  return 1
}

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository."
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "Remote 'origin' is not configured."
  exit 1
fi

if ! git rev-parse HEAD >/dev/null 2>&1; then
  echo "No commits to push. Create a commit first."
  exit 1
fi

if ! TOKEN="$(load_pat)"; then
  echo "GitHub PAT not found."
  echo "Create a gitignored file with the token only (one line):"
  echo "  $ROOT/scripts/.github-pat"
  echo "  $ROOT/.github-pat"
  echo "or shared:"
  echo "  $ROOT/../.github-pat"
  echo "or export GITHUB_TOKEN / GH_TOKEN."
  exit 1
fi

current="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$current" != "$SOURCE_BRANCH" ]]; then
  echo "Renaming branch '$current' → '$SOURCE_BRANCH'"
  git branch -m "$SOURCE_BRANCH"
fi

# Never keep a local deploy-ui branch — work only on ui.
if git show-ref --verify --quiet "refs/heads/${DEPLOY_BRANCH}"; then
  echo "Removing local '${DEPLOY_BRANCH}' (deploy is remote-only)."
  git branch -D "$DEPLOY_BRANCH"
fi

# Keep origin clean (never store the PAT in the remote URL)
ORIGIN_URL="$(git remote get-url origin)"
CLEAN_URL="$(printf '%s' "$ORIGIN_URL" | sed -E 's#https://[^/@]+@#https://#')"
git remote set-url origin "$CLEAN_URL"

REPO="$CLEAN_URL"
HASH="$(git rev-parse --short HEAD)"
MESSAGE="$(git log -1 --pretty=%s)"

echo "Deploying '${SOURCE_BRANCH}' → origin/${DEPLOY_BRANCH} (no local ${DEPLOY_BRANCH})..."
# Refspec push updates remote deploy-ui only; do not set upstream (-u).
AUTH_HEADER="Authorization: Basic $(printf 'x-access-token:%s' "$TOKEN" | base64 | tr -d '\n')"
git -c "http.extraHeader=${AUTH_HEADER}" push origin \
  "refs/heads/${SOURCE_BRANCH}:refs/heads/${DEPLOY_BRANCH}"

max() {
  local a="$1" b="$2"
  ((a > b)) && echo "$a" || echo "$b"
}

REFSPEC_LABEL='ui -> deploy-ui'
w1=$(max 4 ${#REPO})
w2=$(max 7 ${#REFSPEC_LABEL})
w3=$(max 7 ${#MESSAGE})
w4=$(max 4 ${#HASH})

print_sep() {
  printf '+-%s-+-%s-+-%s-+-%s-+\n' \
    "$(printf '%*s' "$w1" '' | tr ' ' '-')" \
    "$(printf '%*s' "$w2" '' | tr ' ' '-')" \
    "$(printf '%*s' "$w4" '' | tr ' ' '-')" \
    "$(printf '%*s' "$w3" '' | tr ' ' '-')"
}

print_row() {
  printf '| %-*s | %-*s | %-*s | %-*s |\n' \
    "$w1" "$1" "$w2" "$2" "$w4" "$3" "$w3" "$4"
}

echo
echo 'Deploy'
print_sep
print_row 'repo' 'refspec' 'hash' 'message'
print_sep
print_row "$REPO" "$REFSPEC_LABEL" "$HASH" "$MESSAGE"
print_sep
