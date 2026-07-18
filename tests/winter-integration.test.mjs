import assert from "node:assert/strict";
import test from "node:test";

globalThis.game = { user: { id: "gm-1", isGM: true }, users: { activeGM: { id: "gm-1" } } };
const { isPendragonGameYearSetting, isWinterPhaseComplete, shouldSynchronizeWinterActor } = await import("../scripts/winter-integration.mjs");

test("recognizes Pendragon game-year setting updates", () => {
  assert.equal(isPendragonGameYearSetting({ key: "Pendragon.gameYear", value: 486 }), true);
  assert.equal(isPendragonGameYearSetting({ key: "Pendragon.winter", value: false }), false);
});

test("automatically synchronizes only linked character Actors for a GM", () => {
  const actor = {
    documentName: "Actor",
    type: "character",
    getFlag: () => "character-1"
  };
  assert.equal(shouldSynchronizeWinterActor(actor), true);
  assert.equal(shouldSynchronizeWinterActor({ ...actor, type: "npc" }), false);
  assert.equal(shouldSynchronizeWinterActor({ ...actor, getFlag: () => null }), false);
  game.user.isGM = false;
  assert.equal(shouldSynchronizeWinterActor(actor), false);
  game.user.isGM = true;
  game.users.activeGM = { id: "gm-2" };
  assert.equal(shouldSynchronizeWinterActor(actor), false);
  game.users.activeGM = { id: "gm-1" };
});

test("waits for every Pendragon Winter Phase step to complete", () => {
  const status = {
    train: false, economic: false, aging: false, squireAge: false,
    horseSurv: false, familyRoll: false, xp: false
  };
  assert.equal(isWinterPhaseComplete({ system: { status } }), true);
  assert.equal(isWinterPhaseComplete({ system: { status: { ...status, train: true } } }), false);
  assert.equal(isWinterPhaseComplete({ system: { status: { ...status, familyRoll: undefined } } }), false);
});
