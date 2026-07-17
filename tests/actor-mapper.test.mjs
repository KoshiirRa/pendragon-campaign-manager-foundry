import assert from "node:assert/strict";
import test from "node:test";

import { actorToCharacterPayload, characterUpdatePayload } from "../scripts/actor-mapper.mjs";

test("maps a Pendragon character Actor to a player knight", () => {
  const payload = actorToCharacterPayload(
    {
      id: "abc123",
      uuid: "Actor.abc123",
      type: "character",
      name: "Sir Elad",
      system: {
        born: 465,
        gender: "Male",
        culture: "Cymric",
        religion: "British Christian",
        class: "Knight",
        coatOfArms: "elad.webp",
        background: "<p>A knight of Salisbury.</p>",
        homeland: "Logres",
        family: "Elad"
      }
    },
    { kind: "player_knight", playerName: "Alice", worldId: "world-one" }
  );
  assert.equal(payload.kind, "player_knight");
  assert.equal(payload.player_name, "Alice");
  assert.equal(payload.birth_year, 465);
  assert.equal(payload.public_description, "A knight of Salisbury.");
  assert.equal(payload.foundry_uuid, "Actor.abc123");
  assert.equal(payload.metadata.foundry_world_id, "world-one");
});

test("maps NPC and follower actors without player data", () => {
  const payload = actorToCharacterPayload(
    {
      id: "npc1",
      uuid: "Actor.npc1",
      type: "npc",
      name: "Bandit",
      system: { description: "<p>Dangerous &amp; desperate.</p>" }
    },
    { kind: "npc" }
  );
  assert.equal(payload.kind, "npc");
  assert.equal(payload.player_name, null);
  assert.equal(payload.public_description, "Dangerous & desperate.");
});

test("requires a player name and rejects unsupported Actor types", () => {
  assert.throws(
    () =>
      actorToCharacterPayload(
        { id: "a", uuid: "Actor.a", type: "character", name: "Knight", system: {} },
        { kind: "player_knight" }
      ),
    /player name/
  );
  assert.throws(
    () =>
      actorToCharacterPayload(
        { id: "a", uuid: "Actor.a", type: "party", name: "Party", system: {} },
        { kind: "npc" }
      ),
    /not supported/
  );
});

test("update payload omits immutable character kind", () => {
  assert.deepEqual(characterUpdatePayload({ kind: "npc", name: "Merlin" }), { name: "Merlin" });
});
