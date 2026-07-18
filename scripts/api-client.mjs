export class CampaignApiError extends Error {
  constructor(message, { status = null, details = null } = {}) {
    super(message);
    this.name = "CampaignApiError";
    this.status = status;
    this.details = details;
  }
}

export class CampaignApiClient {
  constructor({ baseUrl, apiKey, fetchImpl = globalThis.fetch }) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.apiKey = apiKey?.trim() ?? "";
    this.fetch = fetchImpl.bind(globalThis);
  }

  async health() {
    return this.#request("/health", { authenticated: false });
  }

  async ready() {
    return this.#request("/ready", { authenticated: false });
  }

  async listCampaigns() {
    return this.#request("/api/v1/campaigns");
  }

  async getCampaign(campaignId) {
    return this.#request(`/api/v1/campaigns/${encodeURIComponent(campaignId)}`);
  }

  async listCharacters(campaignId) {
    return this.#request(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/characters`);
  }

  async getCharacter(campaignId, characterId) {
    return this.#request(
      `/api/v1/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(characterId)}`
    );
  }

  async createCharacter(campaignId, data) {
    return this.#request(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/characters`, {
      method: "POST",
      body: data
    });
  }

  async updateCharacter(campaignId, characterId, data) {
    return this.#request(
      `/api/v1/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(characterId)}`,
      { method: "PATCH", body: data }
    );
  }

  async syncCharacterSnapshot(campaignId, characterId, data) {
    return this.#request(
      `/api/v1/campaigns/${encodeURIComponent(campaignId)}/characters/${encodeURIComponent(characterId)}/foundry-snapshot`,
      { method: "POST", body: data }
    );
  }

  async createCampaign(data) {
    return this.#request("/api/v1/campaigns", { method: "POST", body: data });
  }

  async listManors(campaignId) {
    return this.#request(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/manors`);
  }

  async createManor(campaignId, data) {
    return this.#request(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/manors`, { method: "POST", body: data });
  }

  async addManorTenure(campaignId, manorId, data) {
    return this.#request(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/manors/${encodeURIComponent(manorId)}/tenures`, { method: "POST", body: data });
  }

  async createManorResolution(campaignId, manorId, data) {
    return this.#request(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/manors/${encodeURIComponent(manorId)}/annual-resolutions`, { method: "POST", body: data });
  }

  async #request(path, { authenticated = true, method = "GET", body = undefined } = {}) {
    if (!this.baseUrl) throw new CampaignApiError("Campaign Manager API URL is not configured.");
    if (authenticated && !this.apiKey) {
      throw new CampaignApiError("Campaign Manager API key is not configured.");
    }

    const headers = { Accept: "application/json" };
    if (authenticated) headers["X-API-Key"] = this.apiKey;
    if (body !== undefined) headers["Content-Type"] = "application/json";

    let response;
    try {
      response = await this.fetch(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    } catch (error) {
      throw new CampaignApiError(`Could not reach Campaign Manager: ${error.message}`, {
        details: error
      });
    }

    const payload = await readPayload(response);
    if (!response.ok) {
      const detail = typeof payload?.detail === "string" ? payload.detail : response.statusText;
      throw new CampaignApiError(`Campaign Manager request failed (${response.status}): ${detail}`, {
        status: response.status,
        details: payload
      });
    }
    return payload;
  }
}

export function normalizeBaseUrl(value) {
  const input = value?.trim();
  if (!input) return "";
  const url = new URL(input);
  if (url.protocol !== "https:" && !isLocalDevelopmentHost(url)) {
    throw new CampaignApiError("Campaign Manager API URL must use HTTPS.");
  }
  return url.toString().replace(/\/$/, "");
}

export function slugifyCampaignName(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function readPayload(response) {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function isLocalDevelopmentHost(url) {
  return url.protocol === "http:" && ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
}
