import assert from "node:assert/strict";
import test from "node:test";

import { syncActor } from "../scripts/actor-sync.mjs";

test("creates and flags an Actor on first sync", async () => {
  const flags = new Map();
  const actor = fakeActor(flags);
  const client = {
    listCharacters: async () => [],
    createCharacter: async (_campaignId, payload) => ({ id: "character-1", ...payload })
  };
  const result = await syncActor(actor, syncOptions(client));
  assert.equal(result.created, true);
  assert.equal(result.character.foundry_uuid, actor.uuid);
  assert.equal(flags.get("characterId"), "character-1");
  assert.ok(flags.get("lastSyncedAt"));
});

test("updates the mapped character instead of creating a duplicate", async () => {
  const flags = new Map([["characterId", "character-1"]]);
  const actor = fakeActor(flags);
  let update;
  const client = {
    getCharacter: async () => ({ id: "character-1", kind: "npc" }),
    updateCharacter: async (_campaignId, _characterId, payload) => {
      update = payload;
      return { id: "character-1", kind: "npc", ...payload };
    }
  };
  const result = await syncActor(actor, syncOptions(client));
  assert.equal(result.created, false);
  assert.equal(update.kind, undefined);
  assert.equal(update.name, "Merlin");
});

test("preserves the immutable database kind when the resync dialog guesses incorrectly", async () => {
  const flags = new Map([["characterId", "character-1"]]);
  const actor = fakeActor(flags);
  let update;
  const client = {
    getCharacter: async () => ({
      id: "character-1",
      kind: "player_knight",
      player_name: "Alice"
    }),
    updateCharacter: async (_campaignId, _characterId, payload) => {
      update = payload;
      return { id: "character-1", kind: "player_knight", player_name: "Alice", ...payload };
    }
  };
  await syncActor(actor, syncOptions(client));
  assert.equal(update.player_name, "Alice");
  assert.equal(flags.get("characterKind"), "player_knight");
});

test("recovers a mapping by Foundry UUID when the Actor flag is absent", async () => {
  const actor = fakeActor(new Map());
  let created = false;
  const client = {
    listCharacters: async () => [
      { id: "character-1", kind: "npc", foundry_uuid: "Actor.merlin" }
    ],
    createCharacter: async () => {
      created = true;
    },
    updateCharacter: async (_campaignId, _characterId, payload) => ({
      id: "character-1",
      kind: "npc",
      ...payload
    })
  };
  await syncActor(actor, syncOptions(client));
  assert.equal(created, false);
});

function fakeActor(flags) {
  return {
    id: "merlin",
    uuid: "Actor.merlin",
    type: "npc",
    name: "Merlin",
    system: { description: "Wizard" },
    getFlag: (_module, key) => flags.get(key),
    setFlag: async (_module, key, value) => flags.set(key, value)
  };
}

function syncOptions(client) {
  client.getCampaign ??= async () => ({ id: "campaign-1", current_year: 485 });
  client.syncCharacterSnapshot ??= async () => ({ changed: true });
  return {
    client,
    campaignId: "campaign-1",
    kind: "npc",
    playerName: null,
    worldId: "world-1"
  };
}
