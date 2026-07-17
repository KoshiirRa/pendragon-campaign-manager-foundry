import { syncActor } from "./actor-sync.mjs";
import { logError, logInfo } from "./logger.mjs";

const MODULE_ID = "pendragon-campaign-manager";
const SUPPORTED_TYPES = new Set(["character", "npc", "follower"]);

export function registerActorIntegration({ createClient }) {
  logInfo("Registering Actor synchronization hooks.");
  const addSheetButton = (application, buttons) => {
    const actor = application.actor;
    logInfo("Actor sheet header hook fired.", {
      application: application.constructor?.name,
      actorId: actor?.id,
      actorName: actor?.name,
      actorType: actor?.type,
      isGM: game.user.isGM,
      existingButtons: buttons.map((button) => button.class ?? button.label)
    });
    if (!game.user.isGM || !actor || !SUPPORTED_TYPES.has(actor.type)) return;
    if (buttons.some((button) => button.class === "pcm-sync-actor")) return;
    buttons.unshift({
      label: actor.getFlag(MODULE_ID, "characterId") ? "PCM.Actor.Resync" : "PCM.Actor.Sync",
      class: "pcm-sync-actor",
      icon: "fa-solid fa-cloud-arrow-up",
      onclick: () => synchronize(actor, createClient)
    });
  };
  Hooks.on("getActorSheetHeaderButtons", addSheetButton);
  Hooks.on("getApplicationV1HeaderButtons", addSheetButton);

  const addV2HeaderControl = (application, controls) => {
    const actor = application.actor ?? application.document;
    logInfo("ApplicationV2 header controls hook fired.", {
      application: application.constructor?.name,
      documentName: actor?.documentName,
      actorId: actor?.id,
      actorName: actor?.name,
      actorType: actor?.type,
      isGM: game.user.isGM,
      existingControls: controls.map((control) => control.action ?? control.label)
    });
    if (!game.user.isGM || actor?.documentName !== "Actor" || !SUPPORTED_TYPES.has(actor.type)) return;
    if (controls.some((control) => control.action === "pcm-sync-actor")) return;
    controls.unshift({
      action: "pcm-sync-actor",
      icon: "fa-solid fa-cloud-arrow-up",
      label: "PCM.Actor.Sync",
      visible: true,
      onClick: () => synchronize(actor, createClient)
    });
  };
  Hooks.on("getHeaderControlsApplicationV2", addV2HeaderControl);

  const addDirectoryOption = (_application, options) => {
    logInfo("Actor Directory context hook fired.", {
      application: _application?.constructor?.name,
      isGM: game.user.isGM,
      existingOptions: options.map((option) => option.name)
    });
    if (options.some((option) => option.name === "PCM.Actor.Sync")) return;
    options.push({
      name: "PCM.Actor.Sync",
      icon: '<i class="fa-solid fa-cloud-arrow-up"></i>',
      condition: (target) => {
        const actor = actorFromTarget(target);
        return game.user.isGM && actor && SUPPORTED_TYPES.has(actor.type);
      },
      callback: (target) => synchronize(actorFromTarget(target), createClient)
    });
  };
  Hooks.on("getActorDirectoryEntryContext", addDirectoryOption);
  Hooks.on("getActorContextOptions", addDirectoryOption);
  Hooks.on("renderActorSheet", (application) => {
    logInfo("Legacy renderActorSheet hook fired.", {
      application: application.constructor?.name,
      actorId: application.actor?.id,
      actorName: application.actor?.name,
      actorType: application.actor?.type
    });
  });
  logInfo("Actor synchronization hook registration complete.", hookRegistrationCounts());
}

async function synchronize(actor, createClient) {
  if (!actor) return;
  const selection = await chooseCharacterKind(actor);
  if (!selection) return;
  try {
    const result = await syncActor(actor, {
      client: createClient(),
      campaignId: game.settings.get(MODULE_ID, "campaignId"),
      worldId: game.world.id,
      ...selection
    });
    const message = result.created ? "PCM.Actor.Created" : "PCM.Actor.Updated";
    ui.notifications.info(game.i18n.format(message, { name: actor.name }));
  } catch (error) {
    logError(`Actor synchronization failed for ${actor.name}.`, error);
    ui.notifications.error(error.message ?? String(error), { permanent: true });
  }
}

function hookRegistrationCounts() {
  const names = [
    "getActorSheetHeaderButtons",
    "getApplicationV1HeaderButtons",
    "getHeaderControlsApplicationV2",
    "getActorDirectoryEntryContext",
    "getActorContextOptions",
    "renderActorSheet"
  ];
  return Object.fromEntries(names.map((name) => [name, Hooks.events?.[name]?.length ?? "unknown"]));
}

async function chooseCharacterKind(actor) {
  const owner = game.users.find(
    (user) => !user.isGM && actor.testUserPermission(user, "OWNER")
  );
  const linkedId = actor.getFlag(MODULE_ID, "characterId");
  const defaultKind = actor.type === "character" && owner ? "player_knight" : "npc";
  const formData = await foundry.applications.api.DialogV2.input({
    window: { title: game.i18n.localize(linkedId ? "PCM.Actor.Resync" : "PCM.Actor.Sync") },
    content: `
      <div class="form-group">
        <label>${game.i18n.localize("PCM.Actor.Kind")}</label>
        <select name="kind">
          <option value="player_knight" ${defaultKind === "player_knight" ? "selected" : ""}>${game.i18n.localize("PCM.Actor.PlayerKnight")}</option>
          <option value="npc" ${defaultKind === "npc" ? "selected" : ""}>${game.i18n.localize("PCM.Actor.Npc")}</option>
        </select>
      </div>
      <div class="form-group">
        <label>${game.i18n.localize("PCM.Actor.PlayerName")}</label>
        <input name="playerName" type="text" value="${escapeHtml(owner?.name ?? "")}">
      </div>`,
    ok: { label: game.i18n.localize("PCM.Actor.SyncNow") },
    rejectClose: false
  });
  if (!formData) return null;
  return { kind: formData.get("kind"), playerName: formData.get("playerName") };
}

function actorFromTarget(target) {
  const element = target instanceof HTMLElement ? target : target?.[0];
  const entry = element?.closest?.("[data-entry-id]") ?? element;
  return game.actors.get(entry?.dataset?.entryId);
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = value;
  return element.innerHTML;
}
