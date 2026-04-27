#!/bin/bash
set -e

# Install/update dependencies after a task merges (e.g. security patches).
npm install --no-audit --no-fund

# Sync any Drizzle schema changes (no-op if nothing changed).
npm run db:push -- --force
