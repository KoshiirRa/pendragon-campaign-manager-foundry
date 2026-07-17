import assert from "node:assert/strict";
import test from "node:test";

import {
  CampaignApiClient,
  CampaignApiError,
  normalizeBaseUrl
} from "../scripts/api-client.mjs";

test("normalizes production and local development URLs", () => {
  assert.equal(normalizeBaseUrl("https://api.example.com/"), "https://api.example.com");
  assert.equal(normalizeBaseUrl("http://localhost:8000/"), "http://localhost:8000");
  assert.throws(() => normalizeBaseUrl("http://api.example.com"), CampaignApiError);
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

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
