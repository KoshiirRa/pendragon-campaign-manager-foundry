import assert from "node:assert/strict";
import test from "node:test";

import { extractActorGmContext, registerGmChatIntegration } from "../scripts/gm-chat.mjs";
import { CampaignApiClient } from "../scripts/api-client.mjs";

test("extractActorGmContext extracts rich knightly context", () => {
  const actor = {
    name: "Sir Robert of Salisbury",
    type: "player_knight",
    system: {
      glory: 1250,
      stats: {
        siz: { value: 14, total: 14 },
        dex: { value: 12, total: 12 },
        str: { value: 15, total: 15 },
        con: { value: 14, total: 14 },
        app: { value: 11, total: 11 }
      }
    },
    items: [
      { type: "trait", name: "Valorous", system: { value: 16 } },
      { type: "trait", name: "Generous", system: { value: 14 } },
      { type: "passion", name: "Loyalty (Earl Roderick)", system: { value: 17 } },
      { type: "passion", name: "Honor", system: { value: 16 } },
      { type: "skill", name: "Sword", system: { value: 15 } },
      { type: "skill", name: "Lance", system: { value: 14 } },
      { type: "skill", name: "Horsemanship", system: { value: 15 } },
      { type: "skill", name: "Awareness", system: { value: 8 } }, // filtered because < 10
      { type: "wound", name: "Bandit arrow in shoulder", system: { value: 6 } }
    ]
  };

  const context = extractActorGmContext(actor, 485);
  assert.equal(context.name, "Sir Robert of Salisbury");
  assert.equal(context.glory, 1250);
  assert.equal(context.stats.str, 15);
  assert.equal(context.year, 485);
  assert.ok(context.traits.includes("Valorous: 16"));
  assert.ok(context.passions.includes("Loyalty (Earl Roderick): 17"));
  assert.ok(context.top_skills.includes("Sword: 15"));
  assert.ok(!context.top_skills.some((s) => s.includes("Awareness")));
  assert.ok(context.wounds.includes("Bandit arrow in shoulder (6 dmg)"));
});

test("extractActorGmContext returns null when actor is absent", () => {
  assert.equal(extractActorGmContext(null), null);
});

test("sendGmPrompt sends prompt and context to /chat endpoint", async () => {
  let recordedRequest = null;
  const client = new CampaignApiClient({
    baseUrl: "https://api.pendragon-chronicle.dwarvenbard.com",
    apiKey: "test-key",
    fetchImpl: async (url, options) => {
      recordedRequest = { url, options };
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          narration: "Earl Roderick nods approvingly.",
          rolls: []
        })
      };
    }
  });

  const res = await client.sendGmPrompt("test-campaign-123", {
    prompt: "I draw my sword in allegiance to the Earl.",
    speaker: "Sir Robert",
    actorContext: { name: "Sir Robert" },
    year: 485
  });

  assert.equal(res.narration, "Earl Roderick nods approvingly.");
  assert.equal(recordedRequest.url, "https://api.pendragon-chronicle.dwarvenbard.com/api/v1/campaigns/test-campaign-123/chat");
  assert.equal(recordedRequest.options.method, "POST");
  assert.equal(recordedRequest.options.headers["X-API-Key"], "test-key");
  assert.equal(recordedRequest.options.headers["X-Client"], "Pendragon-Foundry/1.0");

  const body = JSON.parse(recordedRequest.options.body);
  assert.equal(body.prompt, "I draw my sword in allegiance to the Earl.");
  assert.equal(body.speaker, "Sir Robert");
  assert.equal(body.year, 485);
});
