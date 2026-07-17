# Pendragon Campaign Manager for Foundry VTT

A Foundry Virtual Tabletop v14 companion module for the community Pendragon 6th Edition system (`pendragon`). It will connect Foundry worlds to the Pendragon Campaign Manager FastAPI backend without exposing Supabase credentials to Foundry clients.

## Status

Version 0.2 provides the first usable connection slice:

- a Foundry v14 ApplicationV2 configuration screen;
- the live Cloud Run API as the default backend;
- GM-only connection testing and campaign discovery;
- a client-scoped API key that is not synchronized to players;
- a world-scoped selected campaign ID;
- a small module API for health, readiness, campaign listing, and campaign retrieval.

Actor and journal synchronization are not implemented yet.

## Configure a world

1. Install and enable the module in a world using the `pendragon` game system.
2. Sign in as a Gamemaster.
3. Open **Game Settings → Configure Settings → Module Settings**.
4. Select **Configure Connection** under Pendragon Campaign Manager.
5. Enter the `pendragon-api-key` value from Google Secret Manager.
6. Select **Test and Load Campaigns**, choose the campaign, and save.

The API key uses Foundry's client setting storage. Each GM browser must configure it independently. It is never stored in the world database or sent to player clients.

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
