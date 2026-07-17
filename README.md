# Pendragon Campaign Manager for Foundry VTT

A Foundry Virtual Tabletop v14 companion module for the community Pendragon 6th Edition system (`Pendragon`). It connects Foundry worlds to the Pendragon Campaign Manager FastAPI backend without exposing Supabase credentials to Foundry clients.

## Status

Version 0.4 provides campaign setup and controlled Actor synchronization:

- a Foundry v14 ApplicationV2 configuration screen;
- the live Cloud Run API as the default backend;
- GM-only connection testing and campaign discovery;
- campaign creation with automatic selection for the current world;
- a client-scoped API key that is not synchronized to players;
- a world-scoped selected campaign ID;
- a small module API for health, readiness, campaign listing, and campaign retrieval.
- GM-triggered synchronization for Pendragon `character`, `npc`, and `follower` Actors;
- idempotent updates using Foundry Actor UUIDs and backend character IDs;
- player-knight versus NPC selection before the first synchronization.

Traits, skills, passions, Glory, and journals are not synchronized yet.

## Configure a world

1. Install and enable the module in a world using the `pendragon` game system.
2. Sign in as a Gamemaster.
3. Open **Game Settings → Configure Settings → Module Settings**.
4. Select **Configure Connection** under Pendragon Campaign Manager.
5. Enter the `pendragon-api-key` value from Google Secret Manager.
6. Select **Test and Load Campaigns**, choose the campaign, and save.

The API key uses Foundry's client setting storage. Each GM browser must configure it independently. It is never stored in the world database or sent to player clients.

## Synchronize an Actor

As a Gamemaster, open a supported Actor sheet and select the cloud-upload **Send to Campaign Manager** button in its header, or right-click an Actor in the Actor Directory and choose **Send to Campaign Manager**. Select Player Knight or NPC, provide the player name when required, and synchronize. The module registers both Pendragon's legacy Actor UI hooks and Foundry v14's current hook names.

The module stores the backend character ID as a non-secret Actor flag. Repeating the command updates the same backend character. If the flag is lost, the module recovers the mapping by the Actor UUID to avoid duplicates.

## Diagnostics

Version 0.4.2 logs module lifecycle and Actor UI hook activity to the browser JavaScript console with the prefix `Pendragon Campaign Manager |`. It never logs the API-key value. Run this console command for a structured report:

```js
game.modules.get("pendragon-campaign-manager").api.diagnostics()
```

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
