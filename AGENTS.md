# AGENTS.md

## Scope

This repository contains the Foundry VTT v14 module only. The FastAPI and Supabase backend lives in `KoshiirRa/PendragonCampaignManager`.

## Requirements

- Target Foundry VTT v14 public APIs.
- Require the game system with package ID `pendragon`.
- Use native ES modules and lower-case hyphenated paths.
- Keep routes, payloads, and versioned contracts aligned with the backend.
- Never embed database passwords, Supabase service-role keys, access tokens, or GM secrets.
- Communicate with Supabase only through the FastAPI backend.
- Treat Foundry UUID mappings and synchronization writes as idempotent.
- Preserve GM-only versus player-visible boundaries.
- Prefer public Foundry APIs; do not use `_`, `@internal`, or private methods.

## Release rules

- Keep `module.json` valid and its version synchronized with the Git tag.
- The ZIP must contain `module.json` at its archive root.
- Publish only original code and permissible assets.
- Run `npm test` before committing or tagging.

