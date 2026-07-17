const MODULE_ID = "pendragon-campaign-manager";

Hooks.once("init", () => {
  console.info(`${MODULE_ID} | Initializing`);

  game.settings.register(MODULE_ID, "backendUrl", {
    name: "PCM.Settings.BackendUrl.Name",
    hint: "PCM.Settings.BackendUrl.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "",
    restricted: true
  });

  game.settings.register(MODULE_ID, "campaignId", {
    name: "PCM.Settings.CampaignId.Name",
    hint: "PCM.Settings.CampaignId.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "",
    restricted: true
  });
});

Hooks.once("ready", () => {
  if (game.system.id !== "pendragon") {
    console.warn(`${MODULE_ID} | Expected system 'pendragon', found '${game.system.id}'`);
  }
});

