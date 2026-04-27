#!/bin/bash
set -e

# Install/update dependencies after a task merges (e.g. security patches).
npm install --no-audit --no-fund

# Sync any Drizzle schema changes (no-op if nothing changed).
# Non-fatal: drizzle-kit can fail on tooling mismatches even when the runtime app is fine.
# A failure here only means schema-push didn't run; the merged code is already installed.
npm run db:push -- --force || echo "[post-merge] db:push skipped (non-fatal). Run manually if schema changed."
