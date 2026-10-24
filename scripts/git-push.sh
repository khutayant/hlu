#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

BRANCH="ui"

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

current="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$current" != "$BRANCH" ]]; then
  echo "Renaming branch '$current' → '$BRANCH'"
  git branch -m "$BRANCH"
fi

REPO="$(git remote get-url origin)"
MESSAGE="$(git log -1 --pretty=%s)"

echo "Pushing '$BRANCH' to origin..."
git push -u origin "$BRANCH"

max() {
  local a="$1" b="$2"
  (( a > b )) && echo "$a" || echo "$b"
}

w1=$(max 4 ${#REPO})
w2=$(max 6 ${#BRANCH})
w3=$(max 7 ${#MESSAGE})

print_sep() {
  printf '+-%s-+-%s-+-%s-+\n' \
    "$(printf '%*s' "$w1" '' | tr ' ' '-')" \
    "$(printf '%*s' "$w2" '' | tr ' ' '-')" \
    "$(printf '%*s' "$w3" '' | tr ' ' '-')"
}

print_row() {
  printf '| %-*s | %-*s | %-*s |\n' "$w1" "$1" "$w2" "$2" "$w3" "$3"
}

echo
echo 'Commit Message'
print_sep
print_row 'repo' 'branch' 'message'
print_sep
print_row "$REPO" "$BRANCH" "$MESSAGE"
print_sep
