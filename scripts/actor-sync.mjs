import { actorToCharacterPayload, characterUpdatePayload } from "./actor-mapper.mjs";
import { actorToSnapshot } from "./actor-snapshot.mjs";

const MODULE_ID = "pendragon-campaign-manager";

export async function syncActor(actor, { client, campaignId, kind, playerName, familyName, worldId }) {
  if (!campaignId) throw new Error("Select a Campaign Manager campaign before syncing Actors.");
  const flaggedId = actor.getFlag?.(MODULE_ID, "characterId");
  let existing = null;

  if (flaggedId) {
    try {
      existing = await client.getCharacter(campaignId, flaggedId);
    } catch (error) {
      if (error.status !== 404) throw error;
    }
  }
  if (!existing) {
    const characters = await client.listCharacters(campaignId);
    existing = characters.find((character) => character.foundry_uuid === actor.uuid) ?? null;
  }

  const effectiveKind = existing?.kind ?? kind;
  const effectivePlayerName =
    effectiveKind === "player_knight" ? playerName?.trim() || existing?.player_name : null;
  const payload = actorToCharacterPayload(actor, {
    kind: effectiveKind,
    playerName: effectivePlayerName,
    worldId
  });

  const character = existing
    ? await client.updateCharacter(campaignId, existing.id, characterUpdatePayload(payload))
    : await client.createCharacter(campaignId, payload);

  const campaign = await client.getCampaign(campaignId);
  const snapshot = actorToSnapshot(actor, campaign.current_year, { familyName });
  const snapshotResult = await client.syncCharacterSnapshot(campaignId, character.id, snapshot);

  await actor.setFlag?.(MODULE_ID, "characterId", character.id);
  await actor.setFlag?.(MODULE_ID, "characterKind", character.kind);
  await actor.setFlag?.(MODULE_ID, "familyName", familyName?.trim() ?? "");
  await actor.setFlag?.(MODULE_ID, "lastSyncedAt", new Date().toISOString());
  return { character, created: !existing, snapshot: snapshotResult };
}
