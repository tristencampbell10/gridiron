#!/usr/bin/env bash
set -e

# Script to securely push local commits to GitHub repository:
# https://github.com/tristencampbell10/gridiron.git

REPO_OWNER="tristencampbell10"
REPO_NAME="gridiron"
REMOTE_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}.git"

TOKEN="$1"

if [ -z "$TOKEN" ]; then
  if [ -n "$GITHUB_TOKEN" ]; then
    TOKEN="$GITHUB_TOKEN"
  else
    echo "=========================================================="
    echo " GitHub Push Helper for ${REPO_OWNER}/${REPO_NAME}"
    echo "=========================================================="
    echo "GitHub requires a Personal Access Token (PAT) for git pushes."
    echo ""
    echo "To generate one in 30 seconds:"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Generate new token (classic) -> select 'repo' scope"
    echo "3. Copy the token (starts with ghp_...)"
    echo "=========================================================="
    echo ""
    read -r -s -p "Enter your GitHub Personal Access Token (or paste here): " TOKEN
    echo ""
  fi
fi

if [ -z "$TOKEN" ]; then
  echo "Error: No token provided. Aborting push."
  exit 1
fi

echo "Verifying git status and push readiness..."
git status -s

echo "Pushing 'main' branch to ${REMOTE_URL}..."
# Push securely using token without persisting token in git remote config
git push "https://${REPO_OWNER}:${TOKEN}@github.com/${REPO_OWNER}/${REPO_NAME}.git" main

echo ""
echo " Successfully pushed to https://github.com/${REPO_OWNER}/${REPO_NAME}!"
