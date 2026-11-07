#!/usr/bin/env bash
set -euo pipefail
TARGET="${1:-finops-new}"
cd "$(dirname "$0")"

npm run build
tar -czf /tmp/chess-dist.tgz -C dist .
scp /tmp/chess-dist.tgz "$TARGET:/tmp/chess-dist.tgz"
ssh "$TARGET" 'cd /var/www/chess/web && rm -rf assets stockfish icons index.html manifest.webmanifest sw.js && tar -xzf /tmp/chess-dist.tgz && rm /tmp/chess-dist.tgz'
rm /tmp/chess-dist.tgz
echo "Deployed."
