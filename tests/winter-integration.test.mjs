import assert from "node:assert/strict";
import test from "node:test";

globalThis.game = { user: { id: "gm-1", isGM: true }, users: { activeGM: { id: "gm-1" } }, time: { components: { year: 486 } } };
const { currentPendragonYear, isPendragonGameYearSetting, isPendragonWinterSetting, parsedSettingValue, shouldSynchronizeWinterActor } = await import("../scripts/winter-integration.mjs");

test("recognizes Pendragon game-year setting updates", () => {
  assert.equal(isPendragonGameYearSetting({ key: "Pendragon.gameYear", value: 486 }), true);
  assert.equal(isPendragonGameYearSetting({ key: "Pendragon.winter", value: false }), false);
});

test("recognizes the Pendragon Winter Phase end setting", () => {
  assert.equal(isPendragonWinterSetting({ key: "Pendragon.winter", value: false }), true);
  assert.equal(isPendragonWinterSetting({ key: "Pendragon.winter", value: true }), true);
  assert.equal(isPendragonWinterSetting({ key: "Pendragon.gameYear", value: 486 }), false);
  assert.equal(isPendragonWinterSetting({ key: "Pendragon.winter", value: "false" }), true);
  assert.equal(parsedSettingValue({ value: "false" }), false);
  assert.equal(parsedSettingValue({ value: "486" }), 486);
});

test("reads the v14 Pendragon year from Foundry World Time", () => {
  assert.equal(currentPendragonYear(), 486);
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
