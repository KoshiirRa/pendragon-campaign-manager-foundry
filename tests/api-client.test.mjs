import assert from "node:assert/strict";
import test from "node:test";

import {
  CampaignApiClient,
  CampaignApiError,
  normalizeBaseUrl,
  slugifyCampaignName
} from "../scripts/api-client.mjs";

test("normalizes production and local development URLs", () => {
  assert.equal(normalizeBaseUrl("https://api.example.com/"), "https://api.example.com");
  assert.equal(normalizeBaseUrl("http://localhost:8000/"), "http://localhost:8000");
  assert.throws(() => normalizeBaseUrl("http://api.example.com"), CampaignApiError);
});

test("binds browser fetch to the global receiver", async () => {
  const browserLikeFetch = function () {
    if (this !== globalThis) throw new TypeError("Illegal invocation");
    return jsonResponse({ status: "ok" });
  };
  const client = new CampaignApiClient({
    baseUrl: "https://api.example.com",
    apiKey: "",
    fetchImpl: browserLikeFetch
  });
  assert.deepEqual(await client.health(), { status: "ok" });
});

test("authenticated requests send the API key only in its header", async () => {
  const calls = [];
  const client = new CampaignApiClient({
    baseUrl: "https://api.example.com",
    apiKey: "secret-value",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return jsonResponse([{ id: "campaign-id", name: "Salisbury" }]);
    }
  });

  const campaigns = await client.listCampaigns();
  assert.equal(campaigns[0].name, "Salisbury");
  assert.equal(calls[0].url, "https://api.example.com/api/v1/campaigns");
  assert.equal(calls[0].options.headers["X-API-Key"], "secret-value");
  assert.ok(!calls[0].url.includes("secret-value"));
});

test("health checks do not send the API key", async () => {
  let headers;
  const client = new CampaignApiClient({
    baseUrl: "https://api.example.com",
    apiKey: "secret-value",
    fetchImpl: async (_url, options) => {
      headers = options.headers;
      return jsonResponse({ status: "ok" });
    }
  });
  await client.health();
  assert.equal(headers["X-API-Key"], undefined);
});

test("reports backend errors with status and detail", async () => {
  const client = new CampaignApiClient({
    baseUrl: "https://api.example.com",
    apiKey: "wrong-key",
    fetchImpl: async () => jsonResponse({ detail: "Missing or invalid API key" }, 401)
  });
  await assert.rejects(
    client.listCampaigns(),
    (error) => error.status === 401 && error.message.includes("Missing or invalid API key")
  );
});

test("creates a campaign with the expected API payload", async () => {
  let request;
  const client = new CampaignApiClient({
    baseUrl: "https://api.example.com",
    apiKey: "secret-value",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return jsonResponse({ id: "new-id", name: "The Great Campaign" }, 201);
    }
  });
  const data = {
    name: "The Great Campaign",
    slug: "the-great-campaign",
    current_year: 485,
    description: null
  };
  const campaign = await client.createCampaign(data);
  assert.equal(campaign.id, "new-id");
  assert.equal(request.options.method, "POST");
  assert.deepEqual(JSON.parse(request.options.body), data);
});

test("posts a character snapshot to the idempotent synchronization endpoint", async () => {
  let request;
  const client = new CampaignApiClient({
    baseUrl: "https://api.example.com",
    apiKey: "secret-value",
    fetchImpl: async (url, options) => {
      request = { url, options };
      return jsonResponse({ character_id: "character-1", changed: true });
    }
  });
  const snapshot = { effective_year: 485, traits: [], skills: [], passions: [], glory_total: 0 };
  await client.syncCharacterSnapshot("campaign-1", "character-1", snapshot);
  assert.equal(
    request.url,
    "https://api.example.com/api/v1/campaigns/campaign-1/characters/character-1/foundry-snapshot"
  );
  assert.equal(request.options.method, "POST");
  assert.deepEqual(JSON.parse(request.options.body), snapshot);
});

test("generates API-safe campaign slugs", () => {
  assert.equal(slugifyCampaignName("  The Great Pendragon Campaign!  "), "the-great-pendragon-campaign");
  assert.equal(slugifyCampaignName("Épée & Graal"), "epee-graal");
});

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
