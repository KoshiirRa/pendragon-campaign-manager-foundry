import { syncActor } from "./actor-sync.mjs";
import { logError, logInfo } from "./logger.mjs";

const MODULE_ID = "pendragon-campaign-manager";
let winterEndPending = false;
let synchronizing = false;

export function registerWinterIntegration({ createClient }) {
  Hooks.on("updateSetting", (setting) => {
    if (setting?.key?.startsWith("Pendragon.")) {
      logInfo("Pendragon setting update observed.", {
        key: setting.key,
        value: parsedSettingValue(setting)
      });
    }
    if (isPendragonWinterSetting(setting)) {
      if (parsedSettingValue(setting) === false) {
        winterEndPending = true;
        logInfo("Winter Phase closure detected; waiting for game-year advance.");
      }
      return;
    }
    if (!isPendragonGameYearSetting(setting)) return;
    const year = Number(setting.value);
    if (winterEndPending) synchronizeCompletedWinter(year, createClient);
    else synchronizeCampaignYear(year, createClient);
  });
  Hooks.on("updateWorldTime", (_worldTime, delta) => {
    if (!winterEndPending) return;
    const nextYear = currentPendragonYear();
    logInfo("World-time advance observed after Winter Phase closure.", { delta, nextYear });
    synchronizeCompletedWinter(nextYear, createClient);
  });
  logInfo("Pendragon Winter Phase end and world-time hooks registered.");
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
  return setting?.key === "Pendragon.winter" && typeof parsedSettingValue(setting) === "boolean";
}

export function isPendragonGameYearSetting(setting) {
  return (
    setting?.key === "Pendragon.gameYear" &&
    Number.isInteger(Number(parsedSettingValue(setting)))
  );
}

export function parsedSettingValue(setting) {
  const value = setting?.value;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function currentPendragonYear() {
  return Number(game.time?.components?.year);
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
