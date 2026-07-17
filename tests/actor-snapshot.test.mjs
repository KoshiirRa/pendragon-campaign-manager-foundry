import assert from "node:assert/strict";
import test from "node:test";

import { actorToSnapshot } from "../scripts/actor-snapshot.mjs";

test("maps prepared Pendragon traits, skills, passions, and Glory", () => {
  const snapshot = actorToSnapshot(
    {
      system: { glory: 1910 },
      items: [
        item("trait", "Merciful", "i.trait.merciful", {
          total: 12,
          oppName: "Vengeful",
          oppvalue: 8
        }),
        item("skill", "Sword", "i.skill.sword", { total: 15, combat: true }),
        item("passion", "Loyalty (Lord)", "i.passion.loyalty", {
          total: 16,
          specName: "Earl Roderick"
        })
      ]
    },
    485
  );
  assert.equal(snapshot.effective_year, 485);
  assert.deepEqual(snapshot.traits[0], {
    source_key: "i.trait.merciful",
    name: "Merciful",
    opposed_name: "Vengeful",
    value: 12,
    opposed_value: 8
  });
  assert.equal(snapshot.skills[0].category, "combat");
  assert.equal(snapshot.skills[0].value, 15);
  assert.equal(snapshot.passions[0].subject_text, "Earl Roderick");
  assert.equal(snapshot.glory_total, 1910);
});

test("calculates totals when Foundry prepared values are absent", () => {
  const snapshot = actorToSnapshot(
    {
      system: {},
      items: [
        item("trait", "Energetic", null, { value: 10, religious: 1, winter: 2, oppName: "Lazy" }),
        item("skill", "Awareness", null, { value: 5, culture: 2, family: 1, create: 3, winter: 1 }),
        item("passion", "Honor", null, { value: 10, inherit: 2, sol: 1, homeland: 1, winter: 1 })
      ]
    },
    486
  );
  assert.equal(snapshot.traits[0].value, 13);
  assert.equal(snapshot.traits[0].opposed_value, 7);
  assert.equal(snapshot.skills[0].value, 12);
  assert.equal(snapshot.passions[0].value, 15);
  assert.equal(snapshot.glory_total, 0);
});

function item(type, name, pid, system) {
  return {
    id: `${type}-1`,
    uuid: `Actor.test.Item.${type}-1`,
    type,
    name,
    system,
    flags: pid ? { Pendragon: { pidFlag: { id: pid } } } : {}
  };
}
