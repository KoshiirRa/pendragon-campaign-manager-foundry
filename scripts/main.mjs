import { CampaignApiClient } from "./api-client.mjs";
import { CampaignManagerConfig } from "./config-app.mjs";

const MODULE_ID = "pendragon-campaign-manager";
const DEFAULT_BACKEND = "https://pendragon-campaign-api-wetwnuz4jq-uc.a.run.app";

Hooks.once("init", () => {
  console.info(`${MODULE_ID} | Initializing`);

  game.settings.register(MODULE_ID, "backendUrl", {
    name: "PCM.Settings.BackendUrl.Name",
    hint: "PCM.Settings.BackendUrl.Hint",
    scope: "world",
    config: false,
    type: String,
    default: DEFAULT_BACKEND,
    restricted: true
  });

  game.settings.register(MODULE_ID, "campaignId", {
    name: "PCM.Settings.CampaignId.Name",
    hint: "PCM.Settings.CampaignId.Hint",
    scope: "world",
    config: false,
    type: String,
    default: "",
    restricted: true
  });

  game.settings.register(MODULE_ID, "apiKey", {
    scope: "client",
    config: false,
    type: String,
    default: "",
    restricted: true
  });

  game.settings.registerMenu(MODULE_ID, "connection", {
    name: "PCM.Config.Title",
    label: "PCM.Config.Open",
    hint: "PCM.Config.Hint",
    icon: "fa-solid fa-database",
    type: CampaignManagerConfig,
    restricted: true
  });
});

Hooks.once("ready", () => {
  if (game.system.id !== "pendragon") {
    console.warn(`${MODULE_ID} | Expected system 'pendragon', found '${game.system.id}'`);
  }

  const module = game.modules.get(MODULE_ID);
  module.api = Object.freeze({
    health: () => createClient({ authenticated: false }).health(),
    ready: () => createClient({ authenticated: false }).ready(),
    listCampaigns: () => createClient().listCampaigns(),
    createCampaign: (data) => createClient().createCampaign(data),
    getCampaign: (campaignId = game.settings.get(MODULE_ID, "campaignId")) =>
      createClient().getCampaign(campaignId)
  });
});

function createClient({ authenticated = true } = {}) {
  if (authenticated && !game.user.isGM) {
    throw new Error("Only a Gamemaster may access the Campaign Manager API.");
  }
  return new CampaignApiClient({
    baseUrl: game.settings.get(MODULE_ID, "backendUrl"),
    apiKey: authenticated ? game.settings.get(MODULE_ID, "apiKey") : ""
  });
}
