import { syncActor } from "./actor-sync.mjs";
import { logError, logInfo } from "./logger.mjs";

const MODULE_ID = "pendragon-campaign-manager";
let winterEndPending = false;
let synchronizing = false;

export function registerWinterIntegration({ createClient }) {
  Hooks.on("updateSetting", (setting) => {
    if (isPendragonWinterSetting(setting)) {
      if (setting.value === false) winterEndPending = true;
      return;
    }
    if (!isPendragonGameYearSetting(setting)) return;
    const year = Number(setting.value);
    if (winterEndPending) synchronizeCompletedWinter(year, createClient);
    else synchronizeCampaignYear(year, createClient);
  });
  logInfo("Pendragon Winter Phase end hook registered.");
}

export function shouldSynchronizeWinterActor(actor) {
  return Boolean(
    isPrimaryGM() &&
    actor?.documentName === "Actor" &&
    actor.type === "character" &&
    actor.getFlag?.(MODULE_ID, "characterId")
  );
}

export function isPendragonWinterSetting(setting) {
  return setting?.key === "Pendragon.winter" && typeof setting.value === "boolean";
}

export function isPendragonGameYearSetting(setting) {
  return setting?.key === "Pendragon.gameYear" && Number.isInteger(Number(setting.value));
}

async function synchronizeCompletedWinter(nextYear, createClient) {
  if (!isPrimaryGM() || synchronizing || nextYear < 1 || nextYear > 9999) return;
  synchronizing = true;
  const actors = game.actors.contents.filter(shouldSynchronizeWinterActor);
  let completed = 0;
  try {
    for (const actor of actors) {
      await syncActor(actor, {
        client: createClient(),
        campaignId: game.settings.get(MODULE_ID, "campaignId"),
        worldId: game.world.id,
        kind: actor.getFlag(MODULE_ID, "characterKind"),
        familyName: actor.getFlag(MODULE_ID, "familyName")
      });
      completed += 1;
    }
    await synchronizeCampaignYear(nextYear, createClient);
    winterEndPending = false;
    logInfo("Completed Winter Phase synchronized.", { actors: completed, nextYear });
    ui.notifications.info(`Campaign Manager synchronized Winter Phase for ${completed} linked character${completed === 1 ? "" : "s"}.`);
  } catch (error) {
    logError("Completed Winter Phase synchronization failed.", error);
    ui.notifications.error(`Campaign Manager could not synchronize the completed Winter Phase: ${error.message ?? error}`, { permanent: true });
  } finally {
    synchronizing = false;
  }
}

async function synchronizeCampaignYear(year, createClient) {
  if (!isPrimaryGM() || year < 1 || year > 9999) return;
  const campaignId = game.settings.get(MODULE_ID, "campaignId");
  if (!campaignId) return;
  await createClient().updateCampaign(campaignId, { current_year: year });
  logInfo("Campaign year synchronized from Pendragon.", { campaignId, year });
}

function isPrimaryGM() {
  return Boolean(game.user.isGM && (!game.users?.activeGM || game.users.activeGM.id === game.user.id));
}
