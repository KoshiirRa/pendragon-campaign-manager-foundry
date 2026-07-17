# Pendragon Campaign Manager for Foundry VTT

A Foundry Virtual Tabletop v14 companion module for the community Pendragon 6th Edition system (`pendragon`). It will connect Foundry worlds to the Pendragon Campaign Manager FastAPI backend without exposing Supabase credentials to Foundry clients.

## Status

Early development scaffold. The current package registers world-level connection settings and establishes the release pipeline; synchronization features are not implemented yet.

## Development installation

Copy or link this repository into the Foundry user-data module directory as:

```text
Data/modules/pendragon-campaign-manager
```

Run validation with:

```bash
npm test
```

## Releases

Pushing a tag such as `v0.1.0` validates the manifest and publishes `module.zip` plus `module.json` as GitHub release assets. Do not tag a version until the `version` and versioned `download` URL in `module.json` match the tag.
