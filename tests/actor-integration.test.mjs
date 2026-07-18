import assert from "node:assert/strict";
import test from "node:test";

import { dialogSelection } from "../scripts/actor-integration.mjs";

test("reads Foundry v14 DialogV2 parsed form objects", () => {
  assert.deepEqual(
    dialogSelection({ object: { kind: "player_knight", playerName: "Morgan" } }),
    { kind: "player_knight", playerName: "Morgan", familyName: undefined }
  );
});

test("reads direct dialog values and native FormData-compatible values", () => {
  assert.deepEqual(dialogSelection({ kind: "npc", playerName: "" }), {
    kind: "npc",
    playerName: "",
    familyName: undefined
  });
  const values = new Map([["kind", "npc"], ["playerName", "Arthur"]]);
  assert.deepEqual(dialogSelection(values), { kind: "npc", playerName: "Arthur", familyName: undefined });
});
