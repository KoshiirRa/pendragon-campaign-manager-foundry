# Pendragon Campaign Manager for Foundry VTT

Player-facing usage and privacy guidance is maintained in the backend repository's [Player Guide](https://github.com/KoshiirRa/PendragonCampaignManager/blob/main/docs/player-guide.md).

A Foundry Virtual Tabletop v14 companion module for the community Pendragon 6th Edition system (`Pendragon`). It connects Foundry worlds to the Pendragon Campaign Manager FastAPI backend without exposing Supabase credentials to Foundry clients.

## Status

The current release provides campaign setup and historical Actor synchronization:

- a Foundry v14 ApplicationV2 configuration screen;
- the live Cloud Run API as the default backend;
- GM-only connection testing and campaign discovery;
- campaign creation with automatic selection for the current world;
- a client-scoped API key that is not synchronized to players;
- a world-scoped selected campaign ID;
- a small module API for health, readiness, campaign listing, and campaign retrieval;
- GM-triggered synchronization for Pendragon `character`, `npc`, and `follower` Actors;
- idempotent updates using Foundry Actor UUIDs and backend character IDs;
- player-knight versus NPC selection before the first synchronization;
- idempotent synchronization of traits, skills, passions, and total Glory;
- central campaign events for each synchronization that changes historical state;
- core SIZ, DEX, STR, CON, and APP history;
- gear, weapon, and armour inventory state;
- horse identity, attributes, equipped state, and ownership history.

Journals are not synchronized. History, wounds, family members, horses, inventory, and squires synchronize from Actor snapshots. Other household members and detailed estate finances are recorded through **Manage Manor**. Completing the Pendragon system's Winter Phase synchronizes every already-linked participating Actor and then advances the selected campaign year.

## Configure a world

1. Install and enable the module in a world using the `pendragon` game system.
2. Sign in as a Gamemaster.
3. Open **Game Settings → Configure Settings → Module Settings**.
4. Select **Configure Connection** under Pendragon Campaign Manager.
5. Enter the `pendragon-api-key` value from Google Secret Manager.
6. Select **Test and Load Campaigns**, choose the campaign, and save.

The API key uses Foundry's client setting storage. Each GM browser must configure it independently. It is never stored in the world database or sent to player clients.
The configuration screen never renders a saved key back into the page; leave the blank key field
unchanged to retain the value already stored in that GM browser. To replace it, enter the new key
and save; use **Remove the saved key** to clear it. The module accepts only HTTPS backends (apart from loopback development), rejects known
Supabase Data API hosts, and sends authenticated requests without cookies, referrers, or caching.

Do not paste a Supabase `anon` key, service-role key, database password, or connection string into
Foundry. The required value is the Campaign Manager application's `X-API-Key`, and the URL must be
the FastAPI/Cloud Run endpoint.

## Synchronize an Actor

As a Gamemaster, open a supported Actor sheet and select **Send to Campaign Manager** from its header controls menu. Select Player Knight or NPC, provide the player name when required, and synchronize.

The module stores the backend character ID as a non-secret Actor flag. Repeating the command updates the same backend character. If the flag is lost, the module recovers the mapping by the Actor UUID to avoid duplicates.

The module reads Pendragon's prepared Item values for traits, skills, and passions and sends their
stable PID or Item UUID. It also sends the Actor's calculated total Glory. The backend appends only
values that changed since the last snapshot, so repeatedly synchronizing an unchanged sheet does
not duplicate historical ledger rows.

Inventory and horse lists are complete snapshots. Removing an inventory Item records quantity zero;
removing a Horse Item closes that horse's current ownership without deleting its history.

## Current integration details

Version 0.12.3 hardens connection credential handling. Saved API keys are no longer rendered into
the configuration page, can be explicitly removed from the current GM browser, and are sent only to
validated FastAPI HTTPS endpoints with cookies, referrers, and request caching disabled. Known
Supabase Data API hosts and URLs containing embedded credentials are rejected.

Version 0.12.0 synchronizes Pendragon `squire` Items as durable NPC identities, append-only yearly state, and effective-dated service to their knight. Age, Squire Skill, knight modifier, Glory, Description, and GM Info are preserved. Removing or transferring a stable squire identity closes the old service without deleting its history.

Manual integration verification uses the stable Foundry PID `i.squire.test-squire`. Initial synchronization, changed-state append, and unchanged-snapshot idempotency have been confirmed for this fixture; retain the PID when testing service departure or transfer behavior.

Version 0.12.2 hooks into the Pendragon system's authoritative Winter Phase close sequence through Foundry's public Setting and World Time hooks. It waits for the GM to turn Winter Phase off, observes Pendragon v14.6 advancing `game.time`, then synchronizes every already-linked character once against the completed year before advancing the selected Campaign Manager campaign. The legacy `gameYear` setting path remains supported. The `history` Item with `system.source = winter` establishes Winter Phase participation. Unlinked Actors are never created automatically, and the module does not replace or modify Pendragon's Winter Phase interface.

Version 0.10.0 expands the **Manage Manor** Actor-header control into an estate manager. In addition to manor creation, tenure, and annual economic resolution, it records itemized treasury entries, assets and livestock, asset state, household employment, improvements and their condition history, and layered defenses. Existing estate history is summarized before a new append-only record is submitted.

Estate currency is displayed in Librum, not modern British pounds. One Librum equals 240 denarii; decimal Librum values remain the API storage convention.

Version 0.8.0 synchronizes History Items into the campaign event timeline, recognizes `source = winter` as Winter Phase participation, and appends changed wound states to the wound ledger. History Item Glory is retained as reported provenance while total Glory reconciliation remains the accounting authority, preventing double counting.

It also synchronizes family Items as NPC identities, effective family memberships, parentage, marriages, and unambiguous inheritance claims for an heir with a deceased parent. Enter the family name in the synchronization dialog; leaving it blank skips family memberships while still preserving relationships. Marriage start years are recorded as the first synchronized campaign year because Foundry does not store a marriage year. Family Description is public character information; GM Info is stored as a private GM-only note.

## Diagnostics

The module logs lifecycle, Actor UI hook activity, Winter Phase detection, and snapshot results to the browser JavaScript console with the prefix `Pendragon Campaign Manager |`. It never logs the API-key value. Run this console command for a structured report:

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
