import { syncActor } from "./actor-sync.mjs";
import { logError, logInfo } from "./logger.mjs";

const MODULE_ID = "pendragon-campaign-manager";
const timers = new Map();
const syncing = new Set();

export function registerWinterIntegration({ createClient }) {
  const scheduleActor = (actor, reason) => {
    if (!shouldSynchronizeWinterActor(actor) || !isWinterPhaseComplete(actor)) return;
    clearTimeout(timers.get(actor.id));
    timers.set(actor.id, setTimeout(() => synchronizeWinterActor(actor, reason, createClient), 1500));
  };

  Hooks.on("createItem", (item) => {
    if (item.type === "history" && item.system?.source === "winter") scheduleActor(item.parent, "winter-phase-start");
    else if (isWinterActive()) scheduleActor(item.parent, `create-${item.type}`);
  });
  Hooks.on("updateItem", (item) => {
    if (isWinterActive() || item.system?.source === "winter") scheduleActor(item.parent, `update-${item.type}`);
  });
  Hooks.on("deleteItem", (item) => {
    if (isWinterActive()) scheduleActor(item.parent, `delete-${item.type}`);
  });
  Hooks.on("updateActor", (actor) => {
    if (isWinterActive() && !syncing.has(actor.id)) scheduleActor(actor, "update-actor");
  });
  Hooks.on("updateSetting", (setting) => {
    if (!isPendragonGameYearSetting(setting)) return;
    synchronizeCampaignYear(Number(setting.value), createClient);
  });
  logInfo("Pendragon Winter Phase synchronization hooks registered.");
}

export function shouldSynchronizeWinterActor(actor) {
  return Boolean(
    isPrimaryGM() &&
    actor?.documentName === "Actor" &&
    actor.type === "character" &&
    actor.getFlag?.(MODULE_ID, "characterId")
  );
}

export function isPendragonGameYearSetting(setting) {
  return setting?.key === "Pendragon.gameYear" && Number.isInteger(Number(setting.value));
}

export function isWinterPhaseComplete(actor) {
  const status = actor?.system?.status;
  return ["train", "economic", "aging", "squireAge", "horseSurv", "familyRoll", "xp"]
    .every((key) => status?.[key] === false);
}

async function synchronizeWinterActor(actor, reason, createClient) {
  timers.delete(actor.id);
  if (syncing.has(actor.id) || !shouldSynchronizeWinterActor(actor)) return;
  syncing.add(actor.id);
  try {
    const result = await syncActor(actor, {
      client: createClient(),
      campaignId: game.settings.get(MODULE_ID, "campaignId"),
      worldId: game.world.id,
      kind: actor.getFlag(MODULE_ID, "characterKind"),
      familyName: actor.getFlag(MODULE_ID, "familyName")
    });
    logInfo("Winter Phase Actor synchronization completed.", {
      actorId: actor.id,
      reason,
      changed: result.snapshot?.changed
    });
  } catch (error) {
    logError(`Winter Phase synchronization failed for ${actor.name}.`, error);
    ui.notifications.error(`Campaign Manager could not synchronize ${actor.name}'s Winter Phase: ${error.message ?? error}`);
  } finally {
    syncing.delete(actor.id);
  }
}

async function synchronizeCampaignYear(year, createClient) {
  if (!isPrimaryGM() || year < 1 || year > 9999) return;
  const campaignId = game.settings.get(MODULE_ID, "campaignId");
  if (!campaignId) return;
  try {
    await createClient().updateCampaign(campaignId, { current_year: year });
    logInfo("Campaign year synchronized from Pendragon Winter Phase.", { campaignId, year });
  } catch (error) {
    logError("Campaign year synchronization failed.", error);
    ui.notifications.error(`Campaign Manager could not update the campaign year: ${error.message ?? error}`);
  }
}

function isWinterActive() {
  return game.system.id === "Pendragon" && game.settings.get("Pendragon", "winter") === true;
}

function isPrimaryGM() {
  return Boolean(game.user.isGM && (!game.users?.activeGM || game.users.activeGM.id === game.user.id));
}
