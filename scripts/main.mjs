import { CampaignApiClient } from "./api-client.mjs";
import { CampaignManagerConfig } from "./config-app.mjs";
import { registerActorIntegration } from "./actor-integration.mjs";
import { logError, logInfo, logWarn } from "./logger.mjs";

const MODULE_ID = "pendragon-campaign-manager";
const DEFAULT_BACKEND = "https://pendragon-campaign-api-wetwnuz4jq-uc.a.run.app";

logInfo("Main module script loaded.", { version: "0.8.0" });

Hooks.once("init", () => {
  logInfo("init hook fired.", {
    foundryVersion: game.version,
    systemId: game.system.id,
    systemVersion: game.system.version
  });

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
  logInfo("ready hook fired.", {
    moduleActive: game.modules.get(MODULE_ID)?.active,
    moduleVersion: game.modules.get(MODULE_ID)?.version,
    systemId: game.system.id,
    systemVersion: game.system.version,
    userId: game.user.id,
    isGM: game.user.isGM
  });
  if (game.system.id !== "Pendragon") {
    logWarn(`Expected system 'Pendragon', found '${game.system.id}'.`);
  }

  const module = game.modules.get(MODULE_ID);
  module.api = Object.freeze({
    health: () => createClient({ authenticated: false }).health(),
    ready: () => createClient({ authenticated: false }).ready(),
    listCampaigns: () => createClient().listCampaigns(),
    createCampaign: (data) => createClient().createCampaign(data),
    getCampaign: (campaignId = game.settings.get(MODULE_ID, "campaignId")) =>
      createClient().getCampaign(campaignId),
    syncActor: async (actor, options) => {
      const { syncActor } = await import("./actor-sync.mjs");
      return syncActor(actor, {
        client: createClient(),
        campaignId: game.settings.get(MODULE_ID, "campaignId"),
        worldId: game.world.id,
        ...options
      });
    },
    diagnostics: () => diagnostics()
  });
  try {
    registerActorIntegration({ createClient });
  } catch (error) {
    logError("Failed to register Actor synchronization hooks.", error);
  }
  logInfo("Module initialization complete. Run this console command for a status report:");
  console.info(`game.modules.get("${MODULE_ID}").api.diagnostics()`);
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

function diagnostics() {
  const hookNames = [
    "getActorSheetHeaderButtons",
    "getApplicationV1HeaderButtons",
    "getHeaderControlsApplicationV2",
    "getActorDirectoryEntryContext",
    "getActorContextOptions",
    "renderActorSheet"
  ];
  const counts = new Map();
  for (const actor of game.actors) counts.set(actor.type, (counts.get(actor.type) ?? 0) + 1);
  const report = {
    foundryVersion: game.version,
    system: { id: game.system.id, version: game.system.version },
    module: {
      id: MODULE_ID,
      active: game.modules.get(MODULE_ID)?.active,
      version: game.modules.get(MODULE_ID)?.version
    },
    user: { id: game.user.id, isGM: game.user.isGM },
    configuration: {
      backendUrl: game.settings.get(MODULE_ID, "backendUrl"),
      campaignId: game.settings.get(MODULE_ID, "campaignId"),
      apiKeyConfigured: Boolean(game.settings.get(MODULE_ID, "apiKey"))
    },
    actors: Object.fromEntries(counts),
    hooks: Object.fromEntries(
      hookNames.map((name) => [name, Hooks.events?.[name]?.length ?? "unknown"])
    )
  };
  logInfo("Diagnostic report (API key value intentionally omitted).", report);
  return report;
}
