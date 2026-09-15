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
      system: { playerNotes: "<p>Dangerous &amp; desperate.</p>", description: "Secret allegiance" }
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

test("NPC public descriptions never fall back to GM notes", () => {
  for (const playerNotes of [undefined, null, "", "   "]) {
    const payload = actorToCharacterPayload({
      id: "npc", uuid: "Actor.npc", type: "npc", name: "NPC",
      system: { playerNotes, description: "Secret allegiance" }
    }, { kind: "npc" });
    assert.equal(payload.public_description, null);
    assert.equal(JSON.stringify(payload).includes("Secret allegiance"), false);
    assert.equal(characterUpdatePayload(payload).public_description, null);
  }
});

test("follower descriptions retain their public mapping", () => {
  const payload = actorToCharacterPayload({
    id: "follower", uuid: "Actor.follower", type: "follower", name: "Follower",
    system: { description: "<p>Public follower description.</p>" }
  }, { kind: "npc" });
  assert.equal(payload.public_description, "Public follower description.");
});
